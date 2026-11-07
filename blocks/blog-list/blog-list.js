import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, resolveSitePath } from '../../scripts/scripts.js';
import { buildDate } from '../article-header/article-header.js';

/*
 * Blog list: authors pick article pages (one link per row). Each card is filled from the
 * article's own Article Header block (category, title, authors, date, tags, hero image),
 * so nothing is typed twice and cards follow edits to the article.
 */

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children.filter(Boolean));
  return node;
}

/** Reads the card details from an article's plain HTML; null when it is not an article. */
async function loadArticle(href) {
  const url = new URL(href, window.location);
  if (url.origin !== window.location.origin) return null;
  const path = url.pathname.replace(/\.html$/, '');
  const source = resolveSitePath(path);
  const resp = await fetch(`${source}.plain.html`);
  if (!resp.ok) return null;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const header = doc.querySelector('.article-header');
  if (!header) return null;
  const rows = [...header.children];
  const cell = (i) => rows[i]?.firstElementChild;
  const base = new URL(source, window.location);
  const imageOf = (node) => {
    const src = node?.querySelector('img')?.getAttribute('src');
    return src ? new URL(src, base).href : null;
  };
  return {
    href: path,
    category: [...(cell(0)?.querySelectorAll('a') || [])].pop()?.textContent.trim(),
    title: cell(1)?.textContent.trim(),
    date: cell(3)?.textContent.trim(),
    tags: [...(cell(4)?.querySelectorAll('a') || [])].map((a) => ({ text: a.textContent.trim(), href: a.href })),
    image: imageOf(cell(5)),
    imageAlt: cell(5)?.querySelector('img')?.alt || '',
    authors: rows.slice(6).map((row) => ({
      name: [...row.children].find((c) => !c.querySelector('img, a') && c.textContent.trim())?.textContent.trim(),
      image: imageOf(row),
    })),
  };
}

function buildCard(article) {
  const titleLink = el('a', '', article.title);
  titleLink.href = article.href;
  const media = el('a', 'blog-list-image');
  media.href = article.href;
  media.setAttribute('tabindex', '-1');
  media.setAttribute('aria-hidden', 'true');
  if (article.image) media.append(createOptimizedPicture(article.image, article.imageAlt, false, [{ width: '750' }]));

  const avatars = el('span', 'blog-list-avatars', ...article.authors.filter((a) => a.image)
    .map((a) => createOptimizedPicture(a.image, a.name || '', false, [{ width: '96' }])));
  const meta = el('p', 'blog-list-meta', avatars, buildDate(article.date));

  const tags = el('ul', 'blog-list-tags', ...article.tags.map((t) => {
    const a = el('a', '', t.text);
    a.href = t.href;
    return el('li', '', a);
  }));

  return [
    media,
    article.category && el('p', 'blog-list-category', article.category),
    el('h3', 'blog-list-title', titleLink),
    meta,
    article.tags.length ? tags : null,
  ];
}

/**
 * @param {Element} block The blog-list block element
 */
export default async function decorate(block) {
  const list = el('ul', 'blog-list-items');
  const rows = [...block.children];
  const cards = await Promise.all(rows.map(async (row) => {
    const href = row.querySelector('a')?.getAttribute('href');
    const li = el('li', 'blog-list-item');
    moveInstrumentation(row, li);
    const article = href ? await loadArticle(href).catch(() => null) : null;
    if (article) {
      li.append(...buildCard(article).filter(Boolean));
    } else if (href) {
      // Not an article (or not published yet): keep the link so authors see what was picked.
      const a = el('a', '', row.textContent.trim() || href);
      a.href = href;
      li.append(el('h3', 'blog-list-title', a));
    }
    return li;
  }));
  list.append(...cards);
  block.replaceChildren(list);
}
