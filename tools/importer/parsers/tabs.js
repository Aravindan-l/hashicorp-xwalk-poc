/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the tabs block (XWalk container; items: title, content_heading, content_image,
 * content_richtext).
 * Source: https://www.hashicorp.com/en  Selector: the section whose tab panels hold an H3.
 * Panels only render on click on the source, so the snapshot carries every panel in
 * [data-import-tabpanel] elements (added when the snapshot was captured).
 * Block table: one row per tab, tab label in the first cell, tab content (heading, image,
 * text with the call to action) in the second.
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
  return /\.svg$/i.test(base) ? `${base}?fm=png&w=1200` : url;
}

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('[data-import-tabpanel]').forEach((panel) => {
    const label = document.createDocumentFragment();
    label.appendChild(document.createComment(' field:title '));
    label.appendChild(document.createTextNode(clean(panel.getAttribute('data-import-tabpanel'))));

    const content = document.createDocumentFragment();
    const h = panel.querySelector('h2, h3, h4');
    if (h) {
      content.appendChild(document.createComment(' field:content_heading '));
      const heading = document.createElement('h3');
      heading.textContent = clean(h.textContent);
      content.appendChild(heading);
    }
    const img = panel.querySelector('img');
    if (img) {
      content.appendChild(document.createComment(' field:content_image '));
      const image = document.createElement('img');
      image.src = assetUrl(sourceOf(img));
      image.alt = clean(img.getAttribute('alt'));
      content.appendChild(image);
    }
    const text = [...panel.querySelectorAll('p')].map((p) => {
      const out = document.createElement('p');
      out.textContent = clean(p.textContent);
      return out;
    });
    panel.querySelectorAll('a').forEach((a) => {
      const link = document.createElement('a');
      link.href = absolute(a.getAttribute('href'));
      link.textContent = clean(a.textContent);
      const strong = document.createElement('strong');
      strong.append(link);
      const p = document.createElement('p');
      p.append(strong);
      text.push(p);
    });
    if (text.length) {
      content.appendChild(document.createComment(' field:content_richtext '));
      text.forEach((n) => content.appendChild(n));
    }
    cells.push([label, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
