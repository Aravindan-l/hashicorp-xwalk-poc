/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the blog-list block (XWalk container; items: link).
 * Source: https://www.hashicorp.com/en/blog  Selector: main
 * The source lists the newest posts site-wide, most of which are not migrated. The listing
 * is hand-picked instead: one row per migrated article in MIGRATED_ARTICLES (site paths),
 * under the source's "Latest posts" heading. Add an article here when it is migrated.
 * Block table: one row per article with its link in the single cell.
 */

const MIGRATED_ARTICLES = [
  { path: '/blog/a-new-look-for-vagrant', title: 'A New Look for Vagrant' },
];

function clean(text) {
  return (text || '').replace(/[​-‏⁠﻿]/g, '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const heading = [...element.querySelectorAll('h2')].map((h) => clean(h.textContent))
    .find((t) => /latest posts/i.test(t)) || 'Latest posts';

  const cells = MIGRATED_ARTICLES.map(({ path, title }) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:link '));
    const a = document.createElement('a');
    a.href = path;
    a.textContent = title;
    frag.appendChild(a);
    return [frag];
  });

  const h2 = document.createElement('h2');
  h2.textContent = heading;
  const block = WebImporter.Blocks.createBlock(document, { name: 'blog-list', cells });
  element.before(h2);
  element.replaceWith(block);
}
