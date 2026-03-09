from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class AnalyzeRequest(BaseModel):
    content: str
    is_url: bool = False

def fetch_article_text(url: str) -> str:
    try:
        from newspaper import Article
        article = Article(url)
        article.download()
        article.parse()
        return article.text
    except:
        return ""

def analyze_with_claude(text: str) -> dict:
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

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    import json
    response_text = message.content[0].text.strip()
    return json.loads(response_text)

@app.get("/")
def root():
    return {"status": "TruthLens API is running"}

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    text = ""

    if request.is_url:
        text = fetch_article_text(request.content)
        if not text:
            return {"error": "Could not extract article from URL. Try pasting the text directly."}
    else:
        text = request.content

    if len(text.strip()) < 50:
        return {"error": "Not enough text to analyze. Please paste more content."}

    result = analyze_with_claude(text)
    return result