import { describe, test, expect } from "vitest"
import { sanitiseHTML } from "../../src/utils/sanitise.js"

describe("sanitiseHTML", () => {
  test("removes script tags", () => {
    const raw = '<p>Hello</p><script>alert("xss")</script>'

    expect(sanitiseHTML(raw)).not.toContain("<script>")
    expect(sanitiseHTML(raw)).toContain("<p>Hello</p>")
  })

  test("keeps allowed tags", () => {
    const raw = "<p>hello</p><strong>world</strong><code>test</code>"

    const result = sanitiseHTML(raw)

    expect(result).toContain("<p>hello</p>")
    expect(result).toContain("<strong>world</strong>")
    expect(result).toContain("<code>test</code>")
  })

  test("removes javascript hrefs", () => {
    const raw = '<a href="javascript:alert(1)">click</a>'

    const result = sanitiseHTML(raw)

    expect(result).not.toContain("javascript:")
  })

  test("keeps valid https links", () => {
    const raw = '<a href="https://github.com">Github</a>'

    const result = sanitiseHTML(raw)

    expect(result).toContain('href="https://github.com"')
  })

  test("adds target blank to links", () => {
    const raw = '<a href="https://github.com">Github</a>'

    const result = sanitiseHTML(raw)

    expect(result).toContain('target="_blank"')
  })

  test("adds rel noopener noreferrer to links", () => {
    const raw = '<a href="https://github.com">Github</a>'

    const result = sanitiseHTML(raw)

    expect(result).toContain('rel="noopener noreferrer"')
  })

  test("removes disallowed tags", () => {
    const raw = "<div>Hello</div><p>World</p>"

    const result = sanitiseHTML(raw)

    expect(result).not.toContain("<div>")
    expect(result).toContain("<p>World</p>")
  })

  test("handles empty input", () => {
    expect(sanitiseHTML("")).toBe("")
  })
})