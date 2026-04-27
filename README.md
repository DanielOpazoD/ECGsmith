# El ECG del Clínico — v2

Libro digital navegable con lecciones, reglas y casos de electrocardiografía clínica
adaptados de [Dr. Smith's ECG Blog](https://drsmithsecgblog.com/) bajo licencia
Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0).

## Stack técnico

- **Eleventy 3** como generador estático con layouts Nunjucks
- **lightningcss** para minificación de CSS
- **esbuild** para empaquetado y minificación de JS
- **PWA** con service worker (caché offline + caché de imágenes hot-linked)
- **URLs limpias** (`/cap/01-omi-stemi/` en lugar de `.html`)
- **Anclas H2 automáticas** para deep-linking (`/cap/03-oclusion-da/#formula-smith`)

## Estructura

```
src/
├── _data/
│   ├── nav.js              ← TOC del libro (única fuente de verdad)
│   └── site.js             ← metadatos globales
├── _includes/
│   ├── layouts/
│   │   ├── base.njk        ← layout raíz (head, body, scripts)
│   │   └── chapter.njk     ← layout de capítulo (header + nav prev/next)
│   └── partials/
│       ├── topbar.njk      ← barra superior con búsqueda
│       └── sidebar.njk     ← TOC lateral
├── cap/
│   ├── 01-omi-stemi/index.njk
│   ├── 02-t-hiperagudas/index.njk
│   └── …                   ← 11 capítulos
├── apendice/
│   ├── reglas/index.njk
│   ├── glosario/index.njk
│   └── equivalentes-stemi/index.njk
├── css/style.css
├── js/main.js              ← lightbox, búsqueda, navegación
├── icons/favicon.svg
├── manifest.webmanifest    ← PWA manifest
├── sw.js                   ← service worker
├── robots.txt
└── index.njk               ← portada

.eleventy.js                ← config, transforms, after-build hooks
package.json                ← scripts: build, dev
```

## Comandos

```bash
npm install            # instalar dependencias
npm run dev            # servidor de desarrollo en http://localhost:8080
npm run build          # build de producción → _site/
```

El build genera:
- HTML por capítulo con URLs limpias
- `js/main.bundle.js` minificado
- `css/style.css` minificado
- `js/search-index.js` regenerado con todas las secciones y H2 anchors
- `sitemap.xml` con todas las URLs
- `robots.txt` y `manifest.webmanifest` copiados

## Funcionalidades

- 14 páginas (11 capítulos + 3 apéndices) generadas desde un layout único
- Búsqueda interna (`⌘K` / `Ctrl+K` / `/`) con deep-link a secciones específicas
- Visor de imágenes con zoom, pan, descarga y navegación ←/→
- Calculadoras interactivas: fórmula de 4 variables (Smith), Sgarbossa modificada, QTc
- Imágenes ECG reales hot-linkeadas desde el blog original con botón "↗ Original"
- PWA: instalable y consultable offline tras la primera visita
- Service worker que cachea imágenes hot-linkeadas (consulta sin internet)

## Atribución y licencia

Adaptación educativa con fines no comerciales. El contenido del blog original
está publicado bajo CC BY-NC 4.0 por el Dr. Stephen W. Smith y colaboradores.
Todas las imágenes referenciadas mantienen atribución activa al post original.

## Despliegue

El sitio está pensado para GitHub Pages u otro hosting estático:

```bash
npm run build
# Sube _site/ al hosting (o configura GitHub Actions)
```
