/* eslint-disable */
/* global WebImporter */

/**
 * Page metadata for imported HashiCorp pages, taken from the source <head>.
 * Keys other than Title/Description must match the page-metadata model field names
 * exactly (md2jcr matches them case-sensitively): template, image.
 */
// Import template -> value of the page's "template" property (pages without one use the default).
const PAGE_TEMPLATES = { 'blog-article': 'blog-article', 'blog-listing': 'blog-listing' };

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const { document } = payload;
  const meta = (name) => document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content?.trim() || '';

  const cells = {};
  const title = meta('og:title') || document.title;
  if (title) cells.Title = title;
  const description = meta('description').replace(/\s*\n\s*/g, ' ');
  if (description) cells.Description = description;
  const pageTemplate = PAGE_TEMPLATES[payload.template?.name];
  if (pageTemplate) cells.template = pageTemplate;

  // Social image: the 1200x630 crop the source shares, as PNG rather than content-negotiated.
  const og = meta('og:image');
  if (og) {
    const img = document.createElement('img');
    img.src = og.replace(/([?&])auto=format(&|$)/, '$1fm=png$2');
    img.alt = '';
    cells.image = img;
  }

  element.append(WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells }));
}
