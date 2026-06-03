import { getItem, getItemsKeepOrder } from '../api/items.js'
import { getState, setState, cacheItem, getCached } from '../store/store.js'
import { timeAgo, parseDomain } from '../utils/time.js'
import { sanitiseHTML } from '../utils/sanitise.js'

export async function openComments(storyId) {
    const panel = document.getElementById('comment-panel')
    const loader = document.getElementById('comment-loader')
    const title = document.getElementById('comment-title')
    const meta = document.getElementById('comment-meta')
    const text = document.getElementById('comment-text')
    const container = document.getElementById('comments-container')
    const link = document.getElementById('comment-original-link')

    setState({ openStoryId: storyId })

    panel.classList.remove('hidden')
    loader.classList.remove('hidden')
    container.innerHTML = ''

    let story = getCached(storyId)
    if (!story) {
        story = await getItem(storyId)
        if (story) cacheItem(story.id, story)
    }

    title.textContent = story?.title ?? ''
    meta.textContent = story
        ? `${story.score ?? 0} points by ${story.by} ${timeAgo(story.time)}`
        : ''
    text.innerHTML = story?.text ? sanitiseHTML(story.text) : ''

    if (link) {
        if (story?.url) {
            link.href = story.url
            link.textContent = parseDomain(story.url) ?? story.url
            link.classList.remove('hidden')
        } else {
            link.classList.add('hidden')
        }
    }

    if (story?.kids?.length) {
        const kids = await getItemsKeepOrder(story.kids)
        const sorted = [...kids].sort((a, b) => {
            if (!a) return 1
            if (!b) return -1
            return b.time - a.time
        })
        for (const kid of sorted) {
            container.appendChild(renderComment(kid, 0))
        }
    }

    loader.classList.add('hidden')
}

export function closeComments() {
    const panel = document.getElementById('comment-panel')

    panel.classList.add('hidden')
    setState({ openStoryId: null })

    document.querySelectorAll('.comments-btn').forEach(btn => {
        btn.classList.remove('active')
    })
}

export function renderComment(item, depth) {
    const cappedDepth = Math.min(depth, 3)
    const el = document.createElement('div')
    el.classList.add('comment')
    el.dataset.depth = String(cappedDepth)
    el.style.marginLeft = `${cappedDepth * 16}px`

    if (!item || item.deleted || item.dead) {
        el.classList.add('comment--deleted')
        el.textContent = '[deleted]'
        return el
    }

    const header = document.createElement('div')
    header.classList.add('comment__header')
    header.textContent = `${item.by} — ${timeAgo(item.time)}`

    const body = document.createElement('div')
    body.classList.add('comment__body')
    body.innerHTML = sanitiseHTML(item.text ?? '')

    el.appendChild(header)
    el.appendChild(body)

    if (item.kids?.length) {
        getItemsKeepOrder(item.kids).then(kids => {
            const sorted = [...kids].sort((a, b) => {
                if (!a) return 1
                if (!b) return -1
                return b.time - a.time
            })
            for (const kid of sorted) {
                el.appendChild(renderComment(kid, depth + 1))
            }
        })
    }

    return el
}