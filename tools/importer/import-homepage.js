/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import logoWallParser from './parsers/logo-wall.js';
import columnsParser from './parsers/columns.js';
import tabsParser from './parsers/tabs.js';
import cardsParser from './parsers/cards.js';
import cleanupTransformer from './transformers/homepage-cleanup.js';
import metadataTransformer from './transformers/hashicorp-metadata.js';
import sectionsTransformer from './transformers/hashicorp-sections.js';

const PAGE_TEMPLATE = {
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

const parsers = {
  hero: heroParser,
  'logo-wall': logoWallParser,
  columns: columnsParser,
  tabs: tabsParser,
  cards: cardsParser,
};
// Cleanup first so the other transformers see only the article; metadata last, after cleanup.
const transformers = [cleanupTransformer, sectionsTransformer, metadataTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

// AEM Assets folder for the site; the homepage's assets go in its "home" subfolder.
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

    // The homepage stays at the site root.
    const path = '/index';
    const assets = mapAssets(main, '/home');

    return [{
      element: main,
      path,
      report: {
        title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name), assets,
      },
    }];
  },
};
