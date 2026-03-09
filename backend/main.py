from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
import anthropic
import httpx
import asyncio
import json
import os
from dotenv import load_dotenv

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://.*",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class AnalyzeRequest(BaseModel):
    content: str
    is_url: bool = False

def is_readable_english(text: str) -> tuple[bool, str]:
    """Returns (is_valid, error_message). Checks text is plausibly readable English prose."""
    stripped = text.strip()

    # Must have enough words
    words = stripped.split()
    if len(words) < 20:
        return False, "Please paste a full article — the text is too short to analyze."

    # Reject if too many non-ASCII characters (likely binary/garbled data)
    non_ascii = sum(1 for c in stripped if ord(c) > 127)
    if non_ascii / len(stripped) > 0.3:
        return False, "The text doesn't appear to be readable English content."

    # Reject if average word length is suspiciously high (random chars, base64, code)
    avg_word_len = sum(len(w) for w in words) / len(words)
    if avg_word_len > 20:
        return False, "The text doesn't look like readable prose. Please paste a news article."

    # Reject if it looks like code (high density of punctuation like {, }, ;, =, <>)
    code_chars = sum(1 for c in stripped if c in "{}[];<>=|\\")
    if code_chars / len(stripped) > 0.05:
        return False, "The text appears to be code or markup, not a news article."

    # Reject if it's mostly repeated characters or patterns (spam)
    unique_chars = len(set(stripped.lower()))
    if unique_chars < 15:
        return False, "The text doesn't appear to be readable content."

    # Must contain at least a few common English words
    common_words = {"the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
                    "to", "of", "and", "or", "but", "for", "with", "that", "this", "it"}
    words_lower = {w.lower().strip(".,!?\"'") for w in words}
    if len(common_words & words_lower) < 3:
        return False, "The text doesn't appear to be readable English. Please paste a news article."

    return True, ""

async def fetch_article_text(url: str) -> str:
    # Try newspaper3k first (runs in a thread since it's blocking)
    try:
        def _newspaper_fetch():
            from newspaper import Article
            article = Article(url)
            article.download()
            article.parse()
            return article.text if (article.text and len(article.text) > 100) else ""

        text = await asyncio.to_thread(_newspaper_fetch)
        if text:
            return text
    except Exception:
        pass

    # Fallback: fetch with httpx + BeautifulSoup
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(url, headers=headers, timeout=10)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return text[:5000]
    except Exception:
        return ""

async def analyze_with_claude(text: str) -> dict:
    prompt = f"""You are a media analysis AI. Analyze the following article and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

Article:
{text[:4000]}

Return this exact JSON structure:
{{
  "bias_score": <integer from 0 to 100, where 0=far left, 50=center, 100=far right>,
  "bias_label": "<one of: Far Left, Left, Center-Left, Center, Center-Right, Right, Far Right>",
  "credibility_score": <integer from 0 to 100, where 100=highly credible>,
  "credibility_label": "<one of: Unreliable, Low Credibility, Mixed, Credible, Highly Credible>",
  "manipulation_score": <integer from 0 to 100, where 100=extremely manipulative/sensational>,
  "manipulation_label": "<one of: Neutral, Mild, Moderate, Sensational, Extreme>",
 "rhetoric": {{
    "devices_found": ["<device 1>", "<device 2>"],
    "loaded_language": ["<word or phrase 1>", "<word or phrase 2>", "<word or phrase 3>"],
    "rhetoric_score": <integer from 0 to 100, where 100=extremely manipulative rhetoric>,
    "rhetoric_label": "<one of: Clean, Mild Rhetoric, Moderate Rhetoric, Heavy Rhetoric, Propaganda>"
  }},
   "key_claims": [
    "<claim 1>",
    "<claim 2>",
    "<claim 3>",
    "<claim 4>",
    "<claim 5>"
  ],
  "summary": "<one sentence summary of what this article is about>"
}}

For rhetoric devices_found, identify any of these if present: Fear-mongering, Straw man, False dichotomy, Appeal to emotion, Ad hominem, Bandwagon, Scapegoating, Slippery slope, Cherry-picking, Whataboutism. Only include ones actually present.

"""

    async def call_claude(p: str) -> str:
        try:
            message = await client.messages.create(
                model="claude-opus-4-5",
                max_tokens=1024,
                messages=[{"role": "user", "content": p}]
            )
            return message.content[0].text.strip()
        except Exception as e:
            raise RuntimeError(f"Claude API error: {e}") from e

    try:
        response_text = await call_claude(prompt)
    except RuntimeError as e:
        return {"error": str(e)}

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Retry once with a stricter reminder
        retry_prompt = prompt + "\nIMPORTANT: Your previous response was not valid JSON. Return ONLY the raw JSON object, nothing else."
        try:
            response_text = await call_claude(retry_prompt)
        except RuntimeError as e:
            return {"error": str(e)}
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return {"error": "Analysis failed: could not parse response. Please try again."}

@app.get("/")
def root():
    return {"status": "TruthLens API is running"}

@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, body: AnalyzeRequest):
    if not os.getenv("ANTHROPIC_API_KEY"):
        return {"error": "Server configuration error: ANTHROPIC_API_KEY is not set. Contact the administrator."}

    text = ""

    if body.is_url:
        text = await fetch_article_text(body.content)
        if not text:
            return {"error": "Could not extract article from URL. Try pasting the text directly."}
    else:
        text = body.content

    if len(text.strip()) < 50:
        return {"error": "Not enough text to analyze. Please paste more content."}

    valid, error_msg = is_readable_english(text)
    if not valid:
        return {"error": error_msg}

    result = await analyze_with_claude(text)
    return result
