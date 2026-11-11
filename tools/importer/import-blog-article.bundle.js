/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-blog-article.js
  var import_blog_article_exports = {};
  __export(import_blog_article_exports, {
    default: () => import_blog_article_default
  });

  // tools/importer/parsers/article-header.js
  var ALT_TEXT = {
    "https://www.datocms-assets.com/2885/1506457090-blog-vagrant.svg": "HashiCorp Vagrant logo"
  };
  var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  function absolute(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function assetUrl(src) {
    let url = absolute(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute(inner);
    }
    return url;
  }
  function baseUrl(url) {
    return url.split("?")[0];
  }
  function deliverableUrl(url) {
    return /\.svg$/i.test(baseUrl(url)) ? `${baseUrl(url)}?fm=png&w=444` : url;
  }
  function image(document, src, alt) {
    const img = document.createElement("img");
    const url = assetUrl(src);
    img.src = deliverableUrl(url);
    img.alt = alt || ALT_TEXT[baseUrl(url)] || "";
    return img;
  }
  function isoDate(text) {
    const m = (text || "").trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})$/);
    if (!m) return "";
    const month = MONTHS.indexOf(m[1].toLowerCase());
    if (month < 0) return "";
    return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  function linkParagraphs(document, links) {
    return links.map((a) => {
      const p = document.createElement("p");
      const link2 = document.createElement("a");
      link2.href = absolute(a.getAttribute("href"));
      link2.textContent = a.textContent.trim().replace(/,$/, "");
      p.append(link2);
      return p;
    });
  }
  function hinted(document, field, nodes) {
    const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
    if (!list.length) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    list.forEach((n) => frag.appendChild(typeof n === "string" ? document.createTextNode(n) : n));
    return frag;
  }
  function parse(element, { document }) {
    var _a, _b, _c;
    const breadcrumbs = linkParagraphs(document, [...element.querySelectorAll("nav a")]);
    const title = ((_a = element.querySelector("h1")) == null ? void 0 : _a.textContent.trim()) || "";
    const subtitle = element.querySelector('[class*="header_subtitle"]');
    const intro = ((subtitle == null ? void 0 : subtitle.textContent) || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).map((t) => {
      const p = document.createElement("p");
      p.textContent = t;
      return p;
    });
    const date = isoDate((_b = document.querySelector('[class*="metadata_date"]')) == null ? void 0 : _b.textContent);
    const tags = linkParagraphs(document, [...element.querySelectorAll('[class*="style_tag"] a')]);
    const heroImg = document.querySelector('[class*="post_image"] img');
    const hero = heroImg ? image(document, heroImg.getAttribute("src"), heroImg.getAttribute("alt")) : null;
    const cells = [
      [hinted(document, "breadcrumbs", breadcrumbs)],
      [hinted(document, "title", title)],
      [hinted(document, "intro", intro)],
      [hinted(document, "publishDate", date)],
      [hinted(document, "tags", tags)],
      [hinted(document, "image", hero)]
    ];
    const byline = element.querySelector('[class*="header_byline"]');
    const photos = byline ? [...byline.querySelectorAll('[class*="header_authorImages"] img')] : [];
    const names = byline ? [...byline.querySelectorAll('[class*="header_authors"] li')] : [];
    names.forEach((li, i) => {
      const link2 = li.querySelector("a");
      const name = li.textContent.trim().replace(/,$/, "");
      const photo = photos[i] ? image(document, photos[i].getAttribute("src"), name) : null;
      let authorLink = null;
      if (link2) {
        authorLink = document.createElement("a");
        authorLink.href = absolute(link2.getAttribute("href"));
        authorLink.textContent = authorLink.href;
      }
      cells.push([
        hinted(document, "image", photo),
        hinted(document, "name", name),
        hinted(document, "link", authorLink)
      ]);
    });
    if (heroImg) (_c = heroImg.closest('[class*="post_image"]')) == null ? void 0 : _c.remove();
    const block = WebImporter.Blocks.createBlock(document, { name: "article-header", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/blog-media-tables.js
  var MAX_TABLE_COLUMNS = 4;
  var VIDEO_CONTAINERS = '[class*="BlogVideo_videoContainer"], [data-testid="wpl-inline-video"]';
  function absolute2(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function link(document, href) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = href;
    return a;
  }
  function videoSource(container) {
    var _a, _b;
    const iframe = container.querySelector("iframe[src], iframe[data-src]");
    const frameSrc = iframe && (iframe.getAttribute("src") || iframe.getAttribute("data-src"));
    if (frameSrc) {
      const youtube = frameSrc.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
      if (youtube) return { block: "Embed", href: `https://www.youtube.com/watch?v=${youtube[1]}` };
      const vimeo = frameSrc.match(/player\.vimeo\.com\/video\/(\d+)/);
      if (vimeo) return { block: "Embed", href: `https://vimeo.com/${vimeo[1]}` };
      if (/youtu\.be|vimeo\.com|youtube\.com/.test(frameSrc)) return { block: "Embed", href: absolute2(frameSrc) };
    }
    const wistiaClass = (_a = container.querySelector('[class*="wistia_async_"]')) == null ? void 0 : _a.className.match(/wistia_async_(\w+)/);
    const wistiaSource = container.innerHTML.match(/fast\.wistia\.(?:com|net)\/embed\/medias\/(\w+)/);
    const wistia = (_b = wistiaClass || wistiaSource) == null ? void 0 : _b[1];
    if (wistia) return { block: "Embed", href: `https://fast.wistia.net/embed/iframe/${wistia}` };
    const video = [...container.querySelectorAll("video[src], video source[src]")].map((n) => n.getAttribute("src")).find((src) => src && !src.startsWith("blob:") && /\.mp4(\?|$)/i.test(src));
    if (video) return { block: "Video", href: absolute2(video) };
    return null;
  }
  function replaceVideos(main, document) {
    const containers = [...main.querySelectorAll(VIDEO_CONTAINERS)].filter((c) => {
      var _a;
      return !((_a = c.parentElement) == null ? void 0 : _a.closest(VIDEO_CONTAINERS));
    });
    containers.forEach((container) => {
      const source = videoSource(container);
      if (!source) {
        console.warn(`[blog-media-tables] video container without a known source left out: ${container.className}`);
        container.remove();
        return;
      }
      container.replaceWith(WebImporter.Blocks.createBlock(document, {
        name: source.block,
        cells: [[link(document, source.href)]]
      }));
    });
  }
  function wideTableAsList(table, rows, document) {
    var _a;
    const hasHeader = [...((_a = table.querySelector("tr")) == null ? void 0 : _a.children) || []].every((c) => c.tagName === "TH");
    const headers = hasHeader ? rows[0].map((cell) => cell.textContent.trim()) : [];
    const list = document.createElement("ul");
    (hasHeader ? rows.slice(1) : rows).forEach((row) => {
      const item = document.createElement("li");
      row.forEach((cell, i) => {
        const p = document.createElement("p");
        if (headers[i]) {
          const label = document.createElement("strong");
          label.textContent = `${headers[i]}: `;
          p.append(label);
        }
        p.append(...cell.childNodes);
        item.append(p);
      });
      list.append(item);
    });
    return list;
  }
  function replaceTables(main, document) {
    main.querySelectorAll('[class*="post_content"] table').forEach((table) => {
      var _a;
      const rows = [...table.querySelectorAll("tr")].map((tr) => [...tr.children].filter((cell) => cell.tagName === "TH" || cell.tagName === "TD").map((cell) => {
        const div = document.createElement("div");
        div.append(...cell.childNodes);
        return div;
      }));
      const columns = Math.max(0, ...rows.map((r) => r.length));
      if (!rows.length || !columns) return;
      if (columns > MAX_TABLE_COLUMNS) {
        console.warn(`[blog-media-tables] ${columns}-column table written as a list: the Table block goes up to ${MAX_TABLE_COLUMNS}`);
        (_a = table.closest('[class*="tableBlock"]')) == null ? void 0 : _a.replaceWith(table);
        table.replaceWith(wideTableAsList(table, rows, document));
        return;
      }
      rows.forEach((row) => {
        while (row.length < columns) row.push("");
      });
      if (columns > 1) rows.forEach((row) => row.unshift(`table-col-${columns}`));
      const container = table.closest('[class*="tableBlock"]') || table;
      container.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Table", cells: rows }));
    });
  }
  function replaceQuotes(main, document) {
    main.querySelectorAll('[class*="post_content"] blockquote').forEach((quote) => {
      const quotation = document.createElement("div");
      quotation.append(...quote.childNodes);
      quote.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Quote", cells: [[quotation]] }));
    });
  }
  function transform(hookName, element, payload) {
    var _a;
    if (((_a = payload.template) == null ? void 0 : _a.name) !== "blog-article") return;
    if (hookName !== "beforeTransform") return;
    const { document } = payload;
    replaceTables(element, document);
    replaceVideos(element, document);
    replaceQuotes(element, document);
  }

  // tools/importer/transformers/hashicorp-cleanup.js
  function absolute3(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function assetUrl2(src) {
    let url = absolute3(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute3(inner);
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=1600` : url;
  }
  function transform2(hookName, element, payload) {
    var _a;
    if (((_a = payload.template) == null ? void 0 : _a.name) !== "blog-article") return;
    const { document } = payload;
    if (hookName === "beforeTransform") {
      const post = element.querySelector('[class*="post_root"]');
      if (post) element.replaceChildren(post);
      element.querySelectorAll("script, style, noscript, iframe, link, button").forEach((n) => n.remove());
      element.querySelectorAll('[class*="post_rightColumn"]').forEach((n) => n.remove());
      element.querySelectorAll('[class*="post_content"] :is(h2, h3, h4, h5, h6) a[href^="#"]').forEach((a) => {
        if (a.textContent.trim().length <= 2) a.remove();
      });
      element.querySelectorAll('[class*="post_content"] img').forEach((img) => {
        var _a2;
        img.setAttribute("src", assetUrl2(img.getAttribute("src")));
        img.removeAttribute("srcset");
        if (!img.getAttribute("alt")) {
          const caption = (_a2 = img.closest('[class*="blogImage"]')) == null ? void 0 : _a2.querySelector("p, figcaption");
          if (caption) img.setAttribute("alt", caption.textContent.trim());
        }
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll('[class*="post_leftColumn"], [class*="post_image"]').forEach((n) => n.remove());
      element.querySelectorAll('[class*="clearfix"]').forEach((n) => {
        if (!n.textContent.trim() && !n.querySelector("img")) n.remove();
      });
    }
  }

  // tools/importer/transformers/hashicorp-metadata.js
  var PAGE_TEMPLATES = { "blog-article": "blog-article", "blog-listing": "blog-listing" };
  function transform3(hookName, element, payload) {
    var _a;
    if (hookName !== "afterTransform") return;
    const { document } = payload;
    const meta = (name) => {
      var _a2, _b;
      return ((_b = (_a2 = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)) == null ? void 0 : _a2.content) == null ? void 0 : _b.trim()) || "";
    };
    const cells = {};
    const title = meta("og:title") || document.title;
    if (title) cells.Title = title;
    const description = meta("description").replace(/\s*\n\s*/g, " ");
    if (description) cells.Description = description;
    const pageTemplate = PAGE_TEMPLATES[(_a = payload.template) == null ? void 0 : _a.name];
    if (pageTemplate) cells.template = pageTemplate;
    const og = meta("og:image");
    if (og) {
      const img = document.createElement("img");
      img.src = og.replace(/([?&])auto=format(&|$)/, "$1fm=png$2");
      img.alt = "";
      cells.image = img;
    }
    element.append(WebImporter.Blocks.createBlock(document, { name: "Metadata", cells }));
  }

  // tools/importer/transformers/hashicorp-sections.js
  var MARKER = "data-import-section";
  function transform4(hookName, element, payload) {
    const { document, template } = payload;
    const sections = (template == null ? void 0 : template.sections) || [];
    if (hookName === "beforeTransform") {
      const targets = sections.map((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        return selectors.map((s) => element.querySelector(s)).find(Boolean) || null;
      });
      targets.forEach((target, i) => {
        if (!target) return;
        const marker = document.createElement("div");
        marker.setAttribute(MARKER, sections[i].id);
        marker.hidden = true;
        target.before(marker);
        if (i > 0) marker.before(document.createElement("hr"));
      });
    }
    if (hookName === "afterTransform") {
      const markers = [...element.querySelectorAll(`[${MARKER}]`)];
      markers.forEach((marker, i) => {
        var _a;
        const section = sections.find((s) => s.id === marker.getAttribute(MARKER));
        if (section == null ? void 0 : section.style) {
          const metadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          const next = markers[i + 1];
          const boundary = ((_a = next == null ? void 0 : next.previousElementSibling) == null ? void 0 : _a.tagName) === "HR" ? next.previousElementSibling : next;
          if (boundary) boundary.before(metadata);
          else marker.parentElement.append(metadata);
        }
      });
      markers.forEach((marker) => marker.remove());
    }
  }

  // tools/importer/import-blog-article.js
  var PAGE_TEMPLATE = {
    name: "blog-article",
    urls: [
      "https://www.hashicorp.com/en/blog/a-new-look-for-vagrant"
    ],
    description: "HashiCorp blog article: breadcrumbs, title, intro, authors, tags and hero image in an Article Header block, followed by the article body as default content",
    blocks: [
      {
        name: "article-header",
        instances: [
          "[class*='post_header']"
        ]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Article Header",
        selector: [
          "[class*='post_header']"
        ],
        style: null,
        blocks: [
          "article-header"
        ],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Article Body",
        selector: [
          "[class*='post_content']"
        ],
        style: null,
        blocks: [],
        defaultContent: [
          "p",
          "h2",
          "h3",
          "ul",
          "ol",
          "img",
          "blockquote",
          "pre"
        ]
      }
    ]
  };
  var parsers = { "article-header": parse };
  var transformers = [transform, transform2, transform4, transform3];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var DAM_ROOT = "/content/dam/hashicorp-xwalk-poc";
  function mapAssets(main, pagePath) {
    const assets = {};
    const bySource = {};
    main.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!/^https?:\/\//.test(src)) return;
      if (bySource[src]) {
        img.setAttribute("src", bySource[src]);
        return;
      }
      const url = new URL(src);
      const file = decodeURIComponent(url.pathname.split("/").pop() || "image");
      const pathExt = (file.match(/\.([a-z0-9]+)$/i) || [])[1] || "png";
      const ext = (url.searchParams.get("fm") || pathExt).toLowerCase().replace("jpeg", "jpg");
      const base = file.replace(/\.[a-z0-9]+$/i, "").replace(/^\d+-/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
      let damPath = `${DAM_ROOT}${pagePath}/${base}.${ext}`;
      for (let i = 2; assets[damPath]; i += 1) damPath = `${DAM_ROOT}${pagePath}/${base}-${i}.${ext}`;
      assets[damPath] = src;
      bySource[src] = damPath;
      img.setAttribute("src", damPath);
    });
    return assets;
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_blog_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "").replace(/^\/en(?=\/)/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      const assets = mapAssets(main, path);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          assets
        }
      }];
    }
  };
  return __toCommonJS(import_blog_article_exports);
})();
