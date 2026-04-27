/**
 * Eleventy config — El ECG del Clínico
 *
 * - Lee desde src/, escribe a _site/
 * - Layout único en src/_includes/layouts/
 * - Permalinks limpios: /cap/{slug}/, /apendice/{slug}/
 * - Auto-IDs en H2 (deep linking) vía transform
 * - Genera search-index.json a partir de las collections
 */

import fs from "node:fs/promises";
import path from "node:path";

// Slug simple sin dependencia externa
function slugifyText(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export default function (eleventyConfig) {
  // ────────────────────────────────────────────────
  // Static passthrough
  // ────────────────────────────────────────────────
  // CSS y JS los gestiona el build script (lightningcss + esbuild).
  // Solo pasamos los iconos y archivos sueltos.
  eleventyConfig.addPassthroughCopy({ "src/icons": "icons" });
  eleventyConfig.addPassthroughCopy({ "src/manifest.webmanifest": "manifest.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "src/sw.js": "sw.js" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // ────────────────────────────────────────────────
  // Filtros
  // ────────────────────────────────────────────────
  eleventyConfig.addFilter("slug", slugifyText);

  eleventyConfig.addFilter("absoluteUrl", (url, base = "https://danielopazo.github.io/ECGsmith") => {
    if (!url) return base;
    return base.replace(/\/$/, "") + (url.startsWith("/") ? url : "/" + url);
  });

  eleventyConfig.addFilter("readableDate", (date) => {
    return new Date(date).toISOString().split("T")[0];
  });

  // ────────────────────────────────────────────────
  // Collections
  // ────────────────────────────────────────────────
  eleventyConfig.addCollection("chapters", (api) =>
    api.getFilteredByGlob("src/cap/**/index.njk").sort((a, b) => {
      return (a.data.order || 0) - (b.data.order || 0);
    })
  );

  eleventyConfig.addCollection("appendices", (api) =>
    api.getFilteredByGlob("src/apendice/**/index.njk").sort((a, b) => {
      return (a.data.order || 0) - (b.data.order || 0);
    })
  );

  // ────────────────────────────────────────────────
  // Transform: auto-IDs en H2 + extracción para search index
  // ────────────────────────────────────────────────
  // Mapa global de secciones por URL para construir el search index
  const sectionsByUrl = new Map();

  eleventyConfig.addTransform("h2-anchors", function (content) {
    if (!(this.page.outputPath && this.page.outputPath.endsWith(".html"))) return content;

    const sections = [];
    const seen = new Map();

    // Auto-IDs en H2: solo si no tienen id ya
    const transformed = content.replace(
      /<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g,
      (full, attrs = "", inner) => {
        // Si ya tiene id, respétalo
        const idMatch = (attrs || "").match(/\sid=["']([^"']+)["']/);
        const text = inner.replace(/<[^>]+>/g, "").trim();
        let id = idMatch ? idMatch[1] : slugifyText(text) || "section";
        // Evitar colisiones en una misma página
        if (seen.has(id)) {
          const n = seen.get(id) + 1;
          seen.set(id, n);
          id = `${id}-${n}`;
        } else {
          seen.set(id, 1);
        }
        sections.push({ id, title: text });
        // Si ya tenía id, lo dejamos; si no, lo añadimos.
        if (idMatch) return full;
        return `<h2${attrs} id="${id}">${inner}</h2>`;
      }
    );

    sectionsByUrl.set(this.page.url, sections);
    return transformed;
  });

  // ────────────────────────────────────────────────
  // Generación del search-index.json al terminar el build
  // ────────────────────────────────────────────────
  // Helper: extrae metadatos del HTML renderizado
  function extractMeta(html) {
    const stripTags = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const titleMatch = html.match(/<h1 class="chapter-title">([\s\S]*?)<\/h1>/);
    const pillMatch = html.match(/<span class="pill">([^<]+)<\/span>\s*<span>([^<]+)<\/span>/);
    const kwMatch = html.match(/<meta name="keywords" content="([^"]*)"/);
    const titleTag = html.match(/<title>([^<]*)<\/title>/);
    let title = titleMatch ? stripTags(titleMatch[1]) : (titleTag ? stripTags(titleTag[1]).split("·")[0].trim() : "");
    let chapter = "★", part = "Inicio";
    if (pillMatch) {
      const pill = pillMatch[1].trim();
      const dm = pill.match(/\d+/);
      const lm = pill.match(/Apéndice\s+([A-Z])/);
      if (dm) chapter = dm[0].padStart(2, "0");
      else if (lm) chapter = lm[1];
      part = pillMatch[2].trim();
    }
    const keywords = kwMatch ? kwMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
    return { title, chapter, part, keywords };
  }

  eleventyConfig.on("eleventy.after", async ({ dir, results }) => {
    const entries = [];
    for (const r of results) {
      if (!r.outputPath || !r.outputPath.endsWith(".html")) continue;
      const sections = sectionsByUrl.get(r.url) || [];
      const { title, chapter, part, keywords } = extractMeta(r.content || "");
      if (!title && r.url !== "/") continue;
      entries.push({
        url: r.url,
        chapter: chapter,
        title: title || "Portada",
        part: part,
        sections: sections.map((s) => ({ id: s.id, title: s.title })),
        keywords: keywords,
      });
    }

    const outPath = path.join(dir.output, "js", "search-index.js");
    const js = `// Índice de búsqueda — generado por build (${new Date().toISOString()})\nwindow.SEARCH_INDEX = ${JSON.stringify(
      entries,
      null,
      0
    )};\n`;
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, js, "utf8");
    console.log(`[search-index] ${entries.length} entries → ${outPath}`);

    // Sitemap.xml
    const base = "https://danielopazo.github.io/ECGsmith";
    const sitemap =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries
        .map(
          (e) =>
            `  <url><loc>${base}${e.url}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
        )
        .join("\n") +
      `\n</urlset>\n`;
    await fs.writeFile(path.join(dir.output, "sitemap.xml"), sitemap, "utf8");
    console.log(`[sitemap] ${entries.length} URLs → sitemap.xml`);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
