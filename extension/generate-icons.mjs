import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

const sizes = [16, 48, 128]

for (const size of sizes) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Background
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, '#16a34a')
    grad.addColorStop(0.5, '#22c55e')
    grad.addColorStop(1, '#2aaefa')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    ctx.fill()

    // Letter T
    ctx.fillStyle = 'white'
    ctx.font = `bold ${size * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('T', size / 2, size / 2)

    writeFileSync(`public/icon${size}.png`, canvas.toBuffer('image/png'))
    console.log(`Created icon${size}.png`)
}