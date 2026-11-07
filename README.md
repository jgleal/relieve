# Relieve

Práctica de geografía física para tablet y ordenador: **52 elementos del relieve mundial** y **22 de la Península Ibérica**, basados en la ficha «Taller 2. Geografía Física. Relieve».

**Web:** https://jgleal.github.io/relieve/

Los lugares se definen solo por su nombre en [`sources/lugares.json`](sources/lugares.json). Un script genera a partir de ellos el tipo de relieve, la zona válida, el punto de referencia y las respuestas cortas, así que la web se puede reutilizar con otro temario sobre los mismos mapas (véase [De nombres a datos](#de-nombres-a-datos)).

## Modos

- **Escribe:** identifica el punto señalado. La pregunta indica el tipo de relieve. Sesiones de 5, 10, 20 o todos los lugares disponibles. La pista muestra las palabras genéricas completas y solo la inicial de las que identifican el lugar («Macizo de A······»). Un acierto con pista suma, pero el lugar sigue en el repaso.
- **Localiza:** lee un nombre y señálalo en el mapa. Vale cualquier punto de la zona del lugar. Si fallas, se marca dónde pinchaste, una línea hasta el punto válido más próximo y la distancia en kilómetros. Con «Ver la zona aceptada al responder» se dibuja además la zona que valía (la preferencia se recuerda).
- **Mapa mudo:** arrastra cada etiqueta a su ancla numerada, o selecciónala y pulsa el ancla.
  - Si detienes la etiqueta sobre un grupo de anclas, aparece una lupa ×3 donde se separan, y se puede soltar dentro de ella.
  - Al fallar, el ancla equivocada tiembla y un aviso aparece donde soltaste.
  - La pista hace latir el ancla correcta y desplaza el mapa hasta ella si está fuera de la vista.
- **Reto:** escribe los nombres y consulta la corrección al terminar.
- **Repasa fallos:** vuelve sobre lo fallado, en el mismo tipo de juego en que se falló. Lo fallado en Localiza o Mapa mudo se señala en el mapa y lo demás se escribe. Un acierto posterior sin ayuda lo retira del repaso.
- **Explora:** consulta nombres y puntos sin puntuación. Cada punto se colorea según tu progreso (acertado, fallado, sin intentar). «Ver todos los nombres» convierte el mapa en una hoja de estudio: pulsa un nombre o un punto para taparlo o destaparlo, o tápalos todos y ve descubriéndolos.
- **Ficha para imprimir:** genera una ficha sobre el mapa original con 10, 15, 20 o todos los lugares de la selección, elegidos al azar. Lleva líneas para responder, y opcionalmente la lista de nombres y una hoja de soluciones. Se imprime o se guarda como PDF desde el navegador.

Se puede filtrar por continente y tipo de relieve, y cambiar de mapa (relieve detallado, Natural Earth o el original de la ficha) incluso en mitad de una sesión, conservando la zona y el zoom. Al terminar una ronda, los resultados ofrecen repasar los fallos o volver al inicio.

## Uso

1. Elige ámbito, mapa, modo y filtros, e inicia la sesión.
2. Amplía con la rueda o con +/−. Arrastra el mapa para moverte cuando está ampliado. ⤢ restablece la vista.
3. En Localiza y Mapa mudo también se puede usar el teclado: Tab enfoca el mapa, las flechas mueven el cursor (con Mayús, en pasos finos) e Intro confirma.

No hay scroll de página: durante una sesión la configuración se oculta, el selector de mapa pasa a la cabecera del mapa y el mapa ocupa el alto disponible. Las listas largas, como las etiquetas o los resultados, se desplazan por separado.

El progreso se guarda en este navegador (`localStorage`, clave `relieve-progress-v1`). No hay cuentas, analítica, cookies ni peticiones a terceros durante el uso. «Borrar mi progreso», en la cabecera, lo reinicia.

## Corrección

- Se ignoran mayúsculas, tildes, puntuación y espacios repetidos.
- Se aceptan respuestas cortas que identifican el lugar («Bética», «Andes») y pequeñas erratas: una a partir de 5 caracteres y dos a partir de 11, solo si no hay ambigüedad. En esos casos se muestra el nombre completo.
- Las palabras genéricas (meseta, sierra, cordillera, cabo…) nunca bastan. Las ambiguas, como «Central» (Meseta o Sistema Central), piden completar la respuesta sin contar un intento.
- En Reto la corrección aparece al terminar. En los demás modos, al responder.
- Fallar, saltar o consultar la solución deja el lugar para repasar. En Mapa mudo, un error previo también, aunque luego se coloque bien en la misma ronda. Los lugares no intentados no cuentan como fallos.

**Localiza** acepta cualquier punto de la zona del lugar, más un pequeño margen alrededor del punto de referencia y un mínimo en píxeles de pantalla (6 con ratón, 18 en táctil, sin crecer con el zoom). En táctil el punto se puede ajustar antes de confirmar. **Mapa mudo** comprueba el ancla elegida. Si hay otras pendientes a 32 píxeles o menos, pide precisar o ampliar antes de evaluar. Soltar fuera de las anclas no penaliza.

## De nombres a datos

```
sources/lugares.json  ──►  scripts/build_places.py  ──►  places.js
   (solo nombres)           Wikidata + Natural Earth       (lo que usa la web)
sources/correcciones.json ─┘                         └──►  sources/informe.md
```

Para cada nombre, el script:

1. Busca su **identidad** en Wikidata, en español y dentro del ámbito (mundo o Península), eligiendo el resultado cuyo nombre y tipo encajan.
2. Deduce el **tipo** de relieve por la primera palabra del nombre (Cordillera, Cabo, Golfo…) o, si no lo dice, por el tipo de Wikidata.
3. Toma la **zona** de Natural Earth, por el identificador de Wikidata o el nombre. Todas reciben el mismo tratamiento: recorte con la costa real y la misma simplificación.
4. Calcula el **punto de referencia**. En picos y cabos es su coordenada exacta. En el resto es el punto interior más alejado de los bordes.
5. Genera las **respuestas cortas** («Cordillera de los Andes» → andes).

Lo que las fuentes abiertas no resuelven bien va en [`sources/correcciones.json`](sources/correcciones.json): sinónimos, contornos de lugares que no tienen zona en ninguna fuente y alguna identidad o tipo. [`sources/informe.md`](sources/informe.md) resume cómo se resolvió cada lugar y marca con ⚠ lo que conviene revisar. [`sources/ids.json`](sources/ids.json) mantiene el identificador de cada lugar, del que depende el progreso guardado.

Para cambiar el temario:

```sh
# la primera vez
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
# después de editar sources/lugares.json
.venv/bin/python scripts/build_places.py
npm test
```

Revisa el informe y sube la versión `?v=` (véase abajo). Si un lugar nuevo no tiene zona en las fuentes, sale con un círculo aproximado marcado con ⚠, y se puede afinar con un contorno en las correcciones. Los detalles están en [sources/README.md](sources/README.md).

## Desarrollo y publicación

Web estática, sin dependencias ni compilación:

```sh
npm start   # http://localhost:4173
npm test
```

Necesita Node.js 18+ para las pruebas y Python 3 para el servidor local. El generador de lugares necesita además shapely, numpy y Pillow (`scripts/requirements.txt`).

GitHub Pages publica la raíz de la rama `main` y cada push actualiza la web. Pages cachea los archivos 10 minutos. Por eso, al cambiar código o datos hay que subir la versión `?v=` en `index.html`, `app.js` y `data.js` (un test comprueba que todas coinciden). Para trasladar la web a otra URL, actualiza canonical, Open Graph, Twitter, `robots.txt` y `sitemap.xml`.

### Organización

| Archivo | Contenido |
|---|---|
| `index.html`, `style.css` | Estructura y estilos |
| `app.js` | Interfaz y modos de juego |
| `core.js` | Corrección de respuestas, proyecciones, zonas y anclas |
| `places.js` | Lugares generados (no se edita a mano) |
| `data.js` | Adapta `places.js` para la app |
| `scripts/build_places.py` | Generador de lugares |
| `scripts/terrain.py`, `scripts/mercator.py` | Descarga y preparación de los mapas en color |
| `scripts/social.py` | Imagen para redes sociales |
| `tests/core.test.js` | Pruebas |

## Mapas y fuentes

- **Ficha original:** de «Taller 2_Geografía Física_Relieve.pdf» se han recortado y orientado sus dos mapas. No se publica el PDF. Se conserva su nomenclatura: «Cabo Verde» es el cabo de Senegal, no el archipiélago, y los «Alpes del Sur» son los de Nueva Zelanda. Los derechos de esos mapas corresponden a sus autores.
- **Relieve detallado:** [NOAA / NCEI DEM Global Mosaic](https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_global_mosaic_hillshade/ImageServer), que incluye [ETOPO 2022](https://www.ncei.noaa.gov/products/etopo-global-relief-model). Vista general más teselas de detalle que se cargan al ampliar: 14.400 × 9.776 píxeles el mundo (8 × 6 teselas) y 4.000 × 3.540 la Península.
- **Vista general en color:** [Natural Earth II](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/) 1:10m, dominio público. A partir de 3× se cargan encima las teselas del relieve detallado.
- **Lugares:** [Wikidata](https://www.wikidata.org/) (CC0) para la identidad y las coordenadas, y [Natural Earth](https://www.naturalearthdata.com/) vectorial 1:10m (dominio público) para regiones, costa, lagos y mares.

Proyecciones: el mundo usa Mercator entre 84° N y 60° S, como el planisferio de la ficha. `scripts/mercator.py` reproyecta las imágenes moviendo solo filas, sin deformar los meridianos. La Península en color es equirectangular (−11°/4,5°, 35°/45,5°). El mapa original peninsular se registra con una transformación ajustada contra la costa real, con un error mediano de ~1 píxel.

Por defecto el mundo se muestra con Natural Earth (más contraste para puntos y anclas) y la Península con el relieve detallado. La elección manual se respeta al cambiar de ámbito. El original admite hasta 6× y los mapas en color hasta 12× el mundo y 8× la Península. Textos y puntos mantienen su tamaño en pantalla.

## Validación

`npm test` comprueba, entre otras cosas:

- que `places.js` corresponde a la lista de nombres y conserva los identificadores;
- la corrección: nombres completos, respuestas cortas, erratas, genéricos y ambigüedades;
- que cada punto de referencia cae dentro de su zona y lejos del borde, y que las zonas terrestres no se salen al mar;
- que Localiza acepta cualquier parte de cada lugar y rechaza a sus vecinos en los tres mapas, y la distancia de los fallos;
- la separación y selección de anclas a distintas escalas, y la posición de los cabos en el mapa original;
- que todas las referencias llevan la misma versión de caché.

La interfaz se revisa además en navegador en todos los modos, con los tres mapas y en pantallas de 12 a 17 pulgadas.
