# Cartografía y tolerancias de localización

La app muestra puntos, no áreas coloreadas. Solo **Localiza** usa geometrías internas para decidir si una ubicación es válida: polígonos para grandes superficies, corredores para cordilleras y radios para elementos puntuales. Son aproximaciones didácticas propias, salvo la Meseta descrita abajo. **Mapa mudo** comprueba el ancla elegida; no usa estas superficies.

Las referencias están en `data.js` y las transformaciones en `core.js`. El planisferio original se registra mediante su retícula de meridianos y paralelos. Los anillos de la Meseta se generan en `meseta.js`.

## Geometría de la Meseta

Fuente: Instituto Geográfico Nacional, Atlas Didáctico, capa «Unidades del relieve», entidad «La Meseta».

- Contexto y licencia CC BY 4.0: https://educativo.ign.es/atlas-didactico/relieve-bach/las_grandes_unidades_del_relieve_peninsular.html
- Servicio: https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1114
- Consulta: `/query?f=geojson&where=OBJECTID%3D5&outFields=Nombre%2CDescripc&outSR=4326&geometryPrecision=4&maxAllowableOffset=0.02`

`meseta-ign.geojson` conserva la respuesta del servicio: un polígono con un anillo interior. Se solicitó una simplificación de 0,02 grados y cuatro decimales, suficiente para este mapa de práctica. La geometría diferencia las superficies meseteñas de las unidades montañosas interiores: no es un perímetro administrativo ni una frontera geológica universal.

`original-map-registration.json` documenta los doce puntos costeros y el ajuste polinómico que adapta el contorno a la imagen de la ficha. Es un registro manual aproximado. El fondo del mapa original conserva las deformaciones de su reproducción; la transformación no convierte ese fondo en una cartografía oficial.

Crédito de la geometría: © IGN, Atlas Didáctico. CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Adaptaciones: simplificación y transformación a coordenadas de la ficha. Las geometrías del resto de elementos son aproximaciones didácticas propias.
