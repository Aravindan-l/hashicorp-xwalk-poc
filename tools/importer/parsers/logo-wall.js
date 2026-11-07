/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the logo-wall block (XWalk container: title; items: image, imageAlt, link).
 * Source: https://www.hashicorp.com/en
 * Selectors: the section with the customer marquee (its eyebrow becomes the title), and the
 *            partner tiles root (the centred text and stats around the tiles are written out
 *            as default content before the block).
 */

function clean(text) {
  return (text || '').replace(/[​-‏⁠﻿]/g, '').replace(/\s+/g, ' ').trim();
}

function absolute(href) {
  try { return new URL(href, 'https://www.hashicorp.com').href; } catch (e) { return href; }
}

/** SVG logos are delivered as PNG so they work in DAM and on Edge Delivery. */
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
  return /\.svg$/i.test(base) ? `${base}?fm=png&w=320` : url;
}

/** "1657810100-aws-logo.svg" -> "aws logo" when the source has no alt text. */
function altFromFile(src) {
  const file = decodeURIComponent((src || '').split('?')[0].split('/').pop() || '');
  const name = file.replace(/\.[a-z0-9]+$/i, '').replace(/^\d+-/, '')
    .replace(/[-_]+/g, ' ').replace(/\b(color|white|black|\d+)\b/gi, '').replace(/\s+/g, ' ').trim();
  return /logo/i.test(name) ? name : `${name} logo`;
}

function hinted(document, field, node) {
  if (!node) return '';
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(node);
  return frag;
}

function el(document, tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Centred intro around the tiles: eyebrow, heading, text, links and stats. */
function introNodes(document, wrapper) {
  const nodes = [];
  const eyebrow = wrapper.querySelector('[class*="eyebrow"]');
  if (eyebrow) nodes.push(el(document, 'p', clean(eyebrow.textContent)));
  const h = wrapper.querySelector('h2, h3');
  if (h) nodes.push(el(document, 'h2', clean(h.textContent)));
  const desc = wrapper.querySelector('[class*="description"]');
  if (desc) nodes.push(el(document, 'p', clean(desc.textContent)));
  wrapper.querySelectorAll('[class*="ctas"] a').forEach((a) => {
    const link = el(document, 'a', clean(a.textContent));
    link.href = absolute(a.getAttribute('href'));
    const em = el(document, 'em');
    em.append(link);
    const p = el(document, 'p');
    p.append(em);
    nodes.push(p);
  });
  const stats = [...wrapper.querySelectorAll('[class*="stat"] li, li[class*="stat"]')];
  if (stats.length) {
    const ul = el(document, 'ul');
    stats.forEach((li) => {
      const [num, label] = [...li.querySelectorAll('p')].map((p) => clean(p.textContent));
      const item = el(document, 'li');
      item.append(el(document, 'strong', num), ` ${label || ''}`);
      ul.append(item);
    });
    nodes.push(ul);
  }
  return nodes;
}

export default function parse(element, { document }) {
  const cells = [];
  const eyebrow = element.querySelector('[class*="eyebrow"]');
  const textWrapper = element.querySelector('[class*="textWrapper"]');

  if (textWrapper) {
    introNodes(document, textWrapper).forEach((n) => element.before(n));
    textWrapper.remove();
  }

  cells.push([eyebrow && !textWrapper ? hinted(document, 'title', document.createTextNode(clean(eyebrow.textContent))) : '']);

  const seen = new Set();
  [...element.querySelectorAll('img')].forEach((img) => {
    const src = sourceOf(img);
    // The source also ships a single combined image of all tiles for mobile; skip it.
    if (!src || src.startsWith('data:') || img.closest('[class*="mobileImage"]')) return;
    const url = assetUrl(src);
    if (seen.has(url)) return;
    seen.add(url);
    const logo = document.createElement('img');
    logo.src = url;
    logo.alt = clean(img.getAttribute('alt')) || altFromFile(src);
    cells.push([hinted(document, 'image', logo), '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'logo-wall', cells });
  element.replaceWith(block);
}
