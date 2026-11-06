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

El planisferio original se registra mediante su retícula de meridianos y paralelos. Las posiciones peninsulares se marcan directamente sobre el mapa original. Los fondos en color proceden de Natural Earth II (dominio público); los derechos de los mapas originales corresponden a sus autores. Los enlaces y créditos de los fondos están en el README principal.
