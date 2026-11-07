/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup for the HashiCorp blog home (template "blog-listing"): removes site chrome outside
 * <main> (global header, footer, consent dialogs, scripts). The page content itself is built
 * by the blog-list parser.
 */
export default function transform(hookName, element, payload) {
  if (payload.template?.name !== 'blog-listing' || hookName !== 'beforeTransform') return;
  element.querySelectorAll('header, footer, script, style, noscript, iframe, link, aside, [role="dialog"]').forEach((n) => n.remove());
  element.querySelectorAll('a[href="#main"]').forEach((n) => n.remove());
  // Everything outside <main> (tracking pixels and the like) goes too.
  [...element.children].forEach((child) => {
    if (!child.matches('main') && !child.querySelector('main')) child.remove();
  });
}
