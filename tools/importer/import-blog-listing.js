/* eslint-disable */
/* global WebImporter */

import blogListParser from './parsers/blog-list.js';
import cleanupTransformer from './transformers/blog-listing-cleanup.js';
import metadataTransformer from './transformers/hashicorp-metadata.js';
import sectionsTransformer from './transformers/hashicorp-sections.js';

const PAGE_TEMPLATE = {
  "name": "blog-listing",
  "urls": [
    "https://www.hashicorp.com/en/blog"
  ],
  "description": "HashiCorp blog home: a \"Latest posts\" heading and a hand-picked Blog List of the migrated articles",
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

const parsers = { 'blog-list': blogListParser };
// Cleanup first so the other transformers see only the article; metadata last, after cleanup.
const transformers = [cleanupTransformer, sectionsTransformer, metadataTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

// AEM Assets folder for the site; the blog home's assets (if any) go in its "blog" subfolder.
const DAM_ROOT = '/content/dam/hashicorp-xwalk-poc';

/**
 * Points every external image at a readable DAM path for this page and returns
 * { damPath: sourceUrl } so tools/importer/fetch-assets.mjs can download the files.
 * The source asset id prefix (DatoCMS "1506457090-") is dropped from file names.
 */
function mapAssets(main, pagePath) {
  const assets = {};
  const bySource = {};
  main.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!/^https?:\/\//.test(src)) return;
    if (bySource[src]) {
      img.setAttribute('src', bySource[src]);
      return;
    }
    const url = new URL(src);
    const file = decodeURIComponent(url.pathname.split('/').pop() || 'image');
    const pathExt = (file.match(/\.([a-z0-9]+)$/i) || [])[1] || 'png';
    const ext = (url.searchParams.get('fm') || pathExt).toLowerCase().replace('jpeg', 'jpg');
    const base = file.replace(/\.[a-z0-9]+$/i, '').replace(/^\d+-/, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
    let damPath = `${DAM_ROOT}${pagePath}/${base}.${ext}`;
    for (let i = 2; assets[damPath]; i += 1) damPath = `${DAM_ROOT}${pagePath}/${base}-${i}.${ext}`;
    assets[damPath] = src;
    bySource[src] = damPath;
    img.setAttribute('src', damPath);
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    // The metadata transformer writes the Metadata block (lowercase keys for XWalk page fields),
    // so WebImporter.rules.createMetadata is not used, and no <hr> is added before it: an
    // extra section would become an empty section node in AEM.
    executeTransformers('afterTransform', main, payload);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // The blog home lives at /blog (the source /en locale prefix is dropped).
    const path = '/blog';
    const assets = mapAssets(main, '/blog/home');

    return [{
      element: main,
      path,
      report: {
        title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name), assets,
      },
    }];
  },
};
