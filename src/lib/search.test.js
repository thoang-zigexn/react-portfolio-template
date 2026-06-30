import { describe, it, expect } from 'vitest'
import { searchProjects } from './search.js'

const ITEMS = [
    {
        locales: {
            title: 'ChatGPT',
            text: 'AI chatbot developed by OpenAI.',
            tags: ['AI', 'LLM', 'OpenAI'],
        },
    },
    {
        locales: {
            title: 'Docker',
            text: 'Containerization platform for developers.',
            tags: ['DevOps', 'Containers', 'Cloud'],
        },
    },
    {
        locales: {
            title: 'GitHub',
            text: 'Code hosting and version control platform.',
            tags: ['Git', 'CI/CD', 'Open Source'],
        },
    },
]

describe('searchProjects', () => {
    it('query rỗng → trả về toàn bộ danh sách', () => {
        expect(searchProjects(ITEMS, '')).toEqual(ITEMS)
    })

    it('query chỉ khoảng trắng → trả về toàn bộ danh sách', () => {
        expect(searchProjects(ITEMS, '   ')).toEqual(ITEMS)
    })

    it('match theo title (case-insensitive)', () => {
        const result = searchProjects(ITEMS, 'docker')
        expect(result).toHaveLength(1)
        expect(result[0].locales.title).toBe('Docker')
    })

    it('match theo text/description', () => {
        const result = searchProjects(ITEMS, 'version control')
        expect(result).toHaveLength(1)
        expect(result[0].locales.title).toBe('GitHub')
    })

    it('match theo tags', () => {
        const result = searchProjects(ITEMS, 'llm')
        expect(result).toHaveLength(1)
        expect(result[0].locales.title).toBe('ChatGPT')
    })

    it('match substring (không cần khớp nguyên từ)', () => {
        const result = searchProjects(ITEMS, 'tain') // "Containerization" / "Containers"
        expect(result).toHaveLength(1)
        expect(result[0].locales.title).toBe('Docker')
    })

    it('không khớp gì → trả về mảng rỗng', () => {
        expect(searchProjects(ITEMS, 'python')).toEqual([])
    })

    it('project thiếu field không crash', () => {
        const items = [
            { locales: { title: 'OnlyTitle' } },          // không có text/tags
            { locales: {} },                               // locales rỗng
            {},                                            // không có locales
            { locales: { tags: ['Edge'] } },               // chỉ có tags
        ]
        expect(() => searchProjects(items, 'edge')).not.toThrow()
        const result = searchProjects(items, 'edge')
        expect(result).toHaveLength(1)
        expect(result[0].locales.tags).toContain('Edge')
    })

    it('input không phải mảng → ném TypeError', () => {
        expect(() => searchProjects(null, 'x')).toThrow(TypeError)
        expect(() => searchProjects(undefined, 'x')).toThrow(TypeError)
        expect(() => searchProjects({}, 'x')).toThrow(TypeError)
        expect(() => searchProjects('nope', 'x')).toThrow(TypeError)
    })
})
