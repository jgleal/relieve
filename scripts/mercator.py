"""Reproject equirectangular world rasters (90N..60S) to the Mercator frame used by the app.

Mercator is the projection of the original planisphere; only rows move, so a column
stays a meridian. The frame is 84N..60S, 180W..180E (about 1.47:1). Idempotent: an
image that is not 2.4:1 is assumed to be converted already and is left untouched.
Usage: python3 scripts/mercator.py   (converts the world assets in place)
"""
import math
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SRC_TOP,SRC_BOTTOM,TOP,BOTTOM=90,-60,84,-60
m=lambda lat:math.log(math.tan(math.pi/4+math.radians(lat)/2))
def height(width):return round(width/(2*math.pi)*(m(TOP)-m(BOTTOM)))
def to_mercator(im):
 a=np.asarray(im.convert('RGB')).astype(np.float32);sh,w=a.shape[:2];h=height(w)
 merc=m(TOP)-(np.arange(h)+.5)/h*(m(TOP)-m(BOTTOM));lat=np.degrees(np.arctan(np.sinh(merc)))
 sy=np.clip((SRC_TOP-lat)/(SRC_TOP-SRC_BOTTOM)*sh-.5,0,sh-1);y0=np.floor(sy).astype(int);y1=np.minimum(y0+1,sh-1);t=(sy-y0)[:,None,None]
 return Image.fromarray(np.clip(a[y0]*(1-t)+a[y1]*t+.5,0,255).astype(np.uint8))
def is_equirect(size):return abs(size[0]/size[1]-2.4)<.01
def convert_overviews():
 for name in ['natural-world','terrain-world']:
  p=ROOT/f'assets/{name}.webp';im=Image.open(p)
  if is_equirect(im.size):to_mercator(im).save(p,quality=88,method=6);print(name,'->',height(im.size[0]))
def tile(im,out,cols=8,rows=6):
 out.mkdir(parents=True,exist_ok=True);w,h=im.size
 for old in out.glob('*.webp'):old.unlink()
 for row in range(rows):
  for col in range(cols):im.crop((col*w//cols,row*h//rows,(col+1)*w//cols,(row+1)*h//rows)).save(out/f'{col}-{row}.webp',quality=90,method=6)
def convert_tiles(cols=8,rows=4):
 d=ROOT/'assets/terrain/world';first=Image.open(d/'0-0.webp');tw,th=first.size
 if not is_equirect((tw*cols,th*rows)) or len(list(d.glob('*.webp')))!=cols*rows:return
 full=Image.new('RGB',(tw*cols,th*rows))
 for r in range(rows):
  for c in range(cols):full.paste(Image.open(d/f'{c}-{r}.webp').convert('RGB'),(c*tw,r*th))
 merc=to_mercator(full);print('tiles',merc.size);tile(merc,d)
if __name__=='__main__':
 convert_overviews();convert_tiles()
