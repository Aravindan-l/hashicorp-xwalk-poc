/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the hero block (XWalk: image, imageAlt, text).
 * Source: https://www.hashicorp.com/en  Selector: main > div:nth-of-type(1)
 * Rows: background image, then text (announcement callout, H1, description, CTA).
 */

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
  return /\.svg$/i.test(base) ? `${base}?fm=png&w=1600` : url;
}

function linkParagraph(document, a, wrapper) {
  const out = document.createElement('a');
  out.href = absolute(a.getAttribute('href'));
  out.textContent = clean(a.textContent);
  const p = document.createElement('p');
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
  if (!list.length) return '';
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  list.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  const text = [];
  const callout = element.querySelector('[class*="smallCallout"]');
  if (callout) {
    const p = document.createElement('p');
    const badge = callout.querySelector('[class*="badge"]');
    if (badge) {
      const strong = document.createElement('strong');
      strong.textContent = clean(badge.textContent);
      p.append(strong, ' ');
    }
    const span = [...callout.children].find((c) => c.tagName === 'SPAN');
    if (span) p.append(clean(span.textContent));
    text.push(p);
    const a = callout.querySelector('a');
    if (a) text.push(linkParagraph(document, a));
  }
  const h1 = element.querySelector('h1');
  if (h1) {
    const h = document.createElement('h1');
    h.textContent = clean(h1.textContent);
    text.push(h);
  }
  const desc = element.querySelector('[class*="description"]');
  if (desc) {
    const p = document.createElement('p');
    p.textContent = clean(desc.textContent);
    text.push(p);
  }
  element.querySelectorAll('[class*="ctas"] a').forEach((a) => text.push(linkParagraph(document, a, 'strong')));

  const bg = element.querySelector('img[class*="hero_image"]')
    || [...element.querySelectorAll('img')].find((img) => !sourceOf(img).startsWith('data:'));
  let image = null;
  if (bg) {
    image = document.createElement('img');
    image.src = assetUrl(sourceOf(bg));
    image.alt = '';
  }

  const cells = [
    [hinted(document, 'image', [image])],
    [hinted(document, 'text', text)],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
