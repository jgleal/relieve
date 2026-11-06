# Relieve

Práctica de geografía para escritorio: **52 elementos del relieve mundial** y **22 de la Península Ibérica**, basados en la ficha original.

**Web:** https://jgleal.github.io/relieve/

## Modos

- **Escribe:** identifica el punto señalado con una pregunta que indica el tipo de relieve; sesiones aleatorias de 5, 10, 20 o todos los lugares disponibles.
- **Localiza:** lee un nombre y señala su ubicación.
- **Mapa mudo:** arrastra etiquetas a anclas mudas numeradas, o selecciona una y haz clic en el ancla. Usa todos los elementos del filtro elegido.
- **Reto:** escribe los nombres y consulta la corrección al finalizar.
- **Repasa fallos:** vuelve sobre las últimas respuestas incorrectas. Un acierto posterior sin ayuda saca el elemento de este modo.
- **Explora:** consulta nombres y puntos de referencia sin puntuación.

Filtra por continente y tipo de relieve; cambia entre cartografía en color y el mapa original incluso durante una sesión. El número real de preguntas se limita a los elementos disponibles.

## Corrección

Se ignoran mayúsculas, tildes, puntuación y espacios repetidos. Se aceptan alias explícitos y pequeños errores de escritura (una edición a partir de 5 caracteres, dos a partir de 11, solo si el resultado no es ambiguo). Las abreviaciones y erratas aceptadas muestran el nombre completo y un aviso: al responder en Escribe y Repasa fallos, o en los resultados de Reto.

Los términos genéricos como **meseta**, **sierra**, **cordillera** o **cabo** nunca bastan para identificar un lugar. **Bética** sí es una abreviación identificativa. **Central** es ambiguo entre Meseta Central y Sistema Central: se pide completar. **Siberia** no distingue las dos unidades. Las respuestas incompletas o ambiguas permiten precisar sin registrar un intento. En Reto también se pide precisión, sin revelar la solución.

Se muestran únicamente puntos de referencia, sin superficies coloreadas. En **Localiza** se admite un margen geográfico. Las tolerancias son aproximaciones didácticas; los detalles y fuentes cartográficas están en [sources/README.md](sources/README.md).

En **Mapa mudo**, el destino es el ancla numerada del elemento. La ficha compacta sigue al puntero durante el arrastre; también se puede seleccionar una etiqueta y hacer clic en un ancla. Al pasar por un ancla se muestra el tipo de relieve, sin revelar su nombre. Las anclas miden 22 píxeles, se separan para evitar solapamientos y admiten un radio de selección de 17 píxeles. Si una se desplaza, una línea la conecta con su posición geográfica. La numeración y la lista de etiquetas se mezclan de forma independiente.

Si el ancla elegida tiene otras pendientes a 32 píxeles o menos, se solicita precisar por número y tipo, ampliar la zona o cancelar. No se registra un intento hasta elegir un ancla concreta. Soltar fuera de las anclas no penaliza; confirmar una ancla incorrecta sí.

En Mapa mudo, un error previo o consultar la solución deja el lugar pendiente de repaso aunque después se coloque bien en esa misma ronda. En las sesiones de escritura y Localiza, fallar, saltar o consultar la solución deja el lugar para repasar. Un acierto posterior sin ayuda lo retira. Los lugares no intentados no se cuentan como fallos. Las sesiones sin respuestas muestran cero intentos; no se presenta una nota ficticia. Los avisos solo ocupan espacio cuando hay un mensaje. La lista de etiquetas aprovecha la altura disponible y se desplaza por separado; el mapa mantiene una altura fija durante la ronda para que sus destinos no se muevan al corregir.

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

Requisitos de desarrollo: Node.js 18+ para las pruebas y Python 3 para el servidor local. El navegador solo necesita soporte de módulos ES, SVG, Canvas 2D y Pointer Events.

GitHub Pages publica la raíz de la rama `main`, con `.nojekyll`. Cada push actualiza la web. No requiere secretos ni un backend. Para trasladarla a otra URL, actualiza canonical, Open Graph, Twitter, `robots.txt` y `sitemap.xml`.

Incluye favicon SVG, imagen social JPEG de 1200 × 630, metadatos en español y sitemap. Los assets se sirven desde rutas relativas, compatibles con la subruta `/relieve/`.

## Fuentes y materiales

- **Ficha proporcionada:** «Taller 2_Geografía Física_Relieve.pdf». Se han recortado y orientado sus dos mapas; no se publica el PDF completo. Se conserva la nomenclatura de la ficha. «Cabo Verde» identifica el cabo senegalés, no el archipiélago; «Alpes del Sur», la cordillera de Nueva Zelanda.
- **Natural Earth II with Shaded Relief and Water**, 1:10m, versión 3.2.0: https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/ — datos de dominio público. Descarga original: https://naturalearth.s3.amazonaws.com/10m_raster/NE2_LR_LC_SR_W.zip . Se generaron recortes equirectangulares en WebP; el mundo abarca −180°/180°, −60°/90° y la Península −11°/4,5°, 35°/45,5°.
- Las tolerancias de **Localiza** son aproximaciones didácticas propias: polígonos sencillos, corredores y radios. La Meseta usa el mismo modelo de polígonos que otras superficies, sin contornos oficiales ni exclusiones interiores. Véase [cartografía y tolerancias](sources/README.md).

Los derechos de los mapas originales de la ficha corresponden a sus respectivos autores. La condición de dominio público de Natural Earth no se extiende a esos recortes. La imagen social se compone con cartografía de Natural Earth y tipografía. `scripts/social.py` permite regenerarla con Python, Pillow y las fuentes Arial y Georgia de macOS; no interviene en el funcionamiento ni el despliegue de la web.

## Validación

`npm test` verifica el inventario, nombres completos, alias, erratas, rechazo de genéricos y ambigüedades, centros de las 74 ubicaciones en ambas bases, corredores de cordilleras y puntos interiores/exteriores de la Meseta Central, además de la separación y detección de las anclas a diferentes escalas. También verifica los tipos de relieve y la selección entre anclas cercanas a distintas escalas. La interfaz se comprueba además en navegador para escritura, arrastre, mapas originales y cambio de modos.

