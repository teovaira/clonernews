import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { timeAgo, parseDomain } from "../../src/utils/time.js"

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("returns just now when difference is under 60 seconds", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(timeAgo(now - 30)).toBe("just now")
  })

  test("returns just now at 59 seconds", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(timeAgo(now - 59)).toBe("just now")
  })

  test("returns 1m ago exactly at 60 seconds", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(timeAgo(now - 60)).toBe("1m ago")
  })

  test("returns 1m ago for 90 seconds difference", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(timeAgo(now - 90)).toBe("1m ago")
  })

  test("returns 1h ago at 3600 seconds", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(timeAgo(now - 3600)).toBe("1h ago")
  })

  test("returns 1d ago at 86400 seconds", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(timeAgo(now - 86400)).toBe("1d ago")
  })
})

describe("parseDomain", () => {
  test("extracts domain and removes www", () => {
    expect(
      parseDomain("https://www.github.com/test")
    ).toBe("github.com")
  })

  test("returns domain without changing non-www urls", () => {
    expect(
      parseDomain("https://news.ycombinator.com")
    ).toBe("news.ycombinator.com")
  })

  test("returns null for null input", () => {
    expect(parseDomain(null)).toBe(null)
  })

  test("returns null for undefined input", () => {
    expect(parseDomain(undefined)).toBe(null)
  })

  test("returns null for malformed url", () => {
    expect(parseDomain("not-a-url")).toBe(null)
  })
})