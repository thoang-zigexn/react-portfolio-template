/**
 * Strip HTML tags from a string.
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '')
}

/**
 * Filter portfolio items by a free-text query.
 * Checks title, description text, and tags (all case-insensitive, HTML stripped).
 *
 * @param {Array<{locales: {title: string, text: string, tags: string[]}}>} items
 * @param {string} query
 * @returns {Array}
 */
export function filterItemsBySearch(items, query) {
    const q = query.trim().toLowerCase()
    if (!q) return items

    return items.filter(item => {
        const title = stripHtml(item.locales?.title || '').toLowerCase()
        const text  = stripHtml(item.locales?.text  || '').toLowerCase()
        const tags  = (item.locales?.tags || []).join(' ').toLowerCase()

        return title.includes(q) || text.includes(q) || tags.includes(q)
    })
}
