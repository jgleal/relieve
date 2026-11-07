# Cartografía y tolerancias de localización

La app muestra puntos, no áreas coloreadas. Solo **Localiza** usa geometrías para decidir si una ubicación es válida:

- Polígonos sencillos para superficies amplias.
- Recorridos con margen para cordilleras y otros accidentes alargados.
- Radios de tolerancia para elementos puntuales.

Son aproximaciones didácticas propias, no límites oficiales. Pueden solaparse: una sierra y la cordillera de la que forma parte pueden ocupar el mismo lugar. La Meseta Central usa un polígono amplio que cubre ambas submesetas, sin excluir las unidades montañosas interiores. El mapa original dispone de su propio polígono trazado en coordenadas de la imagen. No se descarga ni procesa cartografía externa durante el uso.

**Mapa mudo** comprueba el ancla elegida; no utiliza superficies de acierto. Escribe, Reto y Explora también usan únicamente puntos de referencia.

## Organización del código

- `data.js`: nombres, puntos y tolerancias. Los polígonos sustituyen a los recorridos donde corresponde, sin mantener dos modelos para el mismo elemento.
- `core.js`: `mapPosition` proyecta el punto que se muestra; `geometry` y `hit` calculan la tolerancia de Localiza.
- `app.js`: presenta los puntos y gestiona los modos de juego.

El planisferio original se registra mediante su retícula de meridianos y paralelos. Las posiciones peninsulares se marcan directamente sobre el mapa original. Los fondos detallados proceden de NOAA / NCEI DEM Global Mosaic y las vistas generales de Natural Earth II (dominio público); los derechos de los mapas originales corresponden a sus autores. Los enlaces y créditos de los fondos están en el README principal.

## Detalle raster y Finisterre

`terrain.py` exporta las imágenes con `bboxSR=4326`, `imageSR=4326` y `adjustAspectRatio=false`; comprueba el ámbito devuelto antes de crear los recortes. Las teselas se ajustan al mismo espacio de coordenadas que la vista general, sin cambiar las posiciones de los lugares. Las descargas del servicio se realizan al preparar los archivos, no desde el navegador del usuario.

Finisterre se referencia en 42,8825° N, 9,272194° O, según [Turismo de Galicia](https://www.turismo.gal/recurso/-/detalle/190524000446/cabo-fisterra?ctre=40000140&langId=es_ES&tp=40003930). En el mapa original peninsular, el punto se sitúa manualmente en (168, 109) de la imagen de 1057 × 753: en el pequeño saliente anterior a la ría de Muros y Noia. Es una correspondencia visual sobre una costa generalizada, no una georreferenciación precisa.

## Revisión del original y entrada táctil (7 de noviembre de 2026)

Se ha revisado visualmente el conjunto peninsular, con especial atención a sus seis cabos y cuatro golfos. Además de Finisterre, se corrigieron Trafalgar (344, 686; antes junto a Cádiz) y Gata (612, 643; antes tierra adentro). Las coordenadas son píxeles del original 1057 × 753. [Puertos del Estado sitúa Trafalgar en Los Caños de Meca](https://www.puertos.es/sites/default/files/2024-03/Cadiz_Faro%20de%20Trafalgar.pdf). Esta revisión no convierte una ficha generalizada en cartografía de precisión ni certifica todos los límites didácticos.

Localiza mantiene un mínimo de 6 píxeles de pantalla para ratón y 18 para entrada táctil/confirmada. No aumenta ese mínimo al ampliar: se convierte usando la escala actual del SVG. En superficies se admite ese pequeño margen junto al borde. La entrada táctil muestra primero el punto y permite ajustarlo o cancelarlo antes de evaluar. Si hay varios elementos puntuales del mismo tipo junto a la selección, se amplía antes de confirmar.
