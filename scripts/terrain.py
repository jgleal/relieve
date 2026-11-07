"""Export georeferenced NOAA relief and package static overview/detail tiles."""
import io,json,urllib.request,urllib.parse
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SERVICE='https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_global_mosaic_hillshade/ImageServer'
LAYOUTS={'iberia':((-11,35,4.5,45.5),(4000,3540),(4,4),(1240,1097)), 'world':((-180,-60,180,90),(14400,6000),(8,4),(2880,1200))}
def generate(scope):
 bbox,size,grid,overview=LAYOUTS[scope]
 params={'bbox':','.join(map(str,bbox)),'bboxSR':4326,'imageSR':4326,'size':','.join(map(str,size)),'format':'jpg','compressionQuality':95,'adjustAspectRatio':'false','f':'json'}
 url=SERVICE+'/exportImage?'+urllib.parse.urlencode(params)
 with urllib.request.urlopen(url,timeout=240) as response:meta=json.load(response)
 if 'error' in meta:raise RuntimeError(meta['error'])
 extent=meta['extent'];assert tuple(extent[k] for k in ['xmin','ymin','xmax','ymax'])==bbox,meta
 with urllib.request.urlopen(meta['href'],timeout=240) as response:im=Image.open(io.BytesIO(response.read())).convert('RGB')
 assert im.size==size,im.size
 im.resize(overview,Image.Resampling.LANCZOS).save(ROOT/f'assets/terrain-{scope}.webp',quality=88,method=6)
 out=ROOT/'assets/terrain'/scope;out.mkdir(parents=True,exist_ok=True)
 cols,rows=grid
 for row in range(rows):
  for col in range(cols):
   im.crop((col*size[0]//cols,row*size[1]//rows,(col+1)*size[0]//cols,(row+1)*size[1]//rows)).save(out/f'{col}-{row}.webp',quality=90,method=6)
 print(scope,size,'OK',flush=True)
if __name__=='__main__':
 for scope in LAYOUTS:generate(scope)
