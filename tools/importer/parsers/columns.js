/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the columns block (XWalk columns: default content per cell, no field hints).
 * Source: https://www.hashicorp.com/en
 * Selector: sections whose root has a text column and an image column (split layouts).
 * Block table: one row with two cells, text (eyebrow, heading, body, calls to action) and
 * image, in source order, so a reversed source layout keeps its image on the left.
 */

const PRODUCT_ICONS = {
  'hashicorp cloud platform': 'hcp', terraform: 'terraform', packer: 'packer', vault: 'vault',
  consul: 'consul', nomad: 'nomad', waypoint: 'waypoint', boundary: 'boundary',
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

/**
 * Calls to action: the source repeats each one for mobile, tablet and desktop.
 * Solid light buttons become <strong> links, blue buttons plain links, arrow links <em>.
 */
function ctaParagraphs(document, scope) {
  const seen = new Set();
  return [...scope.querySelectorAll('a[class*="button__"], a[class*="standalone-link"]')]
    .filter((a) => !/style_(mobile|tablet)/.test(a.className))
    .filter((a) => {
      const key = `${clean(a.textContent)}|${a.getAttribute('href')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((a) => {
      const link = document.createElement('a');
      link.href = absolute(a.getAttribute('href'));
      link.textContent = clean(a.textContent);
      let wrapper = null;
      if (/standalone-link/.test(a.className)) wrapper = 'em';
      else if (!/color-primary/.test(a.className)) wrapper = 'strong';
      const p = document.createElement('p');
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

/** Body paragraphs with their inline links, without source classes. */
function bodyParagraphs(document, scope) {
  const body = [...scope.querySelectorAll('[class*="style_body"] p')];
  const sources = body.length ? body : [...scope.querySelectorAll('[class*="style_body"], [class*="description"]')];
  return sources.map((src) => {
    const p = document.createElement('p');
    src.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        p.append(n.textContent);
      } else if (n.tagName === 'A') {
        const a = document.createElement('a');
        a.href = absolute(n.getAttribute('href'));
        a.textContent = clean(n.textContent);
        p.append(a);
      } else if (n.tagName === 'STRONG' || n.tagName === 'B') {
        const s = document.createElement('strong');
        s.textContent = clean(n.textContent);
        p.append(s);
      } else {
        p.append(n.textContent);
      }
    });
    return p;
  }).filter((p) => clean(p.textContent));
}

function textCell(document, content) {
  const nodes = [];
  // Eyebrows are either their own wrapper (with an optional product logo) or a plain span
  // just before the heading inside the heading wrapper.
  const eyebrow = content.querySelector('[class*="eyebrowWrapper"]')
    || [...content.querySelectorAll('[class*="eyebrow"]')].find((e) => !/eyebrow-headline/.test(e.className))
    || content.querySelector('[class*="eyebrow-headline"] > span:first-child');
  if (eyebrow && clean(eyebrow.textContent)) {
    const p = document.createElement('p');
    const label = clean(eyebrow.textContent);
    const icon = eyebrow.querySelector('img') && PRODUCT_ICONS[label.toLowerCase()];
    p.textContent = icon ? `:${icon}: ${label}` : label;
    nodes.push(p);
  }
  const h = content.querySelector('h2, h3');
  if (h) {
    const heading = document.createElement(h.tagName.toLowerCase());
    heading.textContent = clean(h.textContent);
    nodes.push(heading);
  }
  nodes.push(...bodyParagraphs(document, content), ...ctaParagraphs(document, content));
  return nodes;
}

export default function parse(element, { document }) {
  const root = element.querySelector(':scope > [class*="style_root"]') || element;
  const content = root.querySelector(':scope > [class*="style_content"]') || root;
  const imageWrap = root.querySelector(':scope > [class*="style_image"]');
  const img = imageWrap && [...imageWrap.querySelectorAll('img')]
    .find((i) => !(i.getAttribute('src') || '').startsWith('data:'));

  const text = textCell(document, content);
  let image = '';
  if (img) {
    image = document.createElement('img');
    image.src = assetUrl(sourceOf(img));
    image.alt = clean(img.getAttribute('alt'));
  }

  const reversed = /style_reverse/.test(root.className);
  const row = reversed ? [image, text] : [text, image];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] });
  element.replaceWith(block);
}
