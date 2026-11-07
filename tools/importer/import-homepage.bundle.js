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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero.js
  function clean(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function absolute(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function sourceOf(img) {
    const src = img.getAttribute("src") || "";
    if (!/^(blob:|data:)|\/media-da\//.test(src)) return src;
    return (img.getAttribute("srcset") || "").trim().split(/\s+/)[0] || src;
  }
  function assetUrl(src) {
    let url = absolute(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute(decodeURIComponent(inner));
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=1600` : url;
  }
  function linkParagraph(document, a, wrapper) {
    const out = document.createElement("a");
    out.href = absolute(a.getAttribute("href"));
    out.textContent = clean(a.textContent);
    const p = document.createElement("p");
    if (wrapper) {
      const w = document.createElement(wrapper);
      w.append(out);
      p.append(w);
    } else {
      p.append(out);
    }
    return p;
  }
  function hinted(document, field, nodes) {
    const list = nodes.filter(Boolean);
    if (!list.length) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    list.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse(element, { document }) {
    const text = [];
    const callout2 = element.querySelector('[class*="smallCallout"]');
    if (callout2) {
      const p = document.createElement("p");
      const badge = callout2.querySelector('[class*="badge"]');
      if (badge) {
        const strong = document.createElement("strong");
        strong.textContent = clean(badge.textContent);
        p.append(strong, " ");
      }
      const span = [...callout2.children].find((c) => c.tagName === "SPAN");
      if (span) p.append(clean(span.textContent));
      text.push(p);
      const a = callout2.querySelector("a");
      if (a) text.push(linkParagraph(document, a));
    }
    const h1 = element.querySelector("h1");
    if (h1) {
      const h = document.createElement("h1");
      h.textContent = clean(h1.textContent);
      text.push(h);
    }
    const desc = element.querySelector('[class*="description"]');
    if (desc) {
      const p = document.createElement("p");
      p.textContent = clean(desc.textContent);
      text.push(p);
    }
    element.querySelectorAll('[class*="ctas"] a').forEach((a) => text.push(linkParagraph(document, a, "strong")));
    const bg = element.querySelector('img[class*="hero_image"]') || [...element.querySelectorAll("img")].find((img) => !sourceOf(img).startsWith("data:"));
    let image = null;
    if (bg) {
      image = document.createElement("img");
      image.src = assetUrl(sourceOf(bg));
      image.alt = "";
    }
    const cells = [
      [hinted(document, "image", [image])],
      [hinted(document, "text", text)]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/logo-wall.js
  function clean2(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function absolute2(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function sourceOf2(img) {
    const src = img.getAttribute("src") || "";
    if (!/^(blob:|data:)|\/media-da\//.test(src)) return src;
    return (img.getAttribute("srcset") || "").trim().split(/\s+/)[0] || src;
  }
  function assetUrl2(src) {
    let url = absolute2(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute2(decodeURIComponent(inner));
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=320` : url;
  }
  function altFromFile(src) {
    const file = decodeURIComponent((src || "").split("?")[0].split("/").pop() || "");
    const name = file.replace(/\.[a-z0-9]+$/i, "").replace(/^\d+-/, "").replace(/[-_]+/g, " ").replace(/\b(color|white|black|\d+)\b/gi, "").replace(/\s+/g, " ").trim();
    return /logo/i.test(name) ? name : `${name} logo`;
  }
  function hinted2(document, field, node) {
    if (!node) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    frag.appendChild(node);
    return frag;
  }
  function el(document, tag, text) {
    const node = document.createElement(tag);
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function introNodes(document, wrapper) {
    const nodes = [];
    const eyebrow = wrapper.querySelector('[class*="eyebrow"]');
    if (eyebrow) nodes.push(el(document, "p", clean2(eyebrow.textContent)));
    const h = wrapper.querySelector("h2, h3");
    if (h) nodes.push(el(document, "h2", clean2(h.textContent)));
    const desc = wrapper.querySelector('[class*="description"]');
    if (desc) nodes.push(el(document, "p", clean2(desc.textContent)));
    wrapper.querySelectorAll('[class*="ctas"] a').forEach((a) => {
      const link = el(document, "a", clean2(a.textContent));
      link.href = absolute2(a.getAttribute("href"));
      const em = el(document, "em");
      em.append(link);
      const p = el(document, "p");
      p.append(em);
      nodes.push(p);
    });
    const stats = [...wrapper.querySelectorAll('[class*="stat"] li, li[class*="stat"]')];
    if (stats.length) {
      const ul = el(document, "ul");
      stats.forEach((li) => {
        const [num, label] = [...li.querySelectorAll("p")].map((p) => clean2(p.textContent));
        const item = el(document, "li");
        item.append(el(document, "strong", num), ` ${label || ""}`);
        ul.append(item);
      });
      nodes.push(ul);
    }
    return nodes;
  }
  function parse2(element, { document }) {
    const cells = [];
    const eyebrow = element.querySelector('[class*="eyebrow"]');
    const textWrapper = element.querySelector('[class*="textWrapper"]');
    if (textWrapper) {
      introNodes(document, textWrapper).forEach((n) => element.before(n));
      textWrapper.remove();
    }
    cells.push([eyebrow && !textWrapper ? hinted2(document, "title", document.createTextNode(clean2(eyebrow.textContent))) : ""]);
    const seen = /* @__PURE__ */ new Set();
    [...element.querySelectorAll("img")].forEach((img) => {
      const src = sourceOf2(img);
      if (!src || src.startsWith("data:") || img.closest('[class*="mobileImage"]')) return;
      const url = assetUrl2(src);
      if (seen.has(url)) return;
      seen.add(url);
      const logo = document.createElement("img");
      logo.src = url;
      logo.alt = clean2(img.getAttribute("alt")) || altFromFile(src);
      cells.push([hinted2(document, "image", logo), ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "logo-wall", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var PRODUCT_ICONS = {
    "hashicorp cloud platform": "hcp",
    terraform: "terraform",
    packer: "packer",
    vault: "vault",
    consul: "consul",
    nomad: "nomad",
    waypoint: "waypoint",
    boundary: "boundary"
  };
  function clean3(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function absolute3(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function sourceOf3(img) {
    const src = img.getAttribute("src") || "";
    if (!/^(blob:|data:)|\/media-da\//.test(src)) return src;
    return (img.getAttribute("srcset") || "").trim().split(/\s+/)[0] || src;
  }
  function assetUrl3(src) {
    let url = absolute3(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute3(decodeURIComponent(inner));
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=1200` : url;
  }
  function ctaParagraphs(document, scope) {
    const seen = /* @__PURE__ */ new Set();
    return [...scope.querySelectorAll('a[class*="button__"], a[class*="standalone-link"]')].filter((a) => !/style_(mobile|tablet)/.test(a.className)).filter((a) => {
      const key = `${clean3(a.textContent)}|${a.getAttribute("href")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((a) => {
      const link = document.createElement("a");
      link.href = absolute3(a.getAttribute("href"));
      link.textContent = clean3(a.textContent);
      let wrapper = null;
      if (/standalone-link/.test(a.className)) wrapper = "em";
      else if (!/color-primary/.test(a.className)) wrapper = "strong";
      const p = document.createElement("p");
      if (wrapper) {
        const w = document.createElement(wrapper);
        w.append(link);
        p.append(w);
      } else {
        p.append(link);
      }
      return p;
    });
  }
  function bodyParagraphs(document, scope) {
    const body = [...scope.querySelectorAll('[class*="style_body"] p')];
    const sources = body.length ? body : [...scope.querySelectorAll('[class*="style_body"], [class*="description"]')];
    return sources.map((src) => {
      const p = document.createElement("p");
      src.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          p.append(n.textContent);
        } else if (n.tagName === "A") {
          const a = document.createElement("a");
          a.href = absolute3(n.getAttribute("href"));
          a.textContent = clean3(n.textContent);
          p.append(a);
        } else if (n.tagName === "STRONG" || n.tagName === "B") {
          const s = document.createElement("strong");
          s.textContent = clean3(n.textContent);
          p.append(s);
        } else {
          p.append(n.textContent);
        }
      });
      return p;
    }).filter((p) => clean3(p.textContent));
  }
  function textCell(document, content) {
    const nodes = [];
    const eyebrow = content.querySelector('[class*="eyebrowWrapper"]') || [...content.querySelectorAll('[class*="eyebrow"]')].find((e) => !/eyebrow-headline/.test(e.className)) || content.querySelector('[class*="eyebrow-headline"] > span:first-child');
    if (eyebrow && clean3(eyebrow.textContent)) {
      const p = document.createElement("p");
      const label = clean3(eyebrow.textContent);
      const icon = eyebrow.querySelector("img") && PRODUCT_ICONS[label.toLowerCase()];
      p.textContent = icon ? `:${icon}: ${label}` : label;
      nodes.push(p);
    }
    const h = content.querySelector("h2, h3");
    if (h) {
      const heading = document.createElement(h.tagName.toLowerCase());
      heading.textContent = clean3(h.textContent);
      nodes.push(heading);
    }
    nodes.push(...bodyParagraphs(document, content), ...ctaParagraphs(document, content));
    return nodes;
  }
  function parse3(element, { document }) {
    const root = element.querySelector(':scope > [class*="style_root"]') || element;
    const content = root.querySelector(':scope > [class*="style_content"]') || root;
    const imageWrap = root.querySelector(':scope > [class*="style_image"]');
    const img = imageWrap && [...imageWrap.querySelectorAll("img")].find((i) => !(i.getAttribute("src") || "").startsWith("data:"));
    const text = textCell(document, content);
    let image = "";
    if (img) {
      image = document.createElement("img");
      image.src = assetUrl3(sourceOf3(img));
      image.alt = clean3(img.getAttribute("alt"));
    }
    const reversed = /style_reverse/.test(root.className);
    const row = reversed ? [image, text] : [text, image];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs.js
  function clean4(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function absolute4(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function sourceOf4(img) {
    const src = img.getAttribute("src") || "";
    if (!/^(blob:|data:)|\/media-da\//.test(src)) return src;
    return (img.getAttribute("srcset") || "").trim().split(/\s+/)[0] || src;
  }
  function assetUrl4(src) {
    let url = absolute4(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute4(decodeURIComponent(inner));
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=1200` : url;
  }
  function parse4(element, { document }) {
    const cells = [];
    element.querySelectorAll("[data-import-tabpanel]").forEach((panel) => {
      const label = document.createDocumentFragment();
      label.appendChild(document.createComment(" field:title "));
      label.appendChild(document.createTextNode(clean4(panel.getAttribute("data-import-tabpanel"))));
      const content = document.createDocumentFragment();
      const h = panel.querySelector("h2, h3, h4");
      if (h) {
        content.appendChild(document.createComment(" field:content_heading "));
        const heading = document.createElement("h3");
        heading.textContent = clean4(h.textContent);
        content.appendChild(heading);
      }
      const img = panel.querySelector("img");
      if (img) {
        content.appendChild(document.createComment(" field:content_image "));
        const image = document.createElement("img");
        image.src = assetUrl4(sourceOf4(img));
        image.alt = clean4(img.getAttribute("alt"));
        content.appendChild(image);
      }
      const text = [...panel.querySelectorAll("p")].map((p) => {
        const out = document.createElement("p");
        out.textContent = clean4(p.textContent);
        return out;
      });
      panel.querySelectorAll("a").forEach((a) => {
        const link = document.createElement("a");
        link.href = absolute4(a.getAttribute("href"));
        link.textContent = clean4(a.textContent);
        const strong = document.createElement("strong");
        strong.append(link);
        const p = document.createElement("p");
        p.append(strong);
        text.push(p);
      });
      if (text.length) {
        content.appendChild(document.createComment(" field:content_richtext "));
        text.forEach((n) => content.appendChild(n));
      }
      cells.push([label, content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  var PRODUCT_ICONS2 = {
    terraform: "terraform",
    packer: "packer",
    vault: "vault",
    consul: "consul",
    nomad: "nomad",
    waypoint: "waypoint",
    boundary: "boundary"
  };
  function clean5(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function absolute5(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function sourceOf5(img) {
    const src = img.getAttribute("src") || "";
    if (!/^(blob:|data:)|\/media-da\//.test(src)) return src;
    return (img.getAttribute("srcset") || "").trim().split(/\s+/)[0] || src;
  }
  function assetUrl5(src) {
    let url = absolute5(src || "");
    if (url.includes("/_next/image")) {
      const inner = new URL(url).searchParams.get("url");
      if (inner) url = absolute5(decodeURIComponent(inner));
    }
    const base = url.split("?")[0];
    return /\.svg$/i.test(base) ? `${base}?fm=png&w=1200` : url;
  }
  function el2(document, tag, text) {
    const node = document.createElement(tag);
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function anchor(document, href, text) {
    const a = el2(document, "a", text);
    a.href = absolute5(href);
    return a;
  }
  function hinted3(document, field, nodes) {
    const list = nodes.filter(Boolean);
    if (!list.length) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    list.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function productGroups(document, element) {
    const rows = [];
    let card = null;
    [...element.querySelectorAll('[class*="style_categories"] > *')].forEach((part) => {
      if (/headingBox/.test(part.className)) {
        const [name, sub] = [...part.querySelectorAll("p")].map((p) => clean5(p.textContent));
        const h3 = el2(document, "h3");
        h3.append(anchor(document, part.getAttribute("href"), name));
        card = [h3];
        if (sub) card.push(el2(document, "p", sub));
        rows.push(card);
        return;
      }
      if (!card) return;
      const desc = part.querySelector('[class*="headingDescription"]');
      if (desc) card.push(el2(document, "p", clean5(desc.textContent)));
      const more = part.querySelector('a[class*="standalone-link"]');
      if (more) {
        const em = el2(document, "em");
        em.append(anchor(document, more.getAttribute("href"), clean5(more.textContent)));
        const p = el2(document, "p");
        p.append(em);
        card.push(p);
      }
      const products = [...part.querySelectorAll("li")];
      if (products.length) {
        const ul = el2(document, "ul");
        products.forEach((li) => {
          var _a, _b;
          const a = li.querySelector("a");
          const name = clean5((_a = li.querySelector('[class*="product-logo"]')) == null ? void 0 : _a.textContent);
          const productDesc = clean5((_b = li.querySelector('[class*="productDescription"]')) == null ? void 0 : _b.textContent);
          const item = el2(document, "li");
          const icon = PRODUCT_ICONS2[name.toLowerCase()];
          if (icon) item.append(`:${icon}: `);
          item.append(anchor(document, a.getAttribute("href"), name));
          if (productDesc) item.append(` ${productDesc}`);
          ul.append(item);
        });
        card.push(ul);
      }
    });
    return rows.map((nodes) => ["", hinted3(document, "text", nodes)]);
  }
  function resourceCards(document, panel) {
    return [...panel.querySelectorAll("li")].map((li) => {
      const a = li.querySelector("a");
      const [title, desc] = [...li.querySelectorAll("p")].map((p) => clean5(p.textContent));
      const img = li.querySelector("img");
      let image = null;
      if (img) {
        image = el2(document, "img");
        image.src = assetUrl5(sourceOf5(img));
        image.alt = clean5(img.getAttribute("alt"));
      }
      const h3 = el2(document, "h3");
      h3.append(anchor(document, a.getAttribute("href"), title));
      const text = [h3, desc ? el2(document, "p", desc) : null];
      return [hinted3(document, "image", [image]), hinted3(document, "text", text)];
    });
  }
  function parse5(element, { document }) {
    const label = element.getAttribute("data-import-tabpanel");
    const cells = label ? resourceCards(document, element) : productGroups(document, element);
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    if (label) element.before(el2(document, "h3", clean5(label)));
    element.replaceWith(block);
  }

  // tools/importer/transformers/homepage-cleanup.js
  var TAG = "data-homepage-section";
  var DEFAULT_CONTENT_SECTIONS = {
    callout: "main > div:has([class*='base_callout'])",
    intro: "main > div:has([class*='style_modularEyebrow'])",
    centered: "main > div:has([class*='style_heading'][class*='style_center'])",
    resources: "main > div:has([data-import-tabpanel] > ul)",
    cta: "main > div[class*='faint']"
  };
  function clean6(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function absolute6(href) {
    try {
      return new URL(href, "https://www.hashicorp.com").href;
    } catch (e) {
      return href;
    }
  }
  function el3(document, tag, text) {
    const node = document.createElement(tag);
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function linkParagraph2(document, a) {
    const link = el3(document, "a", clean6(a.textContent));
    link.href = absolute6(a.getAttribute("href"));
    let wrapper = null;
    if (/standalone-link/.test(a.className)) wrapper = "em";
    else if (!/color-primary/.test(a.className)) wrapper = "strong";
    const p = el3(document, "p");
    if (wrapper) {
      const w = el3(document, wrapper);
      w.append(link);
      p.append(w);
    } else {
      p.append(link);
    }
    return p;
  }
  function ctas(document, scope) {
    const seen = /* @__PURE__ */ new Set();
    return [...scope.querySelectorAll('a[class*="button__"], a[class*="standalone-link"]')].filter((a) => !/style_(mobile|tablet)/.test(a.className) && !a.closest('[class*="mobileCtas"]')).filter((a) => {
      const key = `${clean6(a.textContent)}|${a.getAttribute("href")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((a) => linkParagraph2(document, a));
  }
  function introNodes2(document, scope) {
    const nodes = [];
    const eyebrow = scope.querySelector('[class*="eyebrowWrapper"], [class*="modularEyebrow"]') || scope.querySelector('[class*="eyebrow-headline"] > span:first-child');
    if (eyebrow && clean6(eyebrow.textContent)) nodes.push(el3(document, "p", clean6(eyebrow.textContent)));
    const h = scope.querySelector("h2");
    if (h) nodes.push(el3(document, "h2", clean6(h.textContent)));
    const body = [...scope.querySelectorAll('[class*="style_body"] p')];
    const paras = body.length ? body : [...scope.querySelectorAll('[class*="style_body"], [class*="styles_root"]:not(h2)')].filter((n) => !n.querySelector('h2, [class*="style_body"]') && clean6(n.textContent) && !n.closest("h2"));
    paras.forEach((p) => nodes.push(el3(document, "p", clean6(p.textContent))));
    return nodes;
  }
  function callout(document, section) {
    const nodes = [];
    const title = section.querySelector('[class*="titleText"]');
    if (title) {
      const p = el3(document, "p");
      p.append(el3(document, "strong", clean6(title.textContent)));
      nodes.push(p);
    }
    const desc = section.querySelector('[class*="description"]');
    if (desc) nodes.push(el3(document, "p", clean6(desc.textContent)));
    return [...nodes, ...ctas(document, section)];
  }
  function transform(hookName, element, payload) {
    var _a;
    if (((_a = payload.template) == null ? void 0 : _a.name) !== "homepage") return;
    const { document } = payload;
    if (hookName === "beforeTransform") {
      element.querySelectorAll('header, footer, script, style, noscript, iframe, link, aside, [role="dialog"]').forEach((n) => n.remove());
      element.querySelectorAll('a[href="#main"]').forEach((n) => n.remove());
      const main = element.querySelector("main");
      if (main) {
        [...main.children].forEach((child) => {
          if (!clean6(child.textContent) && !child.querySelector("img")) child.remove();
        });
      }
      Object.entries(DEFAULT_CONTENT_SECTIONS).forEach(([name, selector]) => {
        var _a2;
        (_a2 = element.querySelector(selector)) == null ? void 0 : _a2.setAttribute(TAG, name);
      });
      const resources = element.querySelector(`[${TAG}="resources"]`);
      resources == null ? void 0 : resources.querySelectorAll('[role="tablist"], [role="tabpanel"]').forEach((n) => n.remove());
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(`[${TAG}]`).forEach((section) => {
        const name = section.getAttribute(TAG);
        let nodes;
        if (name === "callout") {
          nodes = callout(document, section);
        } else if (name === "resources") {
          const panels = [...section.querySelectorAll("[data-import-tabpanels] > *")];
          nodes = [...introNodes2(document, section), ...panels];
        } else {
          nodes = [...introNodes2(document, section), ...ctas(document, section)];
        }
        section.replaceChildren(...nodes);
        section.removeAttribute(TAG);
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

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    "name": "homepage",
    "urls": [
      "https://www.hashicorp.com/en"
    ],
    "description": "HashiCorp homepage: hero, logo marquee, callout, split text/image sections, solution tabs, product groups, partners, certifications, resource tabs and a call-to-action band",
    "blocks": [
      {
        "name": "hero",
        "instances": [
          "main > div:has(> [class*='centered-text-hero_inner'])"
        ]
      },
      {
        "name": "logo-wall",
        "instances": [
          "main > div:has([class*='style_marquee'])",
          "main > div:has([class*='style_tile']) > [class*='style_root']"
        ]
      },
      {
        "name": "columns",
        "instances": [
          "main > div:has(> [class*='style_root'] > [class*='style_image'])"
        ]
      },
      {
        "name": "tabs",
        "instances": [
          "main > div:has([data-import-tabpanel] > h3)"
        ]
      },
      {
        "name": "cards",
        "instances": [
          "main > div:has([class*='style_categories'])",
          "main > div:has([data-import-tabpanel] > ul) [data-import-tabpanel]"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Hero",
        "selector": [
          "main > div:has(> [class*='centered-text-hero_inner'])"
        ],
        "style": null,
        "blocks": [
          "hero"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Customer logos",
        "selector": [
          "main > div:has([class*='style_marquee'])"
        ],
        "style": null,
        "blocks": [
          "logo-wall"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Callout",
        "selector": [
          "main > div:has([class*='base_callout'])"
        ],
        "style": "callout",
        "blocks": [],
        "defaultContent": [
          "p"
        ]
      },
      {
        "id": "section-4",
        "name": "Infrastructure Cloud",
        "selector": [
          "main > div:has(> [class*='style_center']:not([class*='style_reverse']):not([class*='style_isImageLarge']) > [class*='style_image'])"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-5",
        "name": "HashiCorp Cloud Platform",
        "selector": [
          "main > div:has(> [class*='style_reverse'] > [class*='style_image'])"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Infragraph",
        "selector": [
          "main > div:has(> [class*='style_isImageLarge'])"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-7",
        "name": "Solutions intro",
        "selector": [
          "main > div:has([class*='style_modularEyebrow'])"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "p",
          "h2"
        ]
      },
      {
        "id": "section-8",
        "name": "Solutions",
        "selector": [
          "main > div:has([data-import-tabpanel] > h3)"
        ],
        "style": null,
        "blocks": [
          "tabs"
        ],
        "defaultContent": []
      },
      {
        "id": "section-9",
        "name": "Lifecycle management intro",
        "selector": [
          "main > div:has([class*='style_heading'][class*='style_center'])"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "h2",
          "p"
        ]
      },
      {
        "id": "section-10",
        "name": "Product groups",
        "selector": [
          "main > div:has([class*='style_categories'])"
        ],
        "style": "products",
        "blocks": [
          "cards"
        ],
        "defaultContent": []
      },
      {
        "id": "section-11",
        "name": "Partners",
        "selector": [
          "main > div:has([class*='style_tile'])"
        ],
        "style": "centered, logo-grid",
        "blocks": [
          "logo-wall"
        ],
        "defaultContent": [
          "p",
          "h2",
          "ul"
        ]
      },
      {
        "id": "section-12",
        "name": "Certifications",
        "selector": [
          "main > div:has(> [class*='style_start'] > [class*='style_image'])"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-13",
        "name": "Resources and events",
        "selector": [
          "main > div:has([data-import-tabpanel] > ul)"
        ],
        "style": "tabs, featured-cards",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          "p",
          "h2",
          "h3"
        ]
      },
      {
        "id": "section-14",
        "name": "Call to action",
        "selector": [
          "main > div[class*='faint']"
        ],
        "style": "cta-band",
        "blocks": [],
        "defaultContent": [
          "h2",
          "p"
        ]
      }
    ]
  };
  var parsers = {
    hero: parse,
    "logo-wall": parse2,
    columns: parse3,
    tabs: parse4,
    cards: parse5
  };
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
  var import_homepage_default = {
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
      const path = "/index";
      const assets = mapAssets(main, "/home");
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
  return __toCommonJS(import_homepage_exports);
})();
