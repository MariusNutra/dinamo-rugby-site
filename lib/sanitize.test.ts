import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitize'

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('preserves safe formatting tags', () => {
    const out = sanitizeHtml('<p>hello <b>bold</b> <em>em</em></p>')
    expect(out).toContain('<p>')
    expect(out).toContain('<b>bold</b>')
    expect(out).toContain('<em>em</em>')
  })

  it('strips inline event handlers (onerror)', () => {
    const out = sanitizeHtml('<img src=x onerror=alert(1)>')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('alert')
  })

  it('strips javascript: protocol in href', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })

  it('neutralizes nested/broken script tags (regex-bypass payload)', () => {
    const out = sanitizeHtml('<scr<script>ipt>alert(1)</script>')
    expect(out.toLowerCase()).not.toContain('<script')
  })

  it('removes svg-based XSS vectors', () => {
    const out = sanitizeHtml('<svg/onload=alert(1)>')
    expect(out).not.toContain('onload')
    expect(out).not.toContain('<svg')
  })

  it('strips style attributes', () => {
    const out = sanitizeHtml('<div style="background:url(javascript:alert(1))">x</div>')
    expect(out).not.toContain('style')
    expect(out).not.toContain('javascript')
    expect(out).toContain('x')
  })

  it('removes iframe/object/embed tags entirely', () => {
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).not.toContain('<iframe')
    expect(sanitizeHtml('<object data="x"></object>')).not.toContain('<object')
    expect(sanitizeHtml('<embed src="x">')).not.toContain('<embed')
  })

  it('forces rel="noopener noreferrer" on target="_blank" links', () => {
    const out = sanitizeHtml('<a target="_blank" href="https://x.com">y</a>')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('keeps allowed image attributes but drops unknown ones', () => {
    const out = sanitizeHtml('<img src="/a.png" alt="a" width="10" data-evil="x">')
    expect(out).toContain('src="/a.png"')
    expect(out).toContain('alt="a"')
    expect(out).not.toContain('data-evil')
  })
})
