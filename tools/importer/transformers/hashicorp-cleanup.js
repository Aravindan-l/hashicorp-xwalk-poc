/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup for HashiCorp blog articles. Keeps only the article (header, hero image and body)
 * and drops site chrome: global header, blog sub-nav, related posts, newsletter, footer,
 * cookie dialog, share buttons and the side columns.
 */

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
  const base = url.split('?')[0];
  return /\.svg$/i.test(base) ? `${base}?fm=png&w=1600` : url;
}

export default function transform(hookName, element, payload) {
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    const post = element.querySelector('[class*="post_root"]');
    if (post) element.replaceChildren(post);

    element.querySelectorAll('script, style, noscript, iframe, link, button').forEach((n) => n.remove());
    element.querySelectorAll('[class*="post_rightColumn"]').forEach((n) => n.remove());

    // Headings carry a "»" permalink anchor to their own id; the page renders headings and
    // the table of contents from the heading text, so drop it.
    element.querySelectorAll('[class*="post_content"] :is(h2, h3, h4, h5, h6) a[href^="#"]').forEach((a) => {
      if (a.textContent.trim().length <= 2) a.remove();
    });

    // Body images: use the original asset, and the figure caption as alt text when there is none.
    element.querySelectorAll('[class*="post_content"] img').forEach((img) => {
      img.setAttribute('src', assetUrl(img.getAttribute('src')));
      img.removeAttribute('srcset');
      if (!img.getAttribute('alt')) {
        const caption = img.closest('[class*="blogImage"]')?.querySelector('p, figcaption');
        if (caption) img.setAttribute('alt', caption.textContent.trim());
      }
    });
  }

  if (hookName === 'afterTransform') {
    // The parser has read the date from the left column; it holds nothing else to keep.
    element.querySelectorAll('[class*="post_leftColumn"], [class*="post_image"]').forEach((n) => n.remove());
    element.querySelectorAll('[class*="clearfix"]').forEach((n) => {
      if (!n.textContent.trim() && !n.querySelector('img')) n.remove();
    });
  }
}
