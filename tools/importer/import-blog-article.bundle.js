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
      const link = document.createElement("a");
      link.href = absolute(a.getAttribute("href"));
      link.textContent = a.textContent.trim().replace(/,$/, "");
      p.append(link);
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
      const link = li.querySelector("a");
      const name = li.textContent.trim().replace(/,$/, "");
      const photo = photos[i] ? image(document, photos[i].getAttribute("src"), name) : null;
      let authorLink = null;
      if (link) {
        authorLink = document.createElement("a");
        authorLink.href = absolute(link.getAttribute("href"));
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

  // tools/importer/transformers/hashicorp-cleanup.js
  function absolute2(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function assetUrl2(src) {
    let url = absolute2(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute2(inner);
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=1600` : url;
  }
  function transform(hookName, element, payload) {
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
  function transform2(hookName, element, payload) {
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
  function transform3(hookName, element, payload) {
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
  var transformers = [transform, transform3, transform2];
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
