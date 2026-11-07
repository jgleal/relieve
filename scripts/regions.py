"""Build every Localiza zone with one criterion and write zones.js.

Sources: Natural Earth regions (sources/region-mapping.json) or, when Natural Earth has
no such region, a hand-drawn outline (sources/hand-zones.json). Then, for every zone:
  1. Land features are clipped to Natural Earth 10m land; seas and gulfs keep only water.
  2. Iberian zones are clipped to the frame of the original map, so nothing lies off it.
  3. All zones are simplified with the same tolerance per scope (detail is consistent).
  4. Tiny islands/slivers are dropped; holes are ignored (a lake inside a plateau counts).
  5. The reference point is the pole of inaccessibility: the interior point farthest from
     the edges, computed with longitudes scaled by cos(latitude). Features nested inside a
     zone (Sistema Central inside the Meseta, Sierra Nevada inside the Bética...) are
     subtracted first, so a point never sits on another listed place.
Generalised teaching zones, not authoritative boundaries. Requires shapely (dev only).
Natural Earth is public domain. Set NE_CACHE=<dir> to reuse downloaded GeoJSON files.
"""
import json, math, os, urllib.request
from pathlib import Path
from shapely.geometry import shape, Polygon, MultiPolygon, box
from shapely.ops import unary_union, polylabel
from shapely import affinity
ROOT = Path(__file__).resolve().parents[1]
REV = 'ca96624a56bd078437bca8184e78163e5039ad19'
BASE = f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/'
LAYERS = {'region': ('ne_10m_geography_regions_polys', 'NAME'), 'marine': ('ne_10m_geography_marine_polys', 'name'), 'lake': ('ne_10m_lakes', 'name')}
TOLERANCE = {'world': .08, 'iberia': .015}      # degrees
MIN_PART = {'world': .05, 'iberia': .0015}      # square degrees
_cache = {}

def read(name):
    if name not in _cache:
        local = Path(os.environ.get('NE_CACHE', '')) / f'{name}.geojson'
        if os.environ.get('NE_CACHE') and local.exists():
            _cache[name] = json.loads(local.read_text())['features']
        else:
            with urllib.request.urlopen(BASE + name + '.geojson', timeout=120) as r:
                _cache[name] = json.load(r)['features']
    return _cache[name]

def iberia_frame():
    """Lon/lat polygon of the original Iberian map (inverse of core.js originalIberia)."""
    cx = [1196.350587, 69.667337, -26.393858, -0.100313, -0.066351, 0.39109]
    cy = [3720.280603, -3.102963, -82.105603, -0.345505, 0.032024, -0.047331]
    f = lambda lon, lat: [sum(c * v for c, v in zip(k, [1, lon, lat, lon * lon, lon * lat, lat * lat])) for k in (cx, cy)]
    def inv(x, y, g=(-4.0, 40.0)):
        lon, lat = g
        for _ in range(30):
            a = f(lon, lat); h = 1e-4; dx = f(lon + h, lat); dy = f(lon, lat + h)
            j = [[(dx[0] - a[0]) / h, (dy[0] - a[0]) / h], [(dx[1] - a[1]) / h, (dy[1] - a[1]) / h]]
            det = j[0][0] * j[1][1] - j[0][1] * j[1][0]; ex, ey = x - a[0], y - a[1]
            lon += (j[1][1] * ex - j[0][1] * ey) / det; lat += (-j[1][0] * ex + j[0][0] * ey) / det
        return lon, lat
    m = 12  # px margin inside the 1057 x 753 image
    border = [(x, m) for x in range(m, 1057 - m, 40)] + [(1057 - m, y) for y in range(m, 753 - m, 40)] + \
             [(x, 753 - m) for x in range(1057 - m, m, -40)] + [(m, y) for y in range(753 - m, m, -40)]
    return Polygon([inv(x, y) for x, y in border])

def parts(geom):
    return [g for g in (geom.geoms if hasattr(geom, 'geoms') else [geom]) if isinstance(g, Polygon) and not g.is_empty]

def label(geom):
    main = max(parts(geom), key=lambda p: p.area)
    k = math.cos(math.radians(main.centroid.y))
    p = polylabel(affinity.scale(main, xfact=k, origin=(0, 0)), tolerance=.01)
    return [round(p.x / k, 4), round(p.y, 4)]

def main():
    mapping = json.loads((ROOT / 'sources/region-mapping.json').read_text())
    hand = json.loads((ROOT / 'sources/hand-zones.json').read_text())
    water = set(hand['water'])
    land_all = [shape(f['geometry']) for f in read('ne_10m_land')]
    frame = iberia_frame()
    out, shapes = {}, {}
    for key in sorted(set(mapping) | set(hand['zones']), key=lambda k: (k[0], int(k[1:]))):
        scope = 'iberia' if key.startswith('i') else 'world'
        if key in mapping:
            geoms = []
            for full in mapping[key]:
                layer, name = full.split(':', 1) if ':' in full else ('region', full)
                layer_name, field = LAYERS[layer]
                found = [shape(f['geometry']) for f in read(layer_name) if f['properties'].get(field) == name]
                assert found, (key, full)
                geoms += found
            geom = unary_union([g.buffer(0) for g in geoms])
        else:
            geom = Polygon(hand['zones'][key]).buffer(0)
        is_lake = key in mapping and all(n.startswith(('lake:', 'marine:Caspian')) for n in mapping[key])
        if not is_lake:
            area = box(*geom.buffer(.5).bounds)
            land = unary_union([g for g in land_all if g.intersects(area)]).intersection(area)
            geom = geom.difference(land) if key in water else geom.intersection(land)
        if scope == 'iberia':
            geom = geom.intersection(frame)
        geom = geom.simplify(TOLERANCE[scope], preserve_topology=True)
        keep = [Polygon(p.exterior) for p in parts(geom)]
        big = max(p.area for p in keep)
        keep = [p for p in keep if p.area >= min(MIN_PART[scope], big * .5)]
        geom = MultiPolygon(keep) if len(keep) > 1 else keep[0]
        out[key] = {'rings': [[[round(x, 4), round(y, 4)] for x, y in p.exterior.coords[:-1]] for p in keep]}
        shapes[key] = geom
    for key, geom in shapes.items():
        nested = [g for k, g in shapes.items() if k != key and k[0] == key[0] and g.area < geom.area and g.intersection(geom).area > .5 * g.area]
        free = geom.difference(unary_union(nested)) if nested else geom
        out[key]['label'] = label(free if not free.is_empty else geom)
    (ROOT / 'zones.js').write_text('// Generated by scripts/regions.py from Natural Earth (public domain) and sources/hand-zones.json.\n'
                                   '// rings: Localiza zones in [lon,lat]; label: reference point (pole of inaccessibility).\n'
                                   'export const ZONES = ' + json.dumps(out, separators=(',', ':')) + ';\n')
    print(len(out), 'zones,', sum(len(r) for z in out.values() for r in z['rings']), 'vertices')

if __name__ == '__main__':
    main()
