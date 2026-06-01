import { describe, test, expect, beforeEach, vi } from "vitest"
import { openComments, closeComments, renderComment } from "../../src/ui/comments.js"

vi.mock("../../src/api/items.js")
vi.mock("../../src/store/store.js")

import { getItem, getItemsKeepOrder } from "../../src/api/items.js"
import { getState, setState, cacheItem, getCached } from "../../src/store/store.js"

function setupDOM() {
    document.body.innerHTML = `
    <div id="feed"></div>
    <aside id="comment-panel" class="hidden"></aside>
    <h2 id="comment-title"></h2>
    <div id="comment-meta"></div>
    <div id="comment-text"></div>
    <div id="comments-container"></div>
    <div id="comment-loader" class="hidden"></div>
    <button id="close-comments"></button>
    <a id="comment-original-link"></a>
  `
}

const baseStory = {
    id: 1,
    type: "story",
    title: "Test Story",
    url: "https://example.com",
    by: "user1",
    time: 1700000000,
    score: 100,
    descendants: 2,
    kids: [10, 11],
}

const baseComment = {
    id: 10,
    type: "comment",
    by: "commenter1",
    time: 1700000100,
    text: "<p>Hello</p>",
    parent: 1,
}

describe("renderComment", () => {
    beforeEach(() => {
        setupDOM()
        vi.clearAllMocks()
        getItemsKeepOrder.mockResolvedValue([])
    })

    test("returned element has data-depth attribute equal to depth param", () => {
        const el = renderComment(baseComment, 2)

        expect(el.dataset.depth).toBe("2")
    })

    test("caps data-depth attribute at 3", () => {
        const el = renderComment(baseComment, 5)

        expect(el.dataset.depth).toBe("3")
    })

    test("renders deleted placeholder when item is null", () => {
        const el = renderComment(null, 0)

        expect(el.textContent).toContain("[deleted]")
    })

    test("renders deleted placeholder when item.deleted is true", () => {
        const el = renderComment({ ...baseComment, deleted: true }, 0)

        expect(el.textContent).toContain("[deleted]")
    })

    test("renders deleted placeholder when item.dead is true", () => {
        const el = renderComment({ ...baseComment, dead: true }, 0)

        expect(el.textContent).toContain("[deleted]")
    })

    test("renders comment text for a valid item", () => {
        const el = renderComment(baseComment, 0)

        expect(el.innerHTML).toContain("Hello")
    })

    test("does not crash when item has no kids", () => {
        const { kids, ...noKids } = baseComment

        expect(() => renderComment(noKids, 0)).not.toThrow()
    })

    test("does not call getItemsKeepOrder when kids array is empty", () => {
        renderComment({ ...baseComment, kids: [] }, 0)

        expect(getItemsKeepOrder).not.toHaveBeenCalled()
    })

    test("data-depth of exactly 3 is not capped further", () => {
        const el = renderComment(baseComment, 3)

        expect(el.dataset.depth).toBe("3")
    })
})

describe("openComments", () => {
    beforeEach(() => {
        setupDOM()
        vi.clearAllMocks()
        getCached.mockReturnValue(null)
        getItem.mockResolvedValue(baseStory)
        getItemsKeepOrder.mockResolvedValue([baseComment])
        getState.mockReturnValue({ openStoryId: null })
    })

    test("calls cacheItem for every fetched item", async () => {
        await openComments(1)

        expect(cacheItem).toHaveBeenCalledWith(baseStory.id, baseStory)
    })

    test("uses getCached before falling back to getItem", async () => {
        getCached.mockReturnValue(baseStory)

        await openComments(1)

        expect(getItem).not.toHaveBeenCalled()
    })

    test("calls getItem when cache misses", async () => {
        getCached.mockReturnValue(null)

        await openComments(1)

        expect(getItem).toHaveBeenCalledWith(1)
    })

    test("sets state.openStoryId to storyId", async () => {
        await openComments(1)

        expect(setState).toHaveBeenCalledWith(expect.objectContaining({ openStoryId: 1 }))
    })

    test("populates comment-title with story title", async () => {
        await openComments(1)

        expect(document.getElementById("comment-title").textContent).toContain("Test Story")
    })

    test("does not crash when story has no kids", async () => {
        const { kids, ...noKids } = baseStory
        getItem.mockResolvedValue(noKids)

        await expect(openComments(1)).resolves.not.toThrow()
        expect(document.getElementById("comments-container").innerHTML).toBe("")
    })

    test("does not crash when story has no url", async () => {
        const { url, ...noUrl } = baseStory
        getItem.mockResolvedValue(noUrl)

        await expect(openComments(1)).resolves.not.toThrow()
    })

    test("does not crash when story has no text", async () => {
        const { text, ...noText } = baseStory
        getItem.mockResolvedValue(noText)

        await expect(openComments(1)).resolves.not.toThrow()
    })
})

describe("closeComments", () => {
    beforeEach(() => {
        setupDOM()
        vi.clearAllMocks()
        getState.mockReturnValue({ openStoryId: 1 })
    })

    test("sets state.openStoryId to null", () => {
        closeComments()

        expect(setState).toHaveBeenCalledWith(expect.objectContaining({ openStoryId: null }))
    })

    test("hides the comment panel", () => {
        document.getElementById("comment-panel").classList.remove("hidden")

        closeComments()

        expect(document.getElementById("comment-panel").classList.contains("hidden")).toBe(true)
    })

    test("clears active state from all comments-btn elements", () => {
        document.body.innerHTML += `
      <button class="comments-btn active" data-id="1"></button>
      <button class="comments-btn active" data-id="2"></button>
    `

        closeComments()

        const btns = document.querySelectorAll(".comments-btn.active")
        expect(btns.length).toBe(0)
    })

    test("does not crash when no comments-btn elements exist", () => {
        expect(() => closeComments()).not.toThrow()
    })

    test("does not crash when openStoryId is already null", () => {
        getState.mockReturnValue({ openStoryId: null })

        expect(() => closeComments()).not.toThrow()
    })
})