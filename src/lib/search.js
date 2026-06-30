/**
 * Pure search/filter logic for portfolio projects.
 *
 * Matches the real data shape used in ArticlePortfolio: each project carries a
 * `locales` object with `title`, `text` (description) and `tags` (array).
 * Match is case-insensitive substring across those three fields.
 *
 * @param {Array<Object>} projects - list of project items (each may have `locales`)
 * @param {String} query - search text
 * @return {Array<Object>} filtered projects (whole list when query is empty/whitespace)
 * @throws {TypeError} when `projects` is not an array
 */
export function searchProjects(projects, query) {
    if (!Array.isArray(projects)) {
        throw new TypeError("searchProjects: 'projects' must be an array")
    }

    const q = (query || "").trim().toLowerCase()
    if (!q) return projects

    return projects.filter(project => {
        const locales = project?.locales || {}
        const title = (locales.title || "").toLowerCase()
        const text = (locales.text || "").toLowerCase()
        const tags = (Array.isArray(locales.tags) ? locales.tags : []).join(" ").toLowerCase()

        return title.includes(q) || text.includes(q) || tags.includes(q)
    })
}
