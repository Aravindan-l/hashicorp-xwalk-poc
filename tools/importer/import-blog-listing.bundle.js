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

  // tools/importer/import-blog-listing.js
  var import_blog_listing_exports = {};
  __export(import_blog_listing_exports, {
    default: () => import_blog_listing_default
  });

  // tools/importer/parsers/blog-list.js
  var MIGRATED_ARTICLES = [
    { path: "/blog/a-new-look-for-vagrant", title: "A New Look for Vagrant" }
  ];
  function clean(text) {
    return (text || "").replace(/[​-‏⁠﻿]/g, "").replace(/\s+/g, " ").trim();
  }
  function parse(element, { document }) {
    const heading = [...element.querySelectorAll("h2")].map((h) => clean(h.textContent)).find((t) => /latest posts/i.test(t)) || "Latest posts";
    const cells = MIGRATED_ARTICLES.map(({ path, title }) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:link "));
      const a = document.createElement("a");
      a.href = path;
      a.textContent = title;
      frag.appendChild(a);
      return [frag];
    });
    const h2 = document.createElement("h2");
    h2.textContent = heading;
    const block = WebImporter.Blocks.createBlock(document, { name: "blog-list", cells });
    element.before(h2);
    element.replaceWith(block);
  }

  // tools/importer/transformers/blog-listing-cleanup.js
  function transform(hookName, element, payload) {
    var _a;
    if (((_a = payload.template) == null ? void 0 : _a.name) !== "blog-listing" || hookName !== "beforeTransform") return;
    element.querySelectorAll('header, footer, script, style, noscript, iframe, link, aside, [role="dialog"]').forEach((n) => n.remove());
    element.querySelectorAll('a[href="#main"]').forEach((n) => n.remove());
    [...element.children].forEach((child) => {
      if (!child.matches("main") && !child.querySelector("main")) child.remove();
    });
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

  // tools/importer/import-blog-listing.js
  var PAGE_TEMPLATE = {
    "name": "blog-listing",
    "urls": [
      "https://www.hashicorp.com/en/blog"
    ],
    "description": 'HashiCorp blog home: a "Latest posts" heading and a hand-picked Blog List of the migrated articles',
    "blocks": [
      {
        "name": "blog-list",
        "instances": [
          "main"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Latest posts",
        "selector": [
          "main"
        ],
        "style": null,
        "blocks": [
          "blog-list"
        ],
        "defaultContent": [
          "h2"
        ]
      }
    ]
  };
  var parsers = { "blog-list": parse };
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
  var import_blog_listing_default = {
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
      const path = "/blog";
      const assets = mapAssets(main, "/blog/home");
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
  return __toCommonJS(import_blog_listing_exports);
})();
