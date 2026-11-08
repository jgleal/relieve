"""Natural Earth II detail tiles for the world map, so the Natural Earth base stays
Natural Earth at every zoom (instead of handing over to the relief tiles).

Source: NE2_HR_LC_SR_W (1:10m, 21600 x 10800, public domain), downloaded from
https://naturalearth.s3.amazonaws.com/10m_raster/NE2_HR_LC_SR_W.zip and unzipped.
Output: assets/natural/world/{col}-{row}.webp, the same 8 x 6 Mercator grid and
resolution (14400 px wide) as the relief tiles.
Usage: python3 scripts/natural.py <path to NE2_HR_LC_SR_W.tif>
"""
import sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mercator import to_mercator, tile, SRC_TOP, SRC_BOTTOM

ROOT = Path(__file__).resolve().parents[1]
WIDTH = 14400
Image.MAX_IMAGE_PIXELS = None
src = Image.open(sys.argv[1]).convert('RGB')
eq = src.resize((WIDTH, WIDTH // 2), Image.Resampling.LANCZOS)
del src
# keep 90N..60S, the input expected by to_mercator
eq = eq.crop((0, 0, WIDTH, round((90 - SRC_BOTTOM) / 180 * WIDTH / 2)))
assert SRC_TOP == 90
merc = to_mercator(eq)
print('mercator', merc.size)
tile(merc, ROOT / 'assets/natural/world')
