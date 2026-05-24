// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { filterItemsBySearch } from '../hooks/utils/portfolioSearch.js'

// Helper: build a minimal item shaped like ArticleItemDataWrapper
const item = (title, text, tags) => ({
    locales: { title, text, tags }
})

const ITEMS = [
    item('React App', 'A frontend web application.', ['React', 'JavaScript']),
    item('Python CLI Tool', 'A command-line utility script.', ['Python', 'CLI']),
    item('<strong>Vue</strong> Dashboard', 'Data <em>visualization</em> panel.', ['Vue', 'Charts']),
]

describe('filterItemsBySearch', () => {
    it('returns all items when query is empty', () => {
        expect(filterItemsBySearch(ITEMS, '')).toHaveLength(3)
    })

    it('filters by title match (case-insensitive)', () => {
        const result = filterItemsBySearch(ITEMS, 'react')
        expect(result).toHaveLength(1)
        expect(result[0].locales.title).toBe('React App')
    })

    it('filters by tag match', () => {
        const result = filterItemsBySearch(ITEMS, 'python')
        expect(result).toHaveLength(1)
        expect(result[0].locales.title).toBe('Python CLI Tool')
    })

    it('filters by description match (strips HTML)', () => {
        const result = filterItemsBySearch(ITEMS, 'visualization')
        expect(result).toHaveLength(1)
        expect(result[0].locales.tags).toContain('Charts')
    })

    it('returns empty array when nothing matches', () => {
        expect(filterItemsBySearch(ITEMS, 'xyzzy-no-match')).toHaveLength(0)
    })
})
