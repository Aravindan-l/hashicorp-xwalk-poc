import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Rows of the article-header model, in model order. Any further rows are author items.
const FIELDS = ['breadcrumbs', 'title', 'intro', 'publishDate', 'tags', 'image'];

const SHARE_TARGETS = [
  { name: 'twitter', label: 'Twitter share', url: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
  { name: 'linkedin', label: 'LinkedIn share', url: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  { name: 'facebook', label: 'Facebook share', url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
];

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

function icon(name) {
  const span = el('span', `icon icon-${name}`);
  const img = document.createElement('img');
  img.src = `${window.hlx.codeBasePath}/icons/${name}.svg`;
  img.alt = '';
  img.loading = 'lazy';
  span.append(img);
  return span;
}

/** Copies the link text and target into a fresh anchor, dropping button decoration. */
function cleanLink(a) {
  const link = el('a', '', a.textContent.trim());
  link.href = a.href;
  return link;
}

function linkList(cell, className) {
  const links = cell ? [...cell.querySelectorAll('a')] : [];
  if (!links.length) return null;
  const ul = el('ul', className);
  links.forEach((a) => ul.append(el('li', '', cleanLink(a))));
  return ul;
}

function optimizedPicture(cell, width, eager = false) {
  const img = cell?.querySelector('img');
  if (!img) return null;
  const picture = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

/** Accepts ISO dates (2013-01-01 or 2013-01-01T00:00:00.000Z); returns null when unparseable. */
function parseDate(text) {
  if (!text) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildDate(text) {
  if (!text) return null;
  const date = parseDate(text);
  const time = el('time', '', date
    ? date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    })
    : text);
  if (date) time.dateTime = date.toISOString().slice(0, 10);
  return time;
}

function readAuthor(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('img'));
  const linkCell = cells.find((c) => c !== imageCell && c.querySelector('a'));
  const nameCell = cells.find((c) => c !== imageCell && c !== linkCell && c.textContent.trim());
  return {
    row,
    imageCell,
    name: nameCell?.textContent.trim() || '',
    nameCell,
    href: linkCell?.querySelector('a')?.href,
  };
}

function authorName(author) {
  if (!author.href) return el('span', '', author.name);
  const a = el('a', '', author.name);
  a.href = author.href;
  return a;
}

/**
 * Lists author photos and names. Only the copy in the header is editable;
 * the copy in the side column has no Universal Editor instrumentation.
 */
function buildAuthors(authors, editable) {
  if (!authors.length) return null;
  const avatars = el('ul', 'article-header-avatars');
  const names = el('ul', 'article-header-author-names');
  authors.forEach((author) => {
    const img = author.imageCell?.querySelector('img');
    let picture = null;
    if (editable) picture = optimizedPicture(author.imageCell, '96');
    else if (img) picture = createOptimizedPicture(img.src, '', false, [{ width: '96' }]);
    const name = el('li', '', authorName(author));
    if (editable) {
      moveInstrumentation(author.row, name);
      if (author.nameCell) moveInstrumentation(author.nameCell, name.firstElementChild);
    }
    if (picture) avatars.append(el('li', '', picture));
    names.append(name);
  });
  return el('div', 'article-header-authors', avatars.children.length ? avatars : null, names);
}

function buildShare(title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title);
  const list = el('ul', 'article-header-share-list');
  SHARE_TARGETS.forEach((target) => {
    const a = el('a', '', icon(target.name));
    a.href = target.url(url, text);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', target.label);
    list.append(el('li', '', a));
  });
  const copy = el('button', '', icon('link'));
  copy.type = 'button';
  copy.setAttribute('aria-label', 'Copy URL');
  const status = el('span', 'article-header-share-status');
  status.setAttribute('role', 'status');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      status.textContent = 'Link copied';
    } catch (e) {
      status.textContent = 'Copy failed';
    }
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
  list.append(el('li', '', copy, status));
  return el('div', 'article-header-share', el('p', 'article-header-share-label', 'Share article'), list);
}

function buildToc(main) {
  const headings = [...main.querySelectorAll(':scope > .section:not(.article-header-container) h2[id]')];
  if (headings.length < 2) return null;
  const list = el('ol');
  headings.forEach((h) => {
    const a = el('a', '', h.textContent.trim());
    a.href = `#${h.id}`;
    list.append(el('li', '', a));
  });
  const toc = el('nav', 'article-header-toc', list);
  toc.setAttribute('aria-label', 'On this page');
  return toc;
}

/** Side columns sit in main so they can run alongside the article body on wide screens. */
function buildRails(block, { date, authors, title }) {
  const main = block.closest('main');
  if (!main) return;
  main.querySelectorAll(':scope > .article-header-rail, :scope > .article-header-toc').forEach((n) => n.remove());
  const sticky = el('div', 'article-header-rail-sticky', buildDate(date), buildAuthors(authors, false), buildShare(title));
  const rail = el('aside', 'article-header-rail', sticky);
  rail.setAttribute('aria-label', 'Article details');
  main.append(rail);
  const toc = buildToc(main);
  if (toc) main.append(toc);
}

export default function decorate(block) {
  const rows = [...block.children];
  const cells = Object.fromEntries(FIELDS.map((name, i) => [name, rows[i]?.firstElementChild]));
  const authors = rows.slice(FIELDS.length).map(readAuthor).filter((a) => a.name || a.imageCell);

  const title = cells.title?.textContent.trim() || '';
  const date = cells.publishDate?.textContent.trim() || '';

  const breadcrumbs = linkList(cells.breadcrumbs);
  const nav = breadcrumbs && el('nav', 'article-header-breadcrumbs', breadcrumbs);
  if (nav) {
    nav.setAttribute('aria-label', 'Breadcrumb');
    moveInstrumentation(cells.breadcrumbs, nav);
  }

  const h1 = title ? el('h1', 'article-header-title', title) : null;
  if (h1) moveInstrumentation(cells.title, h1);

  let intro = null;
  if (cells.intro?.textContent.trim()) {
    intro = el('div', 'article-header-intro', ...cells.intro.childNodes);
    moveInstrumentation(cells.intro, intro);
  }

  const tags = linkList(cells.tags, 'article-header-tags');
  if (tags) moveInstrumentation(cells.tags, tags);

  const picture = optimizedPicture(cells.image, '2000', true);
  const hero = picture && el('div', 'article-header-image', picture);

  const head = el('div', 'article-header-head', nav, h1, intro, buildAuthors(authors, true), tags);
  block.replaceChildren(head);
  if (hero) block.append(hero);

  buildRails(block, { date, authors, title });
}
