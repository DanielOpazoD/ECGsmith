# El ECG del Clínico

Libro digital navegable con lecciones, reglas y casos de electrocardiografía clínica
adaptados de [Dr. Smith's ECG Blog](https://drsmithsecgblog.com/) bajo licencia
Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0).

## Estructura

```
ecg-libro/
├── index.html               Portada y tabla de contenido
├── css/style.css            Sistema de diseño
├── js/nav.js                Navegación + lightbox con zoom
├── capitulos/               11 capítulos
└── apendices/               3 apéndices (reglas, glosario, equivalentes STEMI)
```

## Capítulos

**Parte I — Paradigma**
- 01. OMI vs STEMI

**Parte II — Patrones de oclusión**
- 02. Ondas T hiperagudas
- 03. Oclusión de la DA
- 04. Síndrome de Wellens
- 05. OMI con BRI
- 09. OMI inferior, posterior y de VD
- 10. Patrón aVR · lesión del tronco · 3 vasos

**Parte III — Imitadores y trampas**
- 06. Hiperkalemia
- 07. Taquicardia de complejo ancho
- 08. Tromboembolismo pulmonar
- 11. STEMI mimics

**Apéndices**
- A. Reglas y ecuaciones (con calculadoras interactivas)
- B. Glosario y referencias
- C. Patrones equivalentes STEMI

## Funcionalidades

- Diseño responsive con sidebar persistente y barra de progreso de lectura
- Visor de imágenes con zoom +/−, pan, descarga y atajos de teclado
- Calculadoras interactivas: fórmula de 4 variables (Smith), Sgarbossa modificada, QTc
- Imágenes ECG reales hot-linkeadas desde el blog original con botón "↗ Original"
  en cada figura para acceder al post fuente

## Atribución y licencia

Adaptación educativa con fines no comerciales. El contenido del blog original
está publicado bajo CC BY-NC 4.0 por el Dr. Stephen W. Smith y colaboradores.
Todas las imágenes referenciadas mantienen atribución activa al post original.

## Cómo usar

Abre `index.html` en cualquier navegador moderno. No requiere build ni servidor.
