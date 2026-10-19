# Estudio SEO de Kahoot Builder

Fecha: 19 de octubre de 2026. Alcance: revisión del código y de la configuración de la aplicación. La página publicada no fue accesible desde la herramienta de consulta, así que este estudio no incluye datos de Search Console, velocidad real ni posiciones de búsqueda.

## Diagnóstico

| Prioridad | Hallazgo | Acción aplicada |
| --- | --- | --- |
| Alta | La portada tenía un título genérico y una descripción centrada en compartir enlaces. | Título y descripción que explican la utilidad real: crear preguntas en grupo y exportarlas a Excel para Kahoot. |
| Alta | No había URL canónica ni sitemap. | Canonical sin parámetros de consulta, `sitemap.xml` con la portada y `robots.txt` que anuncia el sitemap. |
| Alta | Las páginas de salas, cuenta, registro y acceso podían quedar indexadas aunque no son resultados públicos útiles. | `noindex,follow` en esas rutas. Se permite el rastreo para que los robots puedan leer la directiva. Las salas mantienen sus etiquetas de vista previa social. |
| Media | La portada explicaba las funciones, pero no el proceso completo. | Sección visible de tres pasos, en español e inglés, con encabezados y texto útil. |
| Media | El idioma predeterminado del HTML servido era inglés, mientras que los metadatos predeterminados para compartir eran españoles. | Idioma de reserva español para el renderizado inicial. |

## Estrategia de indexación

La URL de inicio es la única página pública que debe aparecer en el sitemap. Las salas contienen contenido aportado por usuarios; las páginas de cuenta y acceso dependen de una sesión. Por ello no se incluyen en el sitemap y se marcan `noindex,follow`. `robots.txt` no las bloquea: [Google necesita poder rastrear una página para leer `noindex`](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

La URL canónica de la portada conserva el dominio y la ruta recibidos, pero elimina parámetros como `action` o `lang`. Google trata el canonical y el sitemap como señales para elegir la URL representativa, sin garantizar que use la sugerida: [documentación de canonicalización](https://developers.google.com/search/docs/crawling-indexing/canonicalization) y [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

El título y la descripción describen contenido visible en la portada. [Google recomienda títulos concisos y descriptivos](https://developers.google.com/search/docs/appearance/title-link) y puede usar la [meta descripción](https://developers.google.com/search/docs/appearance/snippet) cuando resume mejor la página. La sección de pasos aporta información para personas que buscan cómo preparar un Kahoot en grupo, de acuerdo con su [guía de contenido útil](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Seguimiento tras publicar

1. Comprobar en el dominio público que la portada devuelve HTTP 200 y que el HTML inicial incluye el título, la descripción, el canonical y la etiqueta de verificación de Google.
2. Comprobar `robots.txt` y `sitemap.xml` en el dominio público y enviar el sitemap en Search Console. La verificación del dominio solo puede completarse cuando la versión publicada contenga la etiqueta.
3. Inspeccionar una URL de sala y una de acceso en Search Console para confirmar `noindex` y que las vistas previas sociales siguen funcionando.
4. Revisar las consultas, impresiones, clics y Core Web Vitals tras acumular datos reales; este estudio no asigna cifras ni promete resultados de posicionamiento.

No se añaden URLs `hreflang`: el selector de idioma actual no ofrece dos URLs estables con contenido HTML inicial distinto por idioma. Si se decide posicionar español e inglés por separado, el siguiente paso es crear rutas localizadas y servir cada idioma desde el servidor.
