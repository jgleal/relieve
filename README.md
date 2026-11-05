# Relieve

Práctica de geografía física para escritorio: **52 elementos del relieve mundial** y **22 de la Península Ibérica**, basados en la ficha original.

**Web:** https://jgleal.github.io/relieve/

## Modos

- **Escribe:** identifica el punto señalado; sesiones aleatorias de 5, 10, 20 o todos los lugares disponibles.
- **Localiza:** lee un nombre y señala su ubicación.
- **Mapa mudo:** arrastra etiquetas a anclas mudas numeradas, o selecciona una y haz clic en el ancla. Usa todos los elementos del filtro elegido.
- **Reto:** escribe los nombres y consulta la corrección al finalizar.
- **Repasa fallos:** vuelve sobre las últimas respuestas incorrectas. Un acierto posterior sin ayuda saca el elemento de este modo.
- **Explora:** consulta nombres y puntos de referencia sin puntuación.

Filtra por continente y tipo de relieve; cambia entre cartografía en color y el mapa original incluso durante una sesión. El número real de preguntas se limita a los elementos disponibles.

## Corrección

Se ignoran mayúsculas, tildes, puntuación y espacios repetidos. Se aceptan alias explícitos y pequeños errores de escritura (una edición a partir de 5 caracteres, dos a partir de 11, solo si el resultado no es ambiguo). Las abreviaciones y erratas aceptadas muestran un aviso y el nombre completo.

Los términos genéricos como **meseta**, **sierra**, **cordillera** o **cabo** nunca bastan para identificar un lugar. **Bética** sí es una abreviación identificativa. **Central** es ambiguo entre Meseta Central y Sistema Central: se pide completar. **Siberia** no distingue las dos unidades. Las respuestas incompletas o ambiguas permiten precisar sin contarse como acierto. En Reto también se pide precisión, sin revelar la solución.

Se muestran únicamente puntos de referencia, sin superficies coloreadas. En **Localiza**, la tolerancia interna usa polígonos para grandes superficies, corredores para cordilleras y radios para picos y cabos. En **Mapa mudo**, el destino es el ancla numerada del elemento: cada ancla mide 22 píxeles, tiene una tolerancia de 17 píxeles y se separa de sus vecinas para evitar solapamientos. Si se desplaza visualmente, una línea la une al punto geográfico real. La numeración y la lista de etiquetas se mezclan de forma independiente para no revelar las soluciones por orden. Soltar fuera de cualquier ancla no penaliza; escoger una ancla incorrecta sí. Son **zonas didácticas aproximadas dibujadas a mano**, no delimitaciones oficiales. Los contornos se pueden revisar en `data.js` y las transformaciones en `core.js`. La Meseta Central es la excepción: utiliza la geometría de «La Meseta» de la capa oficial del Atlas Didáctico del IGN, con sus anillos interiores. La geometría se simplifica a 0,02 grados mediante el servicio de origen; la adaptación al mapa original es una transformación de segundo orden a partir de 12 puntos costeros identificados manualmente (registro aproximado, no georreferenciación oficial). Los datos y puntos de control están en `sources/`; los anillos generados, en `meseta.js`. El planisferio original se registra mediante su retícula de meridianos y paralelos.

Un error previo o consultar una solución deja el lugar pendiente de repaso aunque después se coloque bien. Los lugares no intentados no se cuentan como fallos. Las sesiones sin respuestas muestran cero intentos; no se presenta una nota ficticia. El panel de avisos y el botón de continuar reservan espacio, y la altura del mapa permanece fija durante la ronda para evitar que los destinos se muevan al corregir.

## Uso

1. Elige ámbito geográfico, mapa, modo y filtros.
2. Inicia la sesión.
3. Rueda del ratón o botones +/− para ampliar; Mayús + arrastrar para desplazar; ⤢ restablece la vista.
4. En Localiza o Mapa mudo también puedes enfocar el mapa con Tab, mover el cursor con las flechas y pulsar Intro. Mayús + flecha hace ajustes finos.

El progreso se almacena en `localStorage` bajo `relieve-progress-v1`. No hay cuentas, analítica, cookies ni peticiones a terceros en ejecución. Si el almacenamiento no está disponible, se conserva durante la visita y se muestra un aviso.

## Desarrollo y publicación

Web estática, sin instalación ni compilación:

```sh
npm start
# http://localhost:4173
npm test
```

Requisitos de desarrollo: Node.js 18+ para las pruebas y Python 3 para el servidor local. El navegador solo necesita soporte de módulos ES, SVG y HTML Drag and Drop.

GitHub Pages publica la raíz de la rama `main`, con `.nojekyll`. Cada push actualiza la web. No requiere secretos ni un backend. Para trasladarla a otra URL, actualiza canonical, Open Graph, Twitter, `robots.txt` y `sitemap.xml`.

Incluye favicon SVG, imagen social JPEG de 1200 × 630, metadatos en español y sitemap. Los assets se sirven desde rutas relativas, compatibles con la subruta `/relieve/`.

## Fuentes y materiales

- **Ficha proporcionada:** «Taller 2_Geografía Física_Relieve.pdf». Se han recortado y orientado sus dos mapas; no se publica el PDF completo. El cabo de la Nao figuraba dos veces: aquí hay una entrada. Se conserva la nomenclatura de la ficha. «Cabo Verde» identifica el cabo senegalés, no el archipiélago; «Alpes del Sur», la cordillera de Nueva Zelanda.
- **Natural Earth II with Shaded Relief and Water**, 1:10m, versión 3.2.0: https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/ — datos de dominio público. Descarga original: https://naturalearth.s3.amazonaws.com/10m_raster/NE2_LR_LC_SR_W.zip . Se generaron recortes equirectangulares en WebP; el mundo abarca −180°/180°, −60°/90° y la Península −11°/4,5°, 35°/45,5°.
- **IGN, Atlas Didáctico**, referencia para las unidades peninsulares: https://educativo.ign.es/atlas-didactico/relieve-bach/caractersticas_del_relieve_espaol.html y https://educativo.ign.es/atlas-didactico/relieve-bach/los_rebordes_montaosos_perifricos.html . Salvo la Meseta, los polígonos son aproximaciones propias. **Meseta Central:** geometría de «La Meseta», capa `1114`, objeto `5` del servicio https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1114 . Crédito: © IGN, Atlas Didáctico; licencia CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modificaciones: simplificación a 0,02 grados y registro sobre la ficha original. La clasificación cartográfica de esta capa separa las superficies meseteñas de las unidades montañosas; no se debe interpretar como un límite geológico universal.

Los derechos de los mapas originales de la ficha corresponden a sus respectivos autores. La condición de dominio público de Natural Earth no se extiende a esos recortes. La imagen social se ha compuesto con cartografía de Natural Earth y tipografía.

## Validación

`npm test` verifica el inventario, nombres completos, alias, erratas, rechazo de genéricos y ambigüedades, centros de las 74 ubicaciones en ambas bases, corredores de cordilleras y puntos interiores/exteriores de la Meseta Central, además de la separación y detección de las anclas a diferentes escalas. La interfaz se comprueba además en navegador para escritura, arrastre, mapas originales y cambio de modos.
