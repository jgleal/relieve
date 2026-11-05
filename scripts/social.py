"""Render the social card from typography and the public-domain map asset."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
FONT = Path('/System/Library/Fonts/Supplemental')
card = Image.new('RGB', (1200, 630), '#f3f0e7')
background = Image.open(ROOT / 'assets/natural-world.webp').convert('RGB')
background = background.resize((1200, 500), Image.Resampling.LANCZOS)
card.paste(background.crop((0, 0, 1200, 350)), (0, 280))
draw = ImageDraw.Draw(card)
draw.text((64, 34), 'RELIEVE / GEOGRAFÍA', fill='#38564b', font=ImageFont.truetype(str(FONT / 'Arial.ttf'), 24))
draw.text((60, 77), 'El mundo, de memoria.', fill='#203e35', font=ImageFont.truetype(str(FONT / 'Georgia.ttf'), 70))
draw.text((64, 192), 'Localiza · Escribe · Practica', fill='#38564b', font=ImageFont.truetype(str(FONT / 'Arial.ttf'), 30))
card.save(ROOT / 'assets/social.jpg', quality=94, optimize=True)
