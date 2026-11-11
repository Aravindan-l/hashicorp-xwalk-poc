/* eslint-disable */
/* global WebImporter */

/**
 * Tables, videos and quotes in HashiCorp blog articles. Runs before the cleanup transformer, which
 * removes iframes, and before the import itself, which drops <video> elements and reads every
 * HTML table as a block named after its first cell.
 * - Inline videos become a Video block (an MP4 file) or an Embed block (YouTube, Vimeo, Wistia).
 * - Data tables become a Table block. Its models go up to 4 columns, so wider tables become a
 *   labelled list.
 * - Pull quotes (<blockquote>, which md2jcr does not support) become a Quote block.
 */

const MAX_TABLE_COLUMNS = 4;
const VIDEO_CONTAINERS = '[class*="BlogVideo_videoContainer"], [data-testid="wpl-inline-video"]';

function absolute(href) {
  try {
    return new URL(href, 'https://www.hashicorp.com').href;
  } catch (e) {
    return href;
  }
}

function link(document, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  return a;
}

/** The URL an embed or video block should point at, or null when the container holds no video. */
function videoSource(container) {
  const iframe = container.querySelector('iframe[src], iframe[data-src]');
  const frameSrc = iframe && (iframe.getAttribute('src') || iframe.getAttribute('data-src'));
  if (frameSrc) {
    const youtube = frameSrc.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    if (youtube) return { block: 'Embed', href: `https://www.youtube.com/watch?v=${youtube[1]}` };
    const vimeo = frameSrc.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (vimeo) return { block: 'Embed', href: `https://vimeo.com/${vimeo[1]}` };
    if (/youtu\.be|vimeo\.com|youtube\.com/.test(frameSrc)) return { block: 'Embed', href: absolute(frameSrc) };
  }

  // Wistia: the media id is in the player's wistia_async_<id> class or its HLS source
  const wistiaClass = container.querySelector('[class*="wistia_async_"]')?.className.match(/wistia_async_(\w+)/);
  const wistiaSource = container.innerHTML.match(/fast\.wistia\.(?:com|net)\/embed\/medias\/(\w+)/);
  const wistia = (wistiaClass || wistiaSource)?.[1];
  if (wistia) return { block: 'Embed', href: `https://fast.wistia.net/embed/iframe/${wistia}` };

  const video = [...container.querySelectorAll('video[src], video source[src]')]
    .map((n) => n.getAttribute('src'))
    .find((src) => src && !src.startsWith('blob:') && /\.mp4(\?|$)/i.test(src));
  if (video) return { block: 'Video', href: absolute(video) };
  return null;
}

function replaceVideos(main, document) {
  const containers = [...main.querySelectorAll(VIDEO_CONTAINERS)]
    .filter((c) => !c.parentElement?.closest(VIDEO_CONTAINERS));
  containers.forEach((container) => {
    const source = videoSource(container);
    if (!source) {
      console.warn(`[blog-media-tables] video container without a known source left out: ${container.className}`);
      container.remove();
      return;
    }
    container.replaceWith(WebImporter.Blocks.createBlock(document, {
      name: source.block,
      cells: [[link(document, source.href)]],
    }));
  });
}

/**
 * A table too wide for the Table block, as a list with one item per row and each cell labelled
 * with its column's header (the first row, when it is a header row), so no content is lost.
 */
function wideTableAsList(table, rows, document) {
  const hasHeader = [...(table.querySelector('tr')?.children || [])].every((c) => c.tagName === 'TH');
  const headers = hasHeader ? rows[0].map((cell) => cell.textContent.trim()) : [];
  const list = document.createElement('ul');
  (hasHeader ? rows.slice(1) : rows).forEach((row) => {
    const item = document.createElement('li');
    row.forEach((cell, i) => {
      const p = document.createElement('p');
      if (headers[i]) {
        const label = document.createElement('strong');
        label.textContent = `${headers[i]}: `;
        p.append(label);
      }
      p.append(...cell.childNodes);
      item.append(p);
    });
    list.append(item);
  });
  return list;
}

function replaceTables(main, document) {
  main.querySelectorAll('[class*="post_content"] table').forEach((table) => {
    const rows = [...table.querySelectorAll('tr')].map((tr) => [...tr.children]
      .filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD')
      .map((cell) => {
        const div = document.createElement('div');
        div.append(...cell.childNodes);
        return div;
      }));
    const columns = Math.max(0, ...rows.map((r) => r.length));
    if (!rows.length || !columns) return;
    if (columns > MAX_TABLE_COLUMNS) {
      console.warn(`[blog-media-tables] ${columns}-column table written as a list: the Table block goes up to ${MAX_TABLE_COLUMNS}`);
      table.closest('[class*="tableBlock"]')?.replaceWith(table);
      table.replaceWith(wideTableAsList(table, rows, document));
      return;
    }
    rows.forEach((row) => { while (row.length < columns) row.push(''); });
    // The first cell names the row type, which md2jcr reads to pick the row model
    // (1-column rows use its default, table-row)
    if (columns > 1) rows.forEach((row) => row.unshift(`table-col-${columns}`));
    const container = table.closest('[class*="tableBlock"]') || table;
    container.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Table', cells: rows }));
  });
}

function replaceQuotes(main, document) {
  main.querySelectorAll('[class*="post_content"] blockquote').forEach((quote) => {
    const quotation = document.createElement('div');
    quotation.append(...quote.childNodes);
    quote.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Quote', cells: [[quotation]] }));
  });
}

export default function transform(hookName, element, payload) {
  if (payload.template?.name !== 'blog-article') return;
  if (hookName !== 'beforeTransform') return;
  const { document } = payload;
  // Tables first: the Video and Embed blocks made here are tables too, and must not be read as data
  replaceTables(element, document);
  replaceVideos(element, document);
  replaceQuotes(element, document);
}
