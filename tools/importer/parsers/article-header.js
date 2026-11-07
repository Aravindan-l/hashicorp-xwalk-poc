/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the article-header block (XWalk container block).
 * Source: https://www.hashicorp.com/en/blog/a-new-look-for-vagrant
 * Selector: [class*='post_header']
 * Model rows: breadcrumbs, title, intro, publishDate, tags, image; then one row per author
 * (image, name, link). Date and hero image live outside the header, so they are read from the page.
 */

// Alt text for images whose source alt is empty, keyed by asset URL without query string.
const ALT_TEXT = {
  'https://www.datocms-assets.com/2885/1506457090-blog-vagrant.svg': 'HashiCorp Vagrant logo',
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function absolute(href) {
  try {
    return new URL(href, 'https://www.hashicorp.com').href;
  } catch (e) {
    return href;
  }
}

/** Unwraps Next.js image URLs and renders SVGs as PNG so every asset works in DAM and EDS. */
function assetUrl(src) {
  let url = absolute(src || '');
  if (url.includes('/_next/image')) {
    const inner = new URL(url).searchParams.get('url');
    if (inner) url = absolute(inner);
  }
  return url;
}

function baseUrl(url) {
  return url.split('?')[0];
}

function deliverableUrl(url) {
  return /\.svg$/i.test(baseUrl(url)) ? `${baseUrl(url)}?fm=png&w=444` : url;
}

function image(document, src, alt) {
  const img = document.createElement('img');
  const url = assetUrl(src);
  img.src = deliverableUrl(url);
  img.alt = alt || ALT_TEXT[baseUrl(url)] || '';
  return img;
}

/** "Jan 1, 2013" -> "2013-01-01"; returns '' when the text is not a date. */
function isoDate(text) {
  const m = (text || '').trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return '';
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return '';
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

function linkParagraphs(document, links) {
  return links.map((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = absolute(a.getAttribute('href'));
    link.textContent = a.textContent.trim().replace(/,$/, '');
    p.append(link);
    return p;
  });
}

function hinted(document, field, nodes) {
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (!list.length) return '';
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  list.forEach((n) => frag.appendChild(typeof n === 'string' ? document.createTextNode(n) : n));
  return frag;
}

export default function parse(element, { document }) {
  const breadcrumbs = linkParagraphs(document, [...element.querySelectorAll('nav a')]);

  const title = element.querySelector('h1')?.textContent.trim() || '';

  // The subtitle keeps the CMS paragraph breaks as blank lines.
  const subtitle = element.querySelector('[class*="header_subtitle"]');
  const intro = (subtitle?.textContent || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
    .map((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    });

  const date = isoDate(document.querySelector('[class*="metadata_date"]')?.textContent);

  const tags = linkParagraphs(document, [...element.querySelectorAll('[class*="style_tag"] a')]);

  const heroImg = document.querySelector('[class*="post_image"] img');
  const hero = heroImg ? image(document, heroImg.getAttribute('src'), heroImg.getAttribute('alt')) : null;

  const cells = [
    [hinted(document, 'breadcrumbs', breadcrumbs)],
    [hinted(document, 'title', title)],
    [hinted(document, 'intro', intro)],
    [hinted(document, 'publishDate', date)],
    [hinted(document, 'tags', tags)],
    [hinted(document, 'image', hero)],
  ];

  // Authors: photos and names are separate lists in the byline, paired by position.
  const byline = element.querySelector('[class*="header_byline"]');
  const photos = byline ? [...byline.querySelectorAll('[class*="header_authorImages"] img')] : [];
  const names = byline ? [...byline.querySelectorAll('[class*="header_authors"] li')] : [];
  names.forEach((li, i) => {
    const link = li.querySelector('a');
    const name = li.textContent.trim().replace(/,$/, '');
    const photo = photos[i] ? image(document, photos[i].getAttribute('src'), name) : null;
    let authorLink = null;
    if (link) {
      authorLink = document.createElement('a');
      authorLink.href = absolute(link.getAttribute('href'));
      authorLink.textContent = authorLink.href;
    }
    cells.push([
      hinted(document, 'image', photo),
      hinted(document, 'name', name),
      hinted(document, 'link', authorLink),
    ]);
  });

  if (heroImg) heroImg.closest('[class*="post_image"]')?.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-header', cells });
  element.replaceWith(block);
}
