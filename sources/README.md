# Cartografía y tolerancias de localización

La app muestra puntos, no áreas coloreadas. Solo **Localiza** usa zonas para decidir si una ubicación es válida (y las dibuja tras responder si activas «Ver la zona aceptada»).

Todas las zonas se construyen con **un mismo criterio** en `scripts/regions.py`, que genera `zones.js`:

1. **Origen:** la región de Natural Earth cuando existe (`sources/region-mapping.json`); si no, un contorno propio (`sources/hand-zones.json`: meseta de Irán, meseta del lago Victoria, cuenca del Chad, península del Labrador completa, Montes Escandinavos y las unidades peninsulares salvo la Cantábrica y el golfo de Vizcaya).
2. **Costa real:** los accidentes de tierra se recortan con la tierra de Natural Earth 10m; mares y golfos se quedan solo con el agua.
3. **Marco del original:** las zonas peninsulares se recortan al área del mapa original.
4. **Mismo detalle:** todas se simplifican con la misma tolerancia por ámbito (0,08° el mundo, 0,015° la Península) y se descartan islotes diminutos.
5. **Punto de referencia:** el punto interior más alejado de los bordes (polo de inaccesibilidad), descontando antes los accidentes que la zona contiene (el Sistema Central dentro de la Meseta, Sierra Nevada dentro de la Bética…), para que nunca caiga sobre otro lugar de la lista. Picos y cabos conservan su coordenada exacta y un radio de tolerancia.

Son zonas didácticas generosas, no límites oficiales; una sierra queda dentro del sistema del que forma parte. Además de la zona, siempre vale un pequeño margen alrededor del punto de referencia y un mínimo en píxeles de pantalla. Los tests comprueban que cada punto cae dentro de su zona y lejos del borde.

Para regenerar: `pip install shapely` en un entorno de desarrollo y `python3 scripts/regions.py` (con `NE_CACHE=<carpeta>` se reutilizan las descargas de Natural Earth).

**Mapa mudo** comprueba el ancla elegida; no utiliza zonas. Escribe, Reto y Explora usan los puntos de referencia.

## Registro de los mapas originales

- **Planisferio:** se registra mediante su retícula de meridianos y paralelos (Mercator).
- **Península:** una transformación cuadrática longitud/latitud → píxel (`originalIberia` en `core.js`), ajustada por ICP contra la línea de costa 10m de Natural Earth. El error mediano es de ~1 px sobre la imagen de 1057 × 753. Los puntos de cordilleras, sierras, Meseta y golfos se derivan de esa transformación. Los seis cabos se fijan a mano sobre la costa dibujada y los tests comprueban que no se separan más de 5 px de su posición registrada.

## Organización del código

- `data.js`: nombres, alias, categorías, coordenadas exactas de picos y cabos.
- `zones.js`: zonas y puntos de referencia generados.
- `core.js`: `mapPosition` proyecta el punto que se muestra; `geometry` y `hit` calculan la tolerancia de Localiza.
- `app.js`: presenta los puntos y gestiona los modos de juego.

## Detalle raster y Finisterre

`terrain.py` exporta las imágenes con `bboxSR=4326`, `imageSR=4326` y `adjustAspectRatio=false`; comprueba el ámbito devuelto antes de crear los recortes. Las teselas se ajustan al mismo espacio de coordenadas que la vista general, sin cambiar las posiciones de los lugares. Las descargas del servicio se realizan al preparar los archivos, no desde el navegador del usuario.

Finisterre se referencia en 42,8825° N, 9,272194° O, según [Turismo de Galicia](https://www.turismo.gal/recurso/-/detalle/190524000446/cabo-fisterra?ctre=40000140&langId=es_ES&tp=40003930). En el mapa original peninsular está en (156, 96) de la imagen de 1057 × 753, el saliente occidental al norte de la ensenada de Corcubión. La versión anterior lo situaba en el gancho de Monte Louro, más al sur, que tiene una forma parecida; el registro contra la costa real lo descartó.

## Revisión del original y entrada táctil (7 de noviembre de 2026)

Se ha revisado visualmente el conjunto peninsular, con especial atención a sus seis cabos y cuatro golfos. Además de Finisterre, se corrigieron Trafalgar (antes junto a Cádiz) y Gata (antes tierra adentro). El 7 de noviembre los seis cabos se reajustaron a la costa dibujada con el registro descrito arriba. Las coordenadas son píxeles del original 1057 × 753. [Puertos del Estado sitúa Trafalgar en Los Caños de Meca](https://www.puertos.es/sites/default/files/2024-03/Cadiz_Faro%20de%20Trafalgar.pdf). Esta revisión no convierte una ficha generalizada en cartografía de precisión ni certifica todos los límites didácticos.

Localiza mantiene un mínimo de 6 píxeles de pantalla para ratón y 18 para entrada táctil/confirmada. No aumenta ese mínimo al ampliar: se convierte usando la escala actual del SVG. En superficies se admite ese pequeño margen junto al borde. La entrada táctil muestra primero el punto y permite ajustarlo o cancelarlo antes de evaluar. Si hay varios elementos puntuales del mismo tipo junto a la selección, se amplía antes de confirmar.
