export function timeAgo(unixTs) {
    const current = Date.now()
    const sec = Math.floor(current / 1000)
    const diff = sec - unixTs
    if (diff <= 0) return "just now"
    if (diff < 60) return "just now"
    if (60 <= diff && diff < 3600) {
        const minutes = diff / 60
        return `${Math.floor(minutes)}m ago`
    }
    if (3600 <= diff && diff < 86400) {
        const hours = diff / 3600
        return `${Math.floor(hours)}h ago`
    }
    if (86400 <= diff) {
        const days = diff / 86400
        return `${Math.floor(days)}d ago`
    }
}


export function parseDomain(url) {
    if (url === null || url === undefined) {
        return null
    }
    try {
        const hostname = new URL(url).hostname
        const cleanHostname = hostname.replace(/^www\./, '')
        return cleanHostname
    }
    catch {
        return null
    }
}
