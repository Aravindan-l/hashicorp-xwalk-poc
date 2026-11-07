/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the cards block (XWalk container; items: image, imageAlt, text).
 * Source: https://www.hashicorp.com/en
 * Selectors:
 * - the product groups section: one card per group (linked heading, sub-line, description,
 *   Learn more, and the group's products as ":icon: link description" list items);
 * - each resource tab panel ([data-import-tabpanel], added when the snapshot was captured):
 *   one card per resource (image, linked title, description). The tab label is written as an
 *   H3 right before the block, for the section's "tabs" style.
 * Block table: one row per card, image in the first cell (empty when there is none), text in
 * the second.
 */

const PRODUCT_ICONS = {
  terraform: 'terraform', packer: 'packer', vault: 'vault', consul: 'consul', nomad: 'nomad',
  waypoint: 'waypoint', boundary: 'boundary',
};

function clean(text) {
  return (text || '').replace(/[​-‏⁠﻿]/g, '').replace(/\s+/g, ' ').trim();
}

function absolute(href) {
  try { return new URL(href, 'https://www.hashicorp.com').href; } catch (e) { return href; }
}

/**
 * The source URL of an image. When importing from a Bright Data snapshot the runner may swap
 * images it localized for inline data:, blob: or /media-da/ copies before parsers run;
 * srcset still holds the original URL then.
 */
function sourceOf(img) {
  const src = img.getAttribute('src') || '';
  if (!/^(blob:|data:)|\/media-da\//.test(src)) return src;
  return (img.getAttribute('srcset') || '').trim().split(/\s+/)[0] || src;
}

function assetUrl(src) {
  let url = absolute(src || '');
  if (url.includes('/_next/image')) {
    const inner = new URL(url).searchParams.get('url');
    if (inner) url = absolute(decodeURIComponent(inner));
  }
  const base = url.split('?')[0];
  return /\.svg$/i.test(base) ? `${base}?fm=png&w=1200` : url;
}

function el(document, tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function anchor(document, href, text) {
  const a = el(document, 'a', text);
  a.href = absolute(href);
  return a;
}

function hinted(document, field, nodes) {
  const list = nodes.filter(Boolean);
  if (!list.length) return '';
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
      const [name, sub] = [...part.querySelectorAll('p')].map((p) => clean(p.textContent));
      const h3 = el(document, 'h3');
      h3.append(anchor(document, part.getAttribute('href'), name));
      card = [h3];
      if (sub) card.push(el(document, 'p', sub));
      rows.push(card);
      return;
    }
    if (!card) return;
    const desc = part.querySelector('[class*="headingDescription"]');
    if (desc) card.push(el(document, 'p', clean(desc.textContent)));
    const more = part.querySelector('a[class*="standalone-link"]');
    if (more) {
      const em = el(document, 'em');
      em.append(anchor(document, more.getAttribute('href'), clean(more.textContent)));
      const p = el(document, 'p');
      p.append(em);
      card.push(p);
    }
    const products = [...part.querySelectorAll('li')];
    if (products.length) {
      const ul = el(document, 'ul');
      products.forEach((li) => {
        const a = li.querySelector('a');
        const name = clean(li.querySelector('[class*="product-logo"]')?.textContent);
        const productDesc = clean(li.querySelector('[class*="productDescription"]')?.textContent);
        const item = el(document, 'li');
        const icon = PRODUCT_ICONS[name.toLowerCase()];
        if (icon) item.append(`:${icon}: `);
        item.append(anchor(document, a.getAttribute('href'), name));
        if (productDesc) item.append(` ${productDesc}`);
        ul.append(item);
      });
      card.push(ul);
    }
  });
  return rows.map((nodes) => ['', hinted(document, 'text', nodes)]);
}

function resourceCards(document, panel) {
  return [...panel.querySelectorAll('li')].map((li) => {
    const a = li.querySelector('a');
    const [title, desc] = [...li.querySelectorAll('p')].map((p) => clean(p.textContent));
    const img = li.querySelector('img');
    let image = null;
    if (img) {
      image = el(document, 'img');
      image.src = assetUrl(sourceOf(img));
      image.alt = clean(img.getAttribute('alt'));
    }
    const h3 = el(document, 'h3');
    h3.append(anchor(document, a.getAttribute('href'), title));
    const text = [h3, desc ? el(document, 'p', desc) : null];
    return [hinted(document, 'image', [image]), hinted(document, 'text', text)];
  });
}

export default function parse(element, { document }) {
  const label = element.getAttribute('data-import-tabpanel');
  const cells = label ? resourceCards(document, element) : productGroups(document, element);
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  if (label) element.before(el(document, 'h3', clean(label)));
  element.replaceWith(block);
}
