# Cartografía y tolerancias de localización

La app muestra puntos, no áreas coloreadas. Solo **Localiza** usa geometrías para decidir si una ubicación es válida, y se definen una sola vez en longitud/latitud para los tres fondos:

- **Natural Earth** (`ne_10m_geography_regions_polys`, `ne_10m_geography_marine_polys`, `ne_10m_lakes`, dominio público) para la mayoría de elementos del mundial, la Cordillera Cantábrica y el golfo de Vizcaya. `scripts/regions.py` genera `regions-natural-earth.js` a partir de `sources/region-mapping.json`.
- **Polígonos propios** en `data.js` para el resto de la península (sistemas, sierras, Meseta, golfos) y unas pocas regiones mundiales sin equivalente en Natural Earth (meseta de Irán, meseta del lago Victoria, cuenca del Chad).
- **Corredores** solo donde no hay polígono (Montes Escandinavos) y **radios** para picos y cabos.

Son zonas didácticas generosas, no límites oficiales, y pueden solaparse: una sierra queda dentro del sistema del que forma parte. Además de la zona, siempre vale un pequeño margen alrededor del punto de referencia y un mínimo en píxeles de pantalla.

**Mapa mudo** comprueba el ancla elegida; no utiliza superficies de acierto. Escribe, Reto y Explora también usan únicamente puntos de referencia.

## Registro de los mapas originales

- **Planisferio:** se registra mediante su retícula de meridianos y paralelos (Mercator).
- **Península:** una transformación cuadrática longitud/latitud → píxel (`originalIberia` en `core.js`), ajustada por ICP contra la línea de costa 10m de Natural Earth. El error mediano es de ~1 px sobre la imagen de 1057 × 753. Los puntos de cordilleras, sierras, Meseta y golfos se derivan de esa transformación. Los seis cabos se fijan a mano sobre la costa dibujada y los tests comprueban que no se separan más de 5 px de su posición registrada.

## Organización del código

- `data.js`: nombres, puntos, polígonos propios y tolerancias.
- `regions-natural-earth.js`: polígonos generados de Natural Earth.
- `core.js`: `mapPosition` proyecta el punto que se muestra; `geometry` y `hit` calculan la tolerancia de Localiza.
- `app.js`: presenta los puntos y gestiona los modos de juego.

## Detalle raster y Finisterre

`terrain.py` exporta las imágenes con `bboxSR=4326`, `imageSR=4326` y `adjustAspectRatio=false`; comprueba el ámbito devuelto antes de crear los recortes. Las teselas se ajustan al mismo espacio de coordenadas que la vista general, sin cambiar las posiciones de los lugares. Las descargas del servicio se realizan al preparar los archivos, no desde el navegador del usuario.

Finisterre se referencia en 42,8825° N, 9,272194° O, según [Turismo de Galicia](https://www.turismo.gal/recurso/-/detalle/190524000446/cabo-fisterra?ctre=40000140&langId=es_ES&tp=40003930). En el mapa original peninsular está en (156, 96) de la imagen de 1057 × 753, el saliente occidental al norte de la ensenada de Corcubión. La versión anterior lo situaba en el gancho de Monte Louro, más al sur, que tiene una forma parecida; el registro contra la costa real lo descartó.

## Revisión del original y entrada táctil (7 de noviembre de 2026)

Se ha revisado visualmente el conjunto peninsular, con especial atención a sus seis cabos y cuatro golfos. Además de Finisterre, se corrigieron Trafalgar (antes junto a Cádiz) y Gata (antes tierra adentro). El 7 de noviembre los seis cabos se reajustaron a la costa dibujada con el registro descrito arriba. Las coordenadas son píxeles del original 1057 × 753. [Puertos del Estado sitúa Trafalgar en Los Caños de Meca](https://www.puertos.es/sites/default/files/2024-03/Cadiz_Faro%20de%20Trafalgar.pdf). Esta revisión no convierte una ficha generalizada en cartografía de precisión ni certifica todos los límites didácticos.

Localiza mantiene un mínimo de 6 píxeles de pantalla para ratón y 18 para entrada táctil/confirmada. No aumenta ese mínimo al ampliar: se convierte usando la escala actual del SVG. En superficies se admite ese pequeño margen junto al borde. La entrada táctil muestra primero el punto y permite ajustarlo o cancelarlo antes de evaluar. Si hay varios elementos puntuales del mismo tipo junto a la selección, se amplía antes de confirmar.
