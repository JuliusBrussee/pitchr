from __future__ import annotations

from pathlib import Path
from typing import Tuple
import math
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1584, 396

FONT_DIR = Path(r"C:\dev\nimbus\.opencode\skills\canvas-design\canvas-fonts")
OUT_DIR = Path('branding')


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def mix(c1: Tuple[int, int, int], c2: Tuple[int, int, int], t: float) -> Tuple[int, int, int]:
    return (lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t))


def base_canvas() -> Image.Image:
    img = Image.new('RGB', (W, H), '#090909')
    draw = ImageDraw.Draw(img)

    left = (7, 9, 12)
    right = (16, 18, 24)
    for x in range(W):
        t = x / (W - 1)
        draw.line([(x, 0), (x, H)], fill=mix(left, right, t))

    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((90, -150, 820, 530), fill=(255, 89, 65, 72))
    g.ellipse((620, -170, 1500, 520), fill=(255, 170, 51, 46))
    g.ellipse((900, 120, 1600, 640), fill=(230, 59, 38, 48))
    glow = glow.filter(ImageFilter.GaussianBlur(58))
    img = Image.alpha_composite(img.convert('RGBA'), glow)

    texture = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    t = ImageDraw.Draw(texture)
    for x in range(0, W, 56):
        t.line([(x, 0), (x, H)], fill=(255, 255, 255, 14), width=1)
    for y in range(0, H, 52):
        t.line([(0, y), (W, y)], fill=(255, 255, 255, 10), width=1)
    texture = texture.filter(ImageFilter.GaussianBlur(0.4))
    img = Image.alpha_composite(img, texture)

    vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    for i in range(1, 28):
        a = int(i * 1.7)
        vd.rounded_rectangle((i * 2, i * 2, W - i * 2, H - i * 2), radius=36, outline=(0, 0, 0, a), width=3)

    return Image.alpha_composite(img, vignette)


def draw_smooth_ring(
    base: Image.Image,
    center: Tuple[int, int],
    radius: int,
    track_width: int,
    progress: float,
    track_color: Tuple[int, int, int, int] = (255, 255, 255, 50),
    start_color: Tuple[int, int, int] = (255, 170, 51),
    end_color: Tuple[int, int, int] = (255, 89, 65),
) -> None:
    scale = 4
    layer = Image.new('RGBA', (W * scale, H * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    cx, cy = center[0] * scale, center[1] * scale
    r = radius * scale
    stroke = track_width * scale

    bbox = (cx - r, cy - r, cx + r, cy + r)
    d.arc(bbox, start=-90, end=270, fill=track_color, width=stroke)

    degrees = max(0, min(360, int(360 * progress)))
    for i in range(degrees):
        t = i / max(1, degrees - 1)
        col = (*mix(start_color, end_color, t), 255)
        d.arc(bbox, start=-90 + i, end=-90 + i + 1.4, fill=col, width=stroke)

    # Rounded caps improve perceived smoothness.
    start_angle = math.radians(-90)
    end_angle = math.radians(-90 + degrees)
    cap_r = stroke / 2
    sx = cx + r * math.cos(start_angle)
    sy = cy + r * math.sin(start_angle)
    ex = cx + r * math.cos(end_angle)
    ey = cy + r * math.sin(end_angle)
    d.ellipse((sx - cap_r, sy - cap_r, sx + cap_r, sy + cap_r), fill=(*start_color, 255))
    d.ellipse((ex - cap_r, ey - cap_r, ex + cap_r, ey + cap_r), fill=(*end_color, 255))

    aa = layer.resize((W, H), Image.Resampling.LANCZOS)
    base.alpha_composite(aa)


def draw_text_centered(
    draw: ImageDraw.ImageDraw,
    center: Tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: Tuple[int, int, int, int],
) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    x = center[0] - (bbox[0] + bbox[2]) / 2
    y = center[1] - (bbox[1] + bbox[3]) / 2
    draw.text((x, y), text, font=font, fill=fill)


def draw_common_left(draw: ImageDraw.ImageDraw, compact: bool = False) -> None:
    mono = ImageFont.truetype(str(FONT_DIR / 'GeistMono-Regular.ttf'), 17)
    headline = ImageFont.truetype(str(FONT_DIR / 'BricolageGrotesque-Bold.ttf'), 84)
    body = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 27)
    chip = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 20)

    ax, ay = 210, 65
    draw.text((ax, ay), 'AI PITCH COACH FOR FOUNDERS', font=mono, fill=(255, 171, 120, 210))
    draw.ellipse((ax, ay + 52, ax + 18, ay + 70), fill=(255, 89, 65, 255))
    draw.text((ax + 30, ay + 34), 'Pitchr', font=headline, fill=(244, 245, 248, 255))

    msg = 'Record or paste your pitch. Get investor-grade scoring,\nranked fixes, AI rewrites, and delivery metrics in seconds.'
    draw.text((ax, ay + 138), msg, font=body, fill=(222, 226, 234, 240), spacing=8)

    if compact:
        chips = ['Live STT', 'VC Q&A Drills', 'Deck + Miro Export']
    else:
        chips = ['Live STT', 'Async Analysis Runs', 'VC Q&A Drills', 'Deck + Miro Export']

    x, y = ax, 300
    for text in chips:
        tw = draw.textlength(text, font=chip)
        w = int(tw + 32)
        draw.rounded_rectangle((x, y, x + w, y + 40), radius=12, fill=(18, 22, 30, 188), outline=(255, 255, 255, 42), width=1)
        draw.text((x + 16, y + 9), text, font=chip, fill=(236, 238, 243, 230))
        x += w + 10


def draw_center_value(
    draw: ImageDraw.ImageDraw,
    center: Tuple[int, int],
    score: int,
    size: int = 42,
    show_label: bool = True,
    label_offset: int = 33,
) -> None:
    cx, cy = center
    value_font = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Bold.ttf'), size)
    label_font = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 10)

    draw.ellipse((cx - 40, cy - 40, cx + 40, cy + 40), fill=(8, 10, 16, 240), outline=(255, 255, 255, 36), width=2)
    draw_text_centered(draw, (cx, cy), str(score), value_font, (255, 246, 241, 255))
    if show_label:
        draw_text_centered(draw, (cx, cy + label_offset), 'SCORE', label_font, (255, 182, 145, 225))


def variant_primary() -> Image.Image:
    img = base_canvas()
    draw = ImageDraw.Draw(img)
    draw_common_left(draw)

    panel = (1044, 48, 1524, 348)
    draw.rounded_rectangle(panel, radius=22, fill=(8, 10, 15, 180), outline=(255, 255, 255, 54), width=2)

    title_font = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Bold.ttf'), 24)
    body_font = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 17)
    draw.rectangle((1068, 72, 1076, 126), fill=(255, 89, 65, 255))
    draw.text((1090, 70), 'Investor-Ready Trajectory', font=title_font, fill=(245, 246, 248, 250))
    draw.text((1090, 102), 'From rough take to confident close', font=body_font, fill=(196, 201, 212, 225))

    center = (1148, 220)
    draw_smooth_ring(img, center=center, radius=62, track_width=12, progress=0.83)
    draw_center_value(draw, center, 83, show_label=False)
    score_label_font = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 11)
    draw.text((center[0], center[1] + 73), 'SCORE', font=score_label_font, fill=(255, 182, 145, 225), anchor='mm')

    items = [
        '5-dimension VC scoring',
        'Prioritized fix list + AI rewrite',
        'Delivery timing + filler metrics',
    ]
    y = 178
    for item in items:
        draw.ellipse((1268, y + 8, 1274, y + 14), fill=(255, 170, 51, 255))
        draw.text((1284, y), item, font=body_font, fill=(226, 229, 236, 236))
        y += 42

    mono = ImageFont.truetype(str(FONT_DIR / 'GeistMono-Regular.ttf'), 17)
    draw.text((1295, 358), 'pitchr.app', font=mono, fill=(255, 255, 255, 150))
    return img.convert('RGB')


def variant_alt_01() -> Image.Image:
    img = base_canvas()
    draw = ImageDraw.Draw(img)
    draw_common_left(draw, compact=True)

    panel = (980, 46, 1526, 350)
    draw.rounded_rectangle(panel, radius=24, fill=(7, 9, 14, 190), outline=(255, 255, 255, 54), width=2)

    title_font = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Bold.ttf'), 25)
    mono = ImageFont.truetype(str(FONT_DIR / 'GeistMono-Regular.ttf'), 16)
    draw.text((1012, 76), 'Score Confidence Map', font=title_font, fill=(244, 246, 248, 250))
    draw.text((1012, 108), 'Signal quality before investor meetings', font=mono, fill=(196, 201, 212, 225))

    center = (1120, 212)
    draw_smooth_ring(img, center=center, radius=78, track_width=14, progress=0.83)
    draw_center_value(draw, center, 83, size=66)

    small = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 18)
    labels = [('Structure', 0.84), ('Clarity', 0.81), ('Evidence', 0.79), ('Delivery', 0.88)]
    x0, y0 = 1242, 168
    for name, val in labels:
        draw.text((x0, y0), name, font=small, fill=(223, 227, 235, 240))
        bar_x = x0 + 90
        draw.rounded_rectangle((bar_x, y0 + 6, bar_x + 150, y0 + 14), radius=4, fill=(255, 255, 255, 35))
        draw.rounded_rectangle((bar_x, y0 + 6, bar_x + int(150 * val), y0 + 14), radius=4, fill=(255, 145, 86, 235))
        y0 += 38

    draw.text((1300, 356), 'pitchr.app', font=mono, fill=(255, 255, 255, 150))
    return img.convert('RGB')


def variant_alt_02() -> Image.Image:
    img = base_canvas()
    draw = ImageDraw.Draw(img)
    draw_common_left(draw)

    panel = (996, 46, 1526, 350)
    draw.rounded_rectangle(panel, radius=24, fill=(6, 8, 13, 190), outline=(255, 255, 255, 54), width=2)

    center = (1160, 200)
    draw_smooth_ring(img, center=center, radius=86, track_width=16, progress=0.83)
    draw_center_value(draw, center, 83, size=70)

    mono = ImageFont.truetype(str(FONT_DIR / 'GeistMono-Regular.ttf'), 16)
    title = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Bold.ttf'), 26)
    draw.text((1266, 94), 'Investor-Ready', font=title, fill=(245, 246, 248, 250))
    draw.text((1266, 126), 'Fast feedback loop', font=mono, fill=(196, 201, 212, 225))

    stats = [('1', 'Run analysis'), ('2', 'Apply ranked fixes'), ('3', 'Rehearse and improve')]
    body = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 18)
    y = 178
    for n, txt in stats:
        draw.rounded_rectangle((1266, y - 2, 1288, y + 20), radius=8, fill=(255, 89, 65, 220))
        draw.text((1273, y + 1), n, font=mono, fill=(255, 255, 255, 245))
        draw.text((1298, y), txt, font=body, fill=(225, 229, 236, 240))
        y += 44

    draw.text((1266, 318), '5 dimensions scored fast', font=mono, fill=(255, 178, 145, 230))
    draw.text((1300, 356), 'pitchr.app', font=mono, fill=(255, 255, 255, 150))
    return img.convert('RGB')


def variant_alt_03() -> Image.Image:
    img = base_canvas()
    draw = ImageDraw.Draw(img)
    draw_common_left(draw)

    panel = (1006, 46, 1528, 350)
    draw.rounded_rectangle(panel, radius=24, fill=(7, 9, 14, 194), outline=(255, 255, 255, 54), width=2)

    center = (1124, 210)
    draw_smooth_ring(img, center=center, radius=72, track_width=12, progress=0.83)
    draw_center_value(draw, center, 83, size=62)

    mono = ImageFont.truetype(str(FONT_DIR / 'GeistMono-Regular.ttf'), 16)
    title = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Bold.ttf'), 24)
    body = ImageFont.truetype(str(FONT_DIR / 'InstrumentSans-Regular.ttf'), 17)

    draw.text((1248, 84), 'Pitch Readiness Snapshot', font=title, fill=(245, 246, 248, 250))
    draw.text((1248, 116), 'Real-time + asynchronous coaching', font=mono, fill=(196, 201, 212, 225))

    cards = [('Fixes', '12', 'Ranked by impact'), ('Q&A', '60s', 'VC drill mode'), ('Deck', 'PDF', 'Attach and analyze')]
    x = 1248
    y = 160
    for name, value, sub in cards:
        draw.rounded_rectangle((x, y, x + 250, y + 54), radius=12, fill=(20, 24, 32, 170), outline=(255, 255, 255, 40), width=1)
        draw.text((x + 14, y + 7), name, font=mono, fill=(255, 179, 146, 230))
        draw.text((x + 14, y + 27), value, font=title, fill=(244, 246, 250, 250))
        draw.text((x + 92, y + 31), sub, font=body, fill=(220, 225, 232, 225))
        y += 62

    draw.text((1300, 356), 'pitchr.app', font=mono, fill=(255, 255, 255, 150))
    return img.convert('RGB')


def write_svg_variant(path: Path) -> None:
    cx = 1148
    cy = 220
    radius = 62
    progress = 0.83
    circumference = 2 * math.pi * radius
    dash = circumference * progress

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1584" height="396" viewBox="0 0 1584 396" role="img" aria-label="Pitchr LinkedIn banner">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#07090c"/>
      <stop offset="100%" stop-color="#101218"/>
    </linearGradient>
    <radialGradient id="glowCoral" cx="28%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ff5941" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#ff5941" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowAmber" cx="70%" cy="40%" r="52%">
      <stop offset="0%" stop-color="#ffaa33" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffaa33" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffaa33"/>
      <stop offset="100%" stop-color="#ff5941"/>
    </linearGradient>
    <pattern id="grid" width="56" height="52" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V52" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1584" height="396" fill="url(#bgGrad)"/>
  <rect width="1584" height="396" fill="url(#glowCoral)"/>
  <rect width="1584" height="396" fill="url(#glowAmber)"/>
  <rect width="1584" height="396" fill="url(#grid)" opacity="0.22"/>

  <text x="210" y="82" fill="#ffab78" font-family="Consolas, 'Courier New', monospace" font-size="18" letter-spacing="1.2">AI PITCH COACH FOR FOUNDERS</text>
  <circle cx="220" cy="126" r="10" fill="#ff5941"/>
  <text x="240" y="177" fill="#f4f5f8" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="66" font-weight="700">Pitchr</text>

  <text x="210" y="230" fill="#dee2ea" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="28">
    <tspan x="210" dy="0">Record or paste your pitch. Get investor-grade scoring,</tspan>
    <tspan x="210" dy="34">ranked fixes, AI rewrites, and delivery metrics in seconds.</tspan>
  </text>

  <g fill="#121620" stroke="#ffffff" stroke-opacity="0.28">
    <rect x="210" y="301" width="115" height="40" rx="12"/>
    <rect x="335" y="301" width="218" height="40" rx="12"/>
    <rect x="563" y="301" width="163" height="40" rx="12"/>
    <rect x="736" y="301" width="208" height="40" rx="12"/>
  </g>
  <g fill="#eceef3" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="18">
    <text x="226" y="328">Live STT</text>
    <text x="351" y="328">Async Analysis Runs</text>
    <text x="579" y="328">VC Q&amp;A Drills</text>
    <text x="752" y="328">Deck + Miro Export</text>
  </g>

  <rect x="1044" y="48" width="480" height="300" rx="22" fill="#080a10" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.54" stroke-width="2"/>
  <rect x="1068" y="72" width="8" height="54" fill="#ff5941"/>
  <text x="1090" y="94" fill="#f5f6f8" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="26" font-weight="700">Investor-Ready Trajectory</text>
  <text x="1090" y="122" fill="#c4c9d4" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="18">From rough take to confident close</text>

  <circle cx="{cx}" cy="{cy}" r="{radius}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="12"/>
  <circle cx="{cx}" cy="{cy}" r="{radius}" fill="none" stroke="url(#ringGrad)" stroke-width="12" stroke-linecap="round"
          transform="rotate(-90 {cx} {cy})" stroke-dasharray="{dash:.2f} {circumference:.2f}"/>
  <circle cx="{cx}" cy="{cy}" r="40" fill="#080a10" fill-opacity="0.95" stroke="#ffffff" stroke-opacity="0.28" stroke-width="2"/>
  <text x="{cx}" y="{cy}" fill="#fff6f1" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="50" font-weight="700" text-anchor="middle" dominant-baseline="middle">83</text>
  <text x="{cx}" y="{cy + 88}" fill="#ffb691" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle">SCORE</text>

  <g fill="#ffaa33">
    <circle cx="1271" cy="186" r="3"/>
    <circle cx="1271" cy="228" r="3"/>
    <circle cx="1271" cy="270" r="3"/>
  </g>
  <g fill="#e2e5ec" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="18">
    <text x="1284" y="197">5-dimension VC scoring</text>
    <text x="1284" y="239">Prioritized fix list + AI rewrite</text>
    <text x="1284" y="281">Delivery timing + filler metrics</text>
  </g>

  <text x="1295" y="375" fill="#ffffff" fill-opacity="0.60" font-family="Consolas, 'Courier New', monospace" font-size="18">pitchr.app</text>
</svg>
"""
    path.write_text(svg, encoding='utf-8')


def render_png_from_svg(svg_path: Path, png_path: Path) -> None:
    cmd = [
        'npx',
        'playwright',
        'screenshot',
        '--browser',
        'chromium',
        '--viewport-size',
        '1584,396',
        svg_path.resolve().as_uri(),
        str(png_path),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    svg_path = OUT_DIR / 'pitchr-linkedin-banner.svg'
    write_svg_variant(svg_path)
    print(svg_path)

    # Primary PNG is generated from SVG to keep exact parity.
    primary_png = OUT_DIR / 'pitchr-linkedin-banner.png'
    try:
        render_png_from_svg(svg_path, primary_png)
    except Exception:
        # Fallback for environments without Playwright/browser binaries.
        variant_primary().save(primary_png, quality=96)
    print(primary_png)

    outputs = {
        'pitchr-linkedin-banner-alt-01.png': variant_alt_01(),
        'pitchr-linkedin-banner-alt-02.png': variant_alt_02(),
        'pitchr-linkedin-banner-alt-03.png': variant_alt_03(),
    }
    for name, image in outputs.items():
        image.save(OUT_DIR / name, quality=96)
        print(OUT_DIR / name)


if __name__ == '__main__':
    main()


