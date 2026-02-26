/**
 * HTML sanitizer for user-generated content.
 * Strips dangerous tags and attributes to prevent XSS attacks.
 * Allows safe formatting tags only.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr', 'sub', 'sup', 'small',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
  '*': new Set(['class', 'id']),
}

const DANGEROUS_PROTOCOLS = /^\s*(javascript|vbscript|data):/i

function sanitizeAttribute(tag: string, name: string, value: string): string | null {
  const lowerName = name.toLowerCase()
  const lowerTag = tag.toLowerCase()

  // Check tag-specific allowed attrs
  const tagAllowed = ALLOWED_ATTRS[lowerTag]
  const globalAllowed = ALLOWED_ATTRS['*']

  if (!tagAllowed?.has(lowerName) && !globalAllowed?.has(lowerName)) {
    return null
  }

  // Block event handlers (onclick, onerror, etc.)
  if (lowerName.startsWith('on')) {
    return null
  }

  // Block dangerous protocols in href/src
  if ((lowerName === 'href' || lowerName === 'src') && DANGEROUS_PROTOCOLS.test(value)) {
    return null
  }

  // Force target="_blank" links to have rel="noopener noreferrer"
  if (lowerName === 'target' && value === '_blank') {
    return value
  }

  return value
}

export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Remove script, style, iframe, object, embed, form, input tags entirely (including content)
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^>]*\/?>/gi, '')
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')

  // Process remaining tags - strip disallowed tags but keep content, sanitize attributes on allowed tags
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)?\/?>/g, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase()

    if (!ALLOWED_TAGS.has(lowerTag)) {
      // Strip tag but keep content (closing tags just get removed)
      return ''
    }

    // It's a closing tag
    if (match.startsWith('</')) {
      return `</${lowerTag}>`
    }

    // Sanitize attributes
    const sanitizedAttrs: string[] = []
    const attrRegex = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrs || '')) !== null) {
      const attrName = attrMatch[1]
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? ''
      const sanitized = sanitizeAttribute(lowerTag, attrName, attrValue)
      if (sanitized !== null) {
        sanitizedAttrs.push(`${attrName.toLowerCase()}="${sanitized.replace(/"/g, '&quot;')}"`)
      }
    }

    // Force rel on links with target="_blank"
    if (lowerTag === 'a' && sanitizedAttrs.some(a => a.includes('target="_blank"'))) {
      if (!sanitizedAttrs.some(a => a.startsWith('rel='))) {
        sanitizedAttrs.push('rel="noopener noreferrer"')
      }
    }

    const selfClosing = match.endsWith('/>') ? ' /' : ''
    const attrStr = sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : ''
    return `<${lowerTag}${attrStr}${selfClosing}>`
  })

  return clean
}
