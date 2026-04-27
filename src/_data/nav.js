/**
 * Estructura del libro: única fuente de verdad para sidebar, portada y prev/next.
 * Cambia algo aquí y se propaga a todas las páginas en el build.
 */
export default {
  cover: {
    url: "/",
    label: "Portada",
    icon: "★",
  },
  parts: [
    {
      id: "I",
      title: "Parte I — Paradigma",
      shortTitle: "Parte I · Paradigma",
      chapters: [
        {
          slug: "01-omi-stemi",
          num: "01",
          shortTitle: "OMI vs STEMI",
          title: "El paradigma OMI vs STEMI",
        },
      ],
    },
    {
      id: "II",
      title: "Parte II — Patrones de oclusión",
      shortTitle: "Parte II · Patrones de oclusión",
      chapters: [
        {
          slug: "02-t-hiperagudas",
          num: "02",
          shortTitle: "Ondas T hiperagudas",
          title: "Ondas T hiperagudas",
        },
        {
          slug: "03-oclusion-da",
          num: "03",
          shortTitle: "Oclusión de la DA",
          title: "Oclusión de la descendente anterior",
        },
        {
          slug: "04-wellens",
          num: "04",
          shortTitle: "Síndrome de Wellens",
          title: "Síndrome de Wellens",
        },
        {
          slug: "05-bri-sgarbossa",
          num: "05",
          shortTitle: "OMI con BRI",
          title: "OMI con bloqueo de rama izquierda",
        },
        {
          slug: "09-omi-inferior-posterior",
          num: "09",
          shortTitle: "OMI inf · post · VD",
          title: "OMI inferior, posterior y de VD",
        },
        {
          slug: "10-avr-lmca",
          num: "10",
          shortTitle: "aVR · tronco · 3v",
          title: "Patrón aVR — lesión del tronco y 3 vasos",
        },
      ],
    },
    {
      id: "III",
      title: "Parte III — Imitadores y trampas",
      shortTitle: "Parte III · Imitadores y trampas",
      chapters: [
        {
          slug: "06-hiperkalemia",
          num: "06",
          shortTitle: "Hiperkalemia",
          title: "Hiperkalemia",
        },
        {
          slug: "07-taquicardia-ancha",
          num: "07",
          shortTitle: "Taquicardia ancha",
          title: "Taquicardia de complejo ancho",
        },
        {
          slug: "08-tep",
          num: "08",
          shortTitle: "TEP",
          title: "Tromboembolismo pulmonar",
        },
        {
          slug: "11-stemi-mimics",
          num: "11",
          shortTitle: "STEMI mimics",
          title: "STEMI mimics",
        },
      ],
    },
  ],
  appendices: [
    {
      slug: "reglas",
      letter: "A",
      shortTitle: "Reglas y ecuaciones",
      title: "Reglas y ecuaciones",
    },
    {
      slug: "glosario",
      letter: "B",
      shortTitle: "Glosario",
      title: "Glosario y referencias",
    },
    {
      slug: "equivalentes-stemi",
      letter: "C",
      shortTitle: "Patrones equivalentes",
      title: "Patrones equivalentes STEMI",
    },
  ],
};
