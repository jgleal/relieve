# Lugares, zonas y mapas

Esta carpeta contiene la definición de los lugares y el resultado de generarlos. El funcionamiento general está en el [README principal](../README.md).

| Archivo | Quién lo escribe | Contenido |
|---|---|---|
| `lugares.json` | a mano | Los nombres, por ámbito (`mundo`, `peninsula`) y grupo |
| `correcciones.json` | a mano | Los casos que las fuentes abiertas no resuelven |
| `ids.json` | el generador | El identificador estable de cada lugar |
| `wikidata-cache.json` | el generador | Las respuestas de Wikidata, para que el resultado sea reproducible |
| `informe.md` | el generador | Cómo se resolvió cada lugar, con ⚠ en lo que conviene revisar |

## De nombres a datos

`scripts/build_places.py` lee `lugares.json` y genera `places.js`:

1. **Identidad.** Busca el nombre en Wikidata en español: completo, sin las palabras genéricas y sin la última palabra. Puntúa cada candidato según su nombre y alias coincidan con las palabras que identifican el lugar y según su tipo encaje con el que sugiere el nombre. Descarta los que caen fuera del ámbito; la Península abarca de 12° O a 6° E y de 34° N a 46° N. Así se evitan homónimos como insectos llamados Aconcagua o la Sierra Nevada de California.
2. **Tipo.** Lo da la primera palabra del nombre (Cordillera, Sistema, Sierra, Meseta, Cabo, Golfo, Península…) o, si no lo dice, el tipo de Wikidata (montaña, volcán, cordillera…).
3. **Zona** de Localiza, por este orden:
   - un contorno de `correcciones.json`;
   - las regiones de Natural Earth que indique la corrección;
   - la región de Natural Earth con el mismo identificador de Wikidata o el mismo nombre en español, a menos de 3° (mundo) o 0,6° (Península) de la coordenada;
   - si no hay ninguna, un círculo aproximado marcado con ⚠.
4. **Mismo tratamiento para todas las zonas.** Se recortan con la costa de Natural Earth 1:10m, quedándose con la tierra o con el agua según el tipo; lagos y el Caspio no se recortan. En la Península también se recortan con el marco del mapa original. Se simplifican igual (0,08° el mundo, 0,015° la Península) y se descartan los fragmentos diminutos.
5. **Punto de referencia.**
   - Picos y cabos usan su coordenada de Wikidata o de la corrección, con un radio de acierto de 0,6° en el mundo y 0,12° en la Península.
   - Los cabos peninsulares se ajustan además a la costa dibujada del mapa original, al píxel oscuro más cercano (a 6 píxeles como mucho).
   - El resto usa el punto interior más alejado de los bordes, descontando los lugares de la lista que contiene. Por ejemplo, el punto de la Meseta Central no cae en el Sistema Central.
6. **Respuestas cortas.** El nombre sin las palabras genéricas iniciales («Cordillera de los Andes» → andes) y, si empieza por «Gran», también sin «Gran». Los alias de Wikidata no se usan porque no son fiables.

`places.js` solo se escribe si todos los lugares se resuelven. Si alguno no se encuentra, el script lo indica y termina con error.

Opciones: `--refresh` vuelve a consultar Wikidata, y `NE_CACHE=<carpeta>` reutiliza las descargas de Natural Earth entre ejecuciones.

### Correcciones

`correcciones.json` es un objeto cuyas claves son el nombre del lugar, o `mundo:Nombre` / `peninsula:Nombre` si hace falta distinguir el ámbito. Cada entrada admite:

| Campo | Uso |
|---|---|
| `wikidata` | Fija la identidad (`"Q169175"`) cuando la búsqueda no da con ella |
| `tipo` | Fuerza el tipo de relieve |
| `natural_earth` | Lista de regiones de Natural Earth que forman la zona |
| `contorno` | Polígono propio en `[lon, lat]`, para lugares sin zona en ninguna fuente |
| `punto`, `punto_original` | Coordenada del punto de referencia, o píxel en el mapa original peninsular |
| `radio` | Radio de acierto de un pico o cabo |
| `alias_extra` | Sinónimos aceptados además de los automáticos (Hoggar, Fisterra…) |
| `alias` | Sustituye por completo las respuestas cortas |

Ahora mismo hay contornos propios para los sistemas y sierras peninsulares, los golfos de Cádiz, Valencia y Alicante, las mesetas de Irán y del lago Victoria, la cuenca del Chad y la península del Labrador entera (Natural Earth solo tiene su franja costera).

Son zonas didácticas generosas, no límites oficiales: una sierra queda dentro del sistema del que forma parte. Los tests comprueban que cada punto cae dentro de su zona y lejos del borde, y que las zonas terrestres no se salen al mar.

## Registro de los mapas originales

- **Planisferio:** Mercator, registrado por su retícula de meridianos y paralelos.
- **Península:** transformación cuadrática longitud/latitud → píxel (`originalIberia` en `core.js`), ajustada por ICP contra la costa 1:10m de Natural Earth. El error mediano es de ~1 píxel sobre la imagen de 1057 × 753. Todos los puntos peninsulares se derivan de ella, salvo los cabos, que se ajustan a la costa dibujada. Los tests comprueban que no se separan más de 5 píxeles de su posición registrada.

Finisterre se sitúa en 42,8825° N, 9,272194° O, según [Turismo de Galicia](https://www.turismo.gal/recurso/-/detalle/190524000446/cabo-fisterra?ctre=40000140&langId=es_ES&tp=40003930). En el original está en el píxel (156, 96), el saliente occidental al norte de la ensenada de Corcubión. Una versión anterior lo ponía en el gancho de Monte Louro, más al sur y de forma parecida; el registro contra la costa real lo descartó. [Puertos del Estado sitúa Trafalgar en Los Caños de Meca](https://www.puertos.es/sites/default/files/2024-03/Cadiz_Faro%20de%20Trafalgar.pdf).

## Mapas en color

`scripts/terrain.py` descarga las imágenes de NOAA con `bboxSR=4326`, `imageSR=4326` y `adjustAspectRatio=false`, comprueba el ámbito devuelto y genera la vista general y las teselas. Las del mundo se reproyectan a Mercator con `scripts/mercator.py`. Todo esto se hace al preparar los archivos, nunca desde el navegador del usuario.

Las teselas se cargan solo si se ven en pantalla y se solapan un píxel para que no aparezcan costuras.
