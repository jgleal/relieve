"""Build places.js from a list of names (sources/lugares.json).

For every name:
  1. Identity: Wikidata search in Spanish (retrying without generic landform words).
     Results are cached in sources/wikidata-cache.json so builds are reproducible.
  2. Type (category): from the leading word of the name (Cordillera, Cabo, Golfo...),
     else from the Wikidata type (mountain, mountain range, cape...).
  3. Zone for Localiza (not for peaks and capes):
       correction outline  >  correction Natural Earth names
       >  Natural Earth feature with the same Wikidata id or Spanish name
       >  approximate circle around the Wikidata coordinate (flagged for review).
     Land zones are clipped to the coast, seas and gulfs to the water, Iberian zones to
     the frame of the original map; all are simplified with the same tolerance.
  4. Reference point: peaks and capes use their exact coordinate (capes on the original
     Iberian map are snapped to the drawn coast); other places use the interior point
     farthest from the edges, excluding the listed places nested inside.
  5. Accepted short answers: the identifying words of the name, Spanish Wikidata aliases
     and any extra alias from the corrections.
Writes places.js, keeps ids stable in sources/ids.json and writes sources/informe.md,
a review report that says how each place was resolved.

Dev requirements: shapely, numpy, pillow. Data: Natural Earth (public domain) and
Wikidata (CC0). NE_CACHE=<dir> reuses downloaded Natural Earth files. --refresh ignores
the Wikidata cache.
"""
import json, math, os, re, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
from shapely.geometry import shape, Point, Polygon, MultiPolygon, box
from shapely.ops import unary_union, polylabel
from shapely import affinity

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'sources'
REV = 'ca96624a56bd078437bca8184e78163e5039ad19'
NE_BASE = f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/'
UA = 'relieve-build/1.0 (https://github.com/jgleal/relieve)'
SCOPES = {'mundo': 'world', 'peninsula': 'iberia'}
TOLERANCE = {'world': .08, 'iberia': .015}
MIN_PART = {'world': .05, 'iberia': .0015}
RADIUS = {('world', 'Picos'): .6, ('world', 'Cabos'): .6, ('iberia', 'Picos'): .12, ('iberia', 'Cabos'): .12}
FALLBACK_RADIUS = {'world': 2.0, 'iberia': .3}
GENERIC = set('gran grande grandes cordillera cordilleras monte montes montana montanas sierra sierras meseta mesetas cuenca cuencas cabo cabos golfo golfos peninsula peninsulas macizo macizos escudo mar mares lago llanura llanuras desierto desiertos valle pico picos sistema sistemas de del la los las el'.split())
# Leading word of the name -> category used by the app (filters and question wording).
LEAD = [('cordillera', 'Cordilleras'), ('montes', 'Cordilleras'), ('montanas', 'Cordilleras'), ('sierra', 'Cordilleras'), ('sistema', 'Cordilleras'),
        ('macizo', 'Cordilleras'), ('picos', 'Cordilleras'), ('meseta', 'Mesetas'), ('escudo', 'Mesetas'), ('gran meseta', 'Mesetas'),
        ('llanura', 'Llanuras y cuencas'), ('gran llanura', 'Llanuras y cuencas'), ('cuenca', 'Llanuras y cuencas'), ('valle', 'Llanuras y cuencas'),
        ('peninsula', 'Penínsulas e islas'), ('tierra de', 'Penínsulas e islas'), ('isla', 'Penínsulas e islas'), ('mar', 'Mares'), ('lago', 'Mares'),
        ('rift', 'Llanuras y cuencas'), ('cabo', 'Cabos'), ('desierto', 'Desiertos'), ('gran desierto', 'Desiertos'), ('golfo', 'Golfos'), ('pico', 'Picos'), ('monte', 'Picos')]
# Wikidata "instance of" -> category, when the name does not say it.
WD_TYPES = {'Q8072': 'Picos', 'Q169358': 'Picos', 'Q212057': 'Picos', 'Q8502': 'Picos', 'Q207326': 'Picos', 'Q1595289': 'Picos', 'Q46831': 'Cordilleras', 'Q1061151': 'Cordilleras', 'Q75520': 'Mesetas',
            'Q160091': 'Llanuras y cuencas', 'Q190429': 'Llanuras y cuencas', 'Q34763': 'Penínsulas e islas', 'Q33837': 'Penínsulas e islas',
            'Q23442': 'Penínsulas e islas', 'Q165': 'Mares', 'Q23397': 'Mares', 'Q188025': 'Mares', 'Q185113': 'Cabos', 'Q8514': 'Desiertos',
            'Q1322134': 'Golfos', 'Q39594': 'Golfos', 'Q209130': 'Llanuras y cuencas'}
WATER = {'Mares', 'Golfos'}
POINT_ONLY = {'Picos', 'Cabos'}

def norm(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9\s]', ' ', s)).strip()

def http_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))

_ne = {}
def ne(name):
    if name not in _ne:
        cache = os.environ.get('NE_CACHE')
        local = Path(cache or '.') / f'{name}.geojson'
        _ne[name] = json.loads(local.read_text())['features'] if cache and local.exists() else http_json(NE_BASE + name + '.geojson')['features']
    return _ne[name]
NE_LAYERS = {'region': ('ne_10m_geography_regions_polys', 'NAME'), 'marine': ('ne_10m_geography_marine_polys', 'name'), 'lake': ('ne_10m_lakes', 'name')}

# ---------------------------------------------------------------- Wikidata
def wd_entities(qids):
    ents = http_json('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbgetentities', 'ids': '|'.join(qids), 'props': 'labels|aliases|claims', 'languages': 'es|en', 'format': 'json'}))['entities']
    out = []
    for qid in qids:
        ent = ents.get(qid, {}); claims = ent.get('claims', {}); coord = None
        for c in claims.get('P625', []):
            v = c['mainsnak'].get('datavalue', {}).get('value')
            if v:
                coord = [round(v['longitude'], 5), round(v['latitude'], 5)]; break
        types = [c['mainsnak']['datavalue']['value']['id'] for c in claims.get('P31', []) if c['mainsnak'].get('datavalue')]
        out.append({'qid': qid, 'label_es': ent.get('labels', {}).get('es', {}).get('value'), 'label_en': ent.get('labels', {}).get('en', {}).get('value'),
                    'aliases_es': [a['value'] for a in ent.get('aliases', {}).get('es', [])], 'types': types, 'coord': coord})
    return out

BBOX = {'iberia': (-12, 34, 6, 46), 'world': (-180, -90, 180, 90)}
def wikidata(name, cache, scope, pinned=None):
    """First search hit that is a place with coordinates inside the scope."""
    key = f'{scope}:{pinned or name}'
    if key in cache:
        return cache[key]
    out = None
    if pinned:
        out = dict(wd_entities([pinned])[0], confident=True)
    else:
        words = name.split()
        queries = [name, ' '.join(w for w in words if norm(w) not in GENERIC), ' '.join(words[:-1]) if len(words) > 2 else '']
        x0, y0, x1, y1 = BBOX[scope]
        for q in dict.fromkeys(x for x in queries if x):
            hits = http_json('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbsearchentities', 'search': q, 'language': 'es', 'uselang': 'es', 'type': 'item', 'limit': 8, 'format': 'json'})).get('search', [])
            if not hits:
                continue
            expected = lead_category(name)
            best, best_score = None, -1
            for cand in wd_entities([h['id'] for h in hits]):
                c = cand['coord']
                if not (c and x0 <= c[0] <= x1 and y0 <= c[1] <= y1):
                    continue
                cats = {WD_TYPES[t] for t in cand['types'] if t in WD_TYPES}
                names = ' | '.join(norm(x) for x in [cand['label_es'] or '', cand['label_en'] or ''] + cand['aliases_es'])
                key_words = [norm(w) for w in name.split() if norm(w) not in GENERIC] or [norm(name)]
                # the identifying words must appear (allowing a short suffix: Guayanas/Guayana, Ahaggar)
                named = all(re.search(r'\b' + re.escape(w[:max(4, len(w) - 2)]), names) for w in key_words)
                score = (4 if named else 0) + (2 if expected and expected in cats else 1 if cats else 0)
                if score > best_score:
                    best, best_score = cand, score
            if best and (best_score >= 4 or out is None):
                out = dict(best, confident=best_score >= 5)
            if out and out.get('confident'):
                break
    cache[key] = out
    time.sleep(.2)
    return out

def lead_category(name):
    n = norm(name)
    for lead, cat in sorted(LEAD, key=lambda x: -len(x[0])):
        if n == lead or n.startswith(lead + ' '):
            return cat
    return None

def category(name, wd, fix):
    if fix.get('tipo'):
        return fix['tipo'], 'corrección'
    n = norm(name)
    for lead, cat in sorted(LEAD, key=lambda x: -len(x[0])):
        if n == lead or n.startswith(lead + ' '):
            return cat, 'nombre'
    for t in (wd or {}).get('types', []):
        if t in WD_TYPES:
            return WD_TYPES[t], 'wikidata'
    return 'Cordilleras', 'por defecto'

# ---------------------------------------------------------------- geometry
def iberia_frame():
    cx = [1196.350587, 69.667337, -26.393858, -0.100313, -0.066351, 0.39109]
    cy = [3720.280603, -3.102963, -82.105603, -0.345505, 0.032024, -0.047331]
    f = lambda lon, lat: [sum(c * v for c, v in zip(k, [1, lon, lat, lon * lon, lon * lat, lat * lat])) for k in (cx, cy)]
    def inv(x, y):
        lon, lat = -4.0, 40.0
        for _ in range(30):
            a = f(lon, lat); h = 1e-4; dx = f(lon + h, lat); dy = f(lon, lat + h)
            j = [[(dx[0] - a[0]) / h, (dy[0] - a[0]) / h], [(dx[1] - a[1]) / h, (dy[1] - a[1]) / h]]
            det = j[0][0] * j[1][1] - j[0][1] * j[1][0]; ex, ey = x - a[0], y - a[1]
            lon += (j[1][1] * ex - j[0][1] * ey) / det; lat += (-j[1][0] * ex + j[0][0] * ey) / det
        return lon, lat
    m = 12
    border = [(x, m) for x in range(m, 1057 - m, 40)] + [(1057 - m, y) for y in range(m, 753 - m, 40)] + \
             [(x, 753 - m) for x in range(1057 - m, m, -40)] + [(m, y) for y in range(753 - m, m, -40)]
    return Polygon([inv(x, y) for x, y in border]), f

def parts(g):
    return [p for p in (g.geoms if hasattr(g, 'geoms') else [g]) if isinstance(p, Polygon) and not p.is_empty]

def pole(geom):
    main = max(parts(geom), key=lambda p: p.area)
    k = math.cos(math.radians(main.centroid.y))
    p = polylabel(affinity.scale(main, xfact=k, origin=(0, 0)), tolerance=.01)
    return [round(p.x / k, 4), round(p.y, 4)]

def ne_by_names(names):
    geoms = []
    for full in names:
        layer, nm = full.split(':', 1) if ':' in full else ('region', full)
        lname, field = NE_LAYERS[layer]
        found = [shape(f['geometry']) for f in ne(lname) if f['properties'].get(field) == nm]
        assert found, f'Natural Earth sin "{full}"'
        geoms += found
    return geoms

def ne_auto(qid, name, coord, scope):
    """Natural Earth features with the same Wikidata id, or the same Spanish name, near the coordinate."""
    hits = []
    near = Point(coord).buffer(3 if scope == 'world' else .6) if coord else None
    for layer, (lname, field) in NE_LAYERS.items():
        for f in ne(lname):
            p = f['properties']
            wid = p.get('WIKIDATAID') or p.get('wikidataid')
            es = p.get('NAME_ES') or p.get('name_es') or ''
            if ((qid and wid == qid) or (es and norm(es) == norm(name))) and (near is None or shape(f['geometry']).intersects(near)):
                hits.append((f"{layer}:{p.get(field)}" if layer != 'region' else p.get(field), shape(f['geometry'])))
    return hits

# ---------------------------------------------------------------- build
class Unresolved(Exception):
    pass

def main():
    lugares = json.loads((SRC / 'lugares.json').read_text())
    fixes = json.loads((SRC / 'correcciones.json').read_text()) if (SRC / 'correcciones.json').exists() else {}
    fixes = {k: v for k, v in fixes.items() if not k.startswith('_')}
    ids = json.loads((SRC / 'ids.json').read_text())
    cache_path = SRC / 'wikidata-cache.json'
    cache = {} if '--refresh' in sys.argv else (json.loads(cache_path.read_text()) if cache_path.exists() else {})
    land_all = [shape(f['geometry']) for f in ne('ne_10m_land')]
    frame, to_px = iberia_frame()
    orig = np.asarray(Image.open(ROOT / 'assets/original-iberia.webp').convert('L'))
    dark_y, dark_x = np.nonzero(orig < 90)
    places, shapes, report, failed = [], {}, [], []
    for skey, groups in lugares.items():
        if skey.startswith('_'):
            continue
        scope = SCOPES[skey]
        for group, names in groups.items():
            for name in names:
                try:
                    fix = {**fixes.get(name, {}), **fixes.get(f'{skey}:{name}', {})}
                    key = f'{skey}:{name}'
                    if key not in ids:
                        prefix = 'w' if scope == 'world' else 'i'
                        used = {int(v[1:]) for k, v in ids.items() if not k.startswith('_') and v.startswith(prefix)}
                        ids[key] = f'{prefix}{max(used, default=-1) + 1}'
                    pid = ids[key]
                    wd = wikidata(name, cache, scope, fix.get('wikidata'))
                    cat, cat_src = category(name, wd, fix)
                    notes = []
                    item = {'id': pid, 'scope': scope, 'name': name, 'group': group, 'category': cat}
                    # zone
                    zone_src = None
                    if cat not in POINT_ONLY:
                        if fix.get('contorno'):
                            geom, zone_src = Polygon(fix['contorno']).buffer(0), 'contorno propio'
                        elif fix.get('natural_earth'):
                            geom, zone_src = unary_union([g.buffer(0) for g in ne_by_names(fix['natural_earth'])]), 'Natural Earth (corrección): ' + ', '.join(fix['natural_earth'])
                        else:
                            hits = ne_auto(wd and wd['qid'], name, wd and wd['coord'], scope)
                            if hits:
                                geom, zone_src = unary_union([g.buffer(0) for _, g in hits]), 'Natural Earth: ' + ', '.join(dict.fromkeys(n for n, _ in hits))
                            elif wd and wd['coord']:
                                k = math.cos(math.radians(wd['coord'][1]))
                                geom = affinity.scale(Point(wd['coord']).buffer(FALLBACK_RADIUS[scope], 32), xfact=1 / k)
                                zone_src = '⚠ aproximada: círculo alrededor de la coordenada de Wikidata'
                                notes.append('revisar la zona (añadir natural_earth o contorno en correcciones)')
                            else:
                                raise Unresolved('sin zona ni coordenada en Wikidata/Natural Earth')
                        lake = zone_src.startswith('Natural Earth') and all(s.startswith(('lake:', 'marine:Caspian')) for s in zone_src.split(': ', 1)[1].split(', '))
                        if not lake:
                            area = box(*geom.buffer(.5).bounds)
                            land = unary_union([g for g in land_all if g.intersects(area)]).intersection(area)
                            geom = geom.difference(land) if cat in WATER else geom.intersection(land)
                        if scope == 'iberia':
                            geom = geom.intersection(frame)
                        geom = geom.simplify(TOLERANCE[scope], preserve_topology=True)
                        keep = [Polygon(p.exterior) for p in parts(geom)]
                        big = max(p.area for p in keep)
                        keep = [p for p in keep if p.area >= min(MIN_PART[scope], big * .5)]
                        shapes[pid] = MultiPolygon(keep) if len(keep) > 1 else keep[0]
                        item['polygons'] = [[[round(x, 4), round(y, 4)] for x, y in p.exterior.coords[:-1]] for p in keep]
                        item['radius'] = .3 if scope == 'world' else .1
                    else:
                        pt = fix.get('punto') or (wd and wd['coord'])
                        if not pt:
                            raise Unresolved('sin coordenada; añade "punto" en correcciones')
                        item['lon'], item['lat'] = pt
                        item['radius'] = fix.get('radio', RADIUS[(scope, cat)])
                        item['polygons'] = None
                        zone_src = 'punto exacto (' + ('corrección' if fix.get('punto') else 'Wikidata') + ')'
                        if scope == 'iberia':
                            x, y = to_px(*pt)
                            d = np.hypot(dark_x - x, dark_y - y); i = int(d.argmin())
                            if fix.get('punto_original'):
                                item['original'] = [round(fix['punto_original'][0] / 1057, 6), round(fix['punto_original'][1] / 753, 6)]
                            elif d[i] <= 6:
                                item['original'] = [round(int(dark_x[i]) / 1057, 6), round(int(dark_y[i]) / 753, 6)]
                    # aliases
                    # short answers: drop the leading landform words ("Cordillera de los Andes" -> andes)
                    # and, for "Gran ...", also accept the name without "Gran".
                    words = name.split(); k = 0
                    while k < len(words) and norm(words[k]) in GENERIC:
                        k += 1
                    aliases = []
                    if 0 < k < len(words):
                        aliases.append(norm(' '.join(words[k:])))
                    if norm(words[0]) in ('gran', 'grande') and len(words) > 1:
                        aliases.append(norm(' '.join(words[1:])))
                    aliases += [norm(a) for a in fix.get('alias_extra', [])]
                    # Wikidata aliases are not reliable enough for grading; corrections may replace the list.
                    item['aliases'] = [norm(a) for a in fix['alias']] if 'alias' in fix else list(dict.fromkeys(aliases))
                    item.setdefault('original', None)
                    places.append(item)
                    report.append((pid, name, cat, cat_src, wd, zone_src, notes, item['aliases']))
                except Unresolved as e:
                    failed.append(name)
                    report.append((ids.get(f'{skey}:{name}', '?'), name, '?', '', None, f'✗ {e}', ['añadir corrección'], []))
    # reference points: pole of inaccessibility, nested listed places excluded
    for item in places:
        if item['polygons'] is None:
            continue
        geom = shapes[item['id']]
        nested = [g for k, g in shapes.items() if k != item['id'] and k[0] == item['id'][0] and g.area < geom.area and g.intersection(geom).area > .5 * g.area]
        free = geom.difference(unary_union(nested)) if nested else geom
        item['lon'], item['lat'] = pole(free if not free.is_empty else geom)
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1, sort_keys=True) + '\n')
    (SRC / 'ids.json').write_text(json.dumps(ids, ensure_ascii=False, indent=1) + '\n')
    fields = ['id', 'scope', 'name', 'group', 'category', 'lon', 'lat', 'aliases', 'radius', 'original', 'polygons']
    if not failed:
     (ROOT / 'places.js').write_text('// Generated by scripts/build_places.py from sources/lugares.json. Do not edit by hand.\n'
                                     'export const PLACES = ' + json.dumps([{f: p[f] for f in fields} for p in places], ensure_ascii=False, separators=(',', ':')) + ';\n')
    lines = ['# Informe de lugares', '', 'Generado por `scripts/build_places.py`. ⚠ = conviene revisar.', '',
             '| id | lugar | tipo | Wikidata | zona y punto | respuestas cortas |', '|---|---|---|---|---|---|']
    for pid, name, cat, cat_src, wd, zone_src, notes, aliases in report:
        w = (f"{wd['qid']} {wd.get('label_es') or wd.get('label_en') or ''}" + ('' if wd.get('confident') else ' ⚠ identidad dudosa')) if wd else '✗ no encontrado'
        lines.append(f"| {pid} | {name} | {cat} ({cat_src}) | {w} | {zone_src}{' · ' + '; '.join(notes) if notes else ''} | {', '.join(aliases)} |")
    (SRC / 'informe.md').write_text('\n'.join(lines) + '\n')
    warn = sum(1 for r in report if r[6])
    print(f'{len(places)} lugares · {warn} para revisar · informe en sources/informe.md')
    if failed:
        sys.exit(f'✗ Sin resolver ({len(failed)}): ' + ', '.join(failed) + '. places.js no se ha actualizado; añade correcciones.')

if __name__ == '__main__':
    main()
