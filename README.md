# Relieve

Práctica de geografía física para tablet y ordenador: **52 elementos del relieve mundial** y **23 de la Península Ibérica**, basados en la ficha «Taller 2. Geografía Física. Relieve».

**Web:** https://jgleal.github.io/relieve/

Los datos son dos ficheros: [`lugares.json`](lugares.json), la lista de nombres que se edita a mano, y `places.js`, que un script genera con todo lo demás (tipo de relieve, zona válida, punto de referencia y respuestas cortas). Así la web se puede reutilizar con otro temario sobre los mismos mapas (véase [Generar los lugares](#generar-los-lugares)).

## Modos

- **Escribe:** identifica el punto señalado. La pregunta indica el tipo de relieve. Sesiones de 5, 10, 20 o todos los lugares disponibles. La pista muestra las palabras genéricas completas y solo la inicial de las que identifican el lugar («Macizo de A······»). Un acierto con pista suma, pero el lugar sigue en el repaso.
- **Localiza:** lee un nombre y señálalo en el mapa. Vale cualquier punto de la zona del lugar. Si fallas, se marca dónde pinchaste, una línea hasta el punto válido más próximo y la distancia en kilómetros. Con «Ver la zona aceptada al responder» se dibuja además la zona que valía (la preferencia se recuerda).
- **Mapa mudo:** arrastra cada etiqueta a su ancla numerada, o selecciónala y pulsa el ancla.
  - Si detienes la etiqueta sobre un grupo de anclas, aparece una lupa ×3 donde se separan, y se puede soltar dentro de ella.
  - Al fallar, el ancla equivocada tiembla y un aviso aparece donde soltaste.
  - La pista hace latir el ancla correcta y desplaza el mapa hasta ella si está fuera de la vista.
- **Reto:** escribe los nombres y consulta la corrección al terminar.
- **Repasa fallos:** vuelve sobre lo fallado, en el mismo tipo de juego en que se falló. Lo fallado en Localiza o Mapa mudo se señala en el mapa y lo demás se escribe. Un acierto posterior sin ayuda lo retira del repaso.
- **Explora:** consulta nombres y puntos sin puntuación. Cada punto se colorea según tu progreso (acertado, fallado, sin intentar). Con «Ver la zona del lugar» se dibuja la zona del lugar elegido, y con «Ver la corrección de la ficha» el mapa original pasa a mostrar la ficha corregida. Si el mapa está ampliado, al elegir un lugar de la lista el mapa se centra en él. «Ver todos los nombres» convierte el mapa en una hoja de estudio: pulsa un nombre o un punto para taparlo o destaparlo, o tápalos todos y ve descubriéndolos.
- **Ficha para imprimir:** genera una ficha sobre el mapa original con 10, 15, 20 o todos los lugares de la selección, elegidos al azar. Lleva líneas para responder, y opcionalmente la lista de nombres y una hoja de soluciones. Se imprime o se guarda como PDF desde el navegador.

Se puede filtrar por continente y tipo de relieve, y cambiar de mapa (relieve detallado, Natural Earth o el original de la ficha) incluso en mitad de una sesión, conservando la zona y el zoom. Al terminar una ronda, los resultados ofrecen repasar los fallos o volver al inicio.

## Uso

1. Elige ámbito, mapa, modo y filtros, e inicia la sesión.
2. Amplía con la rueda, con +/− o, en pantallas táctiles, pellizcando con dos dedos. Arrastra el mapa para moverte cuando está ampliado. ⤢ restablece la vista.
3. En Localiza y Mapa mudo también se puede usar el teclado: Tab enfoca el mapa, las flechas mueven el cursor (con Mayús, en pasos finos) e Intro confirma.

No hay scroll de página: durante una sesión la configuración se oculta, el selector de mapa pasa a la cabecera del mapa y el mapa ocupa el alto disponible. Las listas largas, como las etiquetas o los resultados, se desplazan por separado.

El progreso se guarda en este navegador (`localStorage`, clave `relieve-progress-v1`). No hay cuentas, analítica, cookies ni peticiones a terceros durante el uso. «Borrar mi progreso», en la cabecera, lo reinicia.

## Corrección

- Se ignoran mayúsculas, tildes, puntuación y espacios repetidos.
- Se aceptan respuestas cortas que identifican el lugar («Bética», «Andes») y pequeñas erratas: una a partir de 5 caracteres y dos a partir de 11, solo si no hay ambigüedad. En esos casos se muestra el nombre completo.
- Las palabras genéricas (meseta, sierra, cordillera, cabo…) nunca bastan. Las ambiguas, como «Central» (Meseta o Sistema Central), piden completar la respuesta sin contar un intento.
- En Reto la corrección aparece al terminar. En los demás modos, al responder.
- Fallar, saltar o consultar la solución deja el lugar para repasar. En Mapa mudo, un error previo también, aunque luego se coloque bien en la misma ronda. Los lugares no intentados no cuentan como fallos.

**Localiza** acepta cualquier punto de la zona del lugar, con un margen junto al borde de 6 píxeles de pantalla con ratón y 18 en táctil. Picos y cabos no tienen zona: vale un círculo alrededor del punto, el mayor entre su radio geográfico (unos 28 km en el mundo y 13 km en la Península) y esos mismos píxeles. Con el mapa alejado manda el mínimo en pantalla, porque no se puede pinchar con más precisión; ampliado, el radio geográfico. «Ver la zona» dibuja exactamente lo que se acepta. En táctil el punto se puede ajustar antes de confirmar. **Mapa mudo** comprueba el ancla elegida. Si hay otras pendientes a 32 píxeles o menos, pide precisar o ampliar antes de evaluar. Soltar fuera de las anclas no penaliza.

## Generar los lugares

```
lugares.json  ──►  scripts/build_places.py  ──►  places.js
 (a mano)          Wikidata + Natural Earth       (generado, no se toca)
```

Para cambiar el temario, edita `lugares.json` y ejecuta:

```sh
# solo la primera vez
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
npm run lugares
npm test
```

El script muestra por consola los lugares nuevos y lo que conviene revisar (⚠). Con `--todo` (`npm run lugares -- --todo`) muestra todos. Si algún lugar no se resuelve, lo dice y no toca `places.js`. Después, sube la versión `?v=` (véase abajo).

### Qué hace con cada nombre

1. **Identidad.** Lo busca en Wikidata en español: completo, sin las palabras genéricas y sin la última palabra. Elige el resultado cuyo nombre y tipo encajan y descarta los que caen fuera del ámbito; la Península abarca de 12° O a 6° E y de 34° N a 46° N. Así evita homónimos como insectos llamados Aconcagua o la Sierra Nevada de California.
2. **Tipo.** Lo da la primera palabra del nombre (Cordillera, Sistema, Sierra, Meseta, Cabo, Golfo, Península…) o, si no lo dice, el tipo de Wikidata.
3. **Zona** de Localiza, por este orden:
   - un `contorno` propio;
   - las regiones de Natural Earth indicadas en `natural_earth`;
   - la región de Natural Earth con el mismo identificador de Wikidata o el mismo nombre en español, a menos de 3° (mundo) o 0,6° (Península) del lugar;
   - si no hay ninguna, un círculo aproximado, marcado con ⚠.
4. **Mismo tratamiento para todas las zonas.** Se recortan con la costa de Natural Earth 1:10m, quedándose con la tierra o con el agua según el tipo; lagos y el Caspio no se recortan. En la Península también se recortan con el marco del mapa original. Todas se simplifican igual (0,08° el mundo, 0,015° la Península).
5. **Punto de referencia.**
   - Picos y cabos usan su coordenada exacta, con un radio de acierto de 0,25° en el mundo y 0,12° en la Península.
   - Los cabos peninsulares se ajustan además a la costa dibujada del mapa original.
   - El resto usa el punto interior más alejado de los bordes, descontando los lugares de la lista que contiene. Así el punto de la Meseta Central no cae en el Sistema Central.
6. **Respuestas cortas.** El nombre sin las palabras genéricas iniciales («Cordillera de los Andes» → andes) y, si empieza por «Gran», también sin «Gran». Los alias de Wikidata no se usan porque no son fiables.

`places.js` guarda también el identificador de cada lugar (`w0`, `i3`…), del que depende el progreso guardado, y su identidad en Wikidata. La siguiente ejecución los reutiliza, así que un lugar no cambia de identidad ni pierde el progreso. Los lugares nuevos reciben el siguiente número libre. `--refresh` vuelve a buscar todas las identidades, y `NE_CACHE=<carpeta>` reutiliza las descargas de Natural Earth.

### Afinar un lugar

Cuando las fuentes abiertas no bastan, en lugar del nombre se pone un objeto con `nombre` y los campos necesarios:

```json
"Montes Atlas",
{"nombre": "Golfo de Cádiz", "contorno": [[-8.95, 37], [-7.4, 37.2], [-6.35, 36.9], [-6, 36.3], [-6.3, 35.95], [-7.5, 36.15], [-8.95, 36.55]]},
{"nombre": "Macizo de Ahaggar", "natural_earth": ["AHAGGAR MTS."], "alias_extra": ["hoggar"]}
```

| Campo | Uso |
|---|---|
| `wikidata` | Fija la identidad (`"Q169175"`) cuando la búsqueda no da con ella |
| `tipo` | Fuerza el tipo de relieve |
| `natural_earth` | Regiones de Natural Earth que forman la zona (con `lake:` o `marine:` para lagos y mares) |
| `contorno` | Polígono propio en `[lon, lat]`, para lugares sin zona en ninguna fuente |
| `punto`, `punto_original` | Coordenada del punto de referencia (en un lugar con zona sustituye al calculado y debe caer dentro), o píxel en el mapa original peninsular |
| `radio` | Radio de acierto de un pico o cabo |
| `alias_extra` | Sinónimos aceptados además de los automáticos (Hoggar, Fisterra…) |
| `alias` | Sustituye por completo las respuestas cortas |

Hoy llevan contorno propio los sistemas y sierras peninsulares, los golfos de Cádiz, Valencia y Alicante, las mesetas de Irán y del lago Victoria, la cuenca del Chad y la península del Labrador completa (Natural Earth solo tiene su franja costera). Son zonas didácticas generosas, no límites oficiales: una sierra queda dentro del sistema del que forma parte.

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
| `lugares.json` | Lista de lugares (se edita a mano) |
| `places.js` | Lugares generados (no se edita a mano) |
| `data.js` | Adapta `places.js` para la app |
| `scripts/build_places.py` | Generador de lugares |
| `scripts/terrain.py`, `scripts/natural.py`, `scripts/mercator.py` | Preparación de los mapas en color |
| `scripts/social.py` | Imagen para redes sociales |
| `tests/core.test.js` | Pruebas |

## Mapas y fuentes

- **Ficha corregida:** «Taller 2_Geografía Física_Relieve_mapas corregidos.pdf» trae los mismos mapas con la corrección encima. `assets/corrected-*.webp` son esos mapas con el mismo encuadre que `original-*.webp` (alineados con un desfase inferior a 0,3 píxeles) y al doble de resolución, para que la letra pequeña se lea al ampliar. Por eso comparten las coordenadas del mapa original. La ficha corregida lista dos veces el Cabo de la Nao, igual que la original, pero su mapa marca el Cabo de Palos, que se ha añadido.
- **Ficha original:** de «Taller 2_Geografía Física_Relieve.pdf» se han recortado y orientado sus dos mapas. No se publica el PDF. Se conserva su nomenclatura: «Cabo Verde» es el cabo de Senegal, no el archipiélago, y los «Alpes del Sur» son los de Nueva Zelanda. Los derechos de esos mapas corresponden a sus autores.
- **Relieve detallado:** [NOAA / NCEI DEM Global Mosaic](https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_global_mosaic_hillshade/ImageServer), que incluye [ETOPO 2022](https://www.ncei.noaa.gov/products/etopo-global-relief-model). Vista general más teselas de detalle que se cargan al ampliar: 14.400 × 9.776 píxeles el mundo (8 × 6 teselas) y 4.000 × 3.540 la Península.
- **Natural Earth:** [Natural Earth II](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/) 1:10m en alta resolución, dominio público. En el mundo tiene sus propias teselas de detalle (`scripts/natural.py`), con la misma rejilla y resolución que el relieve.
- **Lugares:** [Wikidata](https://www.wikidata.org/) (CC0) para la identidad y las coordenadas, y [Natural Earth](https://www.naturalearthdata.com/) vectorial 1:10m (dominio público) para regiones, costa, lagos y mares.

Proyecciones:

- **Mapas en color:** el mundo usa Mercator entre 84° N y 60° S, como el planisferio de la ficha. `scripts/mercator.py` reproyecta las imágenes moviendo solo filas, sin deformar los meridianos. La Península es equirectangular (−11°/4,5°, 35°/45,5°). `scripts/terrain.py` descarga las imágenes de NOAA y genera la vista general y las teselas; esto se hace al preparar los archivos, nunca desde el navegador.
- **Planisferio original:** Mercator, registrado por su retícula de meridianos y paralelos.
- **Península original:** transformación cuadrática longitud/latitud → píxel (`originalIberia` en `core.js`), ajustada por ICP contra la costa de Natural Earth. El error mediano es de ~1 píxel sobre la imagen de 1057 × 753. Finisterre (42,8825° N, 9,2722° O, según [Turismo de Galicia](https://www.turismo.gal/recurso/-/detalle/190524000446/cabo-fisterra?ctre=40000140&langId=es_ES&tp=40003930)) cae en el saliente al norte de la ensenada de Corcubión, no en el gancho de Monte Louro, que una versión anterior confundía con él.

Por defecto el mundo se muestra con Natural Earth (más contraste para puntos y anclas) y la Península con el relieve detallado. La elección manual se respeta al cambiar de ámbito. Cada mapa se muestra siempre tal cual, sin cambiar a otro al ampliar, y su zoom máximo es el que permite su resolución: 6× el original, 12× los mapas en color del mundo, 8× el relieve de la Península y 3× Natural Earth en la Península, porque su fuente no da para más. Si cambias a un mapa con más zoom del que admite, la vista se aleja hasta su máximo. Textos y puntos mantienen su tamaño en pantalla.

## Validación

`npm test` comprueba, entre otras cosas:

- que `places.js` corresponde a la lista de nombres y conserva los identificadores;
- la corrección: nombres completos, respuestas cortas, erratas, genéricos y ambigüedades;
- que cada punto de referencia cae dentro de su zona y lejos del borde, y que las zonas terrestres no se salen al mar;
- que Localiza acepta cualquier parte de cada lugar y rechaza a sus vecinos en los tres mapas, y la distancia de los fallos;
- la separación y selección de anclas a distintas escalas, y la posición de los cabos en el mapa original;
- que todas las referencias llevan la misma versión de caché.

La interfaz se revisa además en navegador en todos los modos, con los tres mapas y en pantallas de 12 a 17 pulgadas.
