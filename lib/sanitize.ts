/**
 * HTML sanitizer for user-generated content (stories, fundraising campaigns).
 *
 * Backed by DOMPurify (isomorphic-dompurify), a vetted, battle-tested XSS
 * sanitizer that parses the DOM instead of pattern-matching strings — closing
 * the bypasses the previous hand-rolled regex implementation was vulnerable to
 * (nested/broken tags, mutation XSS, attribute splitting, etc.).
 *
 * Works in both server and client components via the isomorphic wrapper.
 */
import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr', 'sub', 'sup', 'small',
]

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'colspan', 'rowspan',
  'class', 'id',
]

// Harden external links: force rel="noopener noreferrer" on target="_blank".
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Honor the explicit allowlist strictly: DOMPurify permits all data-* attrs
    // by default, so disable them to avoid smuggling unexpected attributes.
    ALLOW_DATA_ATTR: false,
    // Inline styles and event handlers are never allowed; DOMPurify also strips
    // javascript:/vbscript:/data: URIs in href/src by default.
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  }) as unknown as string
}
