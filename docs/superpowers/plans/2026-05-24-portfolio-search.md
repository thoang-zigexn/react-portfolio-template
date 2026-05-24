# Portfolio Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a debounced, accessible search bar to the Portfolio section that filters by title, tags, and description within the active category, with an empty state and unit tests.

**Architecture:** Extract a pure `filterItemsBySearch` function (no React deps, easy to test), render a `PortfolioSearchBar` component as a child of the existing `Article` wrapper (between CategoryFilter and the project grid), and manage raw + debounced query state in `ArticlePortfolio`. Unit tests cover the pure function directly — no DOM needed for the required test cases.

**Tech Stack:** Vite 6, React 18, Vitest, @testing-library/react, @testing-library/jest-dom, jsdom

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/hooks/utils/portfolioSearch.js` | Pure `filterItemsBySearch(items, query)` function |
| Create | `src/components/articles/partials/PortfolioSearchBar.jsx` | Search input UI: icon, input, clear button, ARIA |
| Modify | `src/components/articles/ArticlePortfolio.jsx` | Search state, debounce, wire-up, empty state |
| Modify | `src/components/articles/ArticlePortfolio.scss` | Styles for search bar and empty state |
| Modify | `vite.config.js` | Add `test` block for Vitest |
| Modify | `package.json` | Add dev deps + `"test"` script |
| Create | `src/tests/setup.js` | `@testing-library/jest-dom` import for Vitest |
| Create | `src/tests/portfolioSearch.test.js` | 4 unit tests |

---

## Task 1: Install Vitest + React Testing Library

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/tests/setup.js`

- [ ] **Step 1: Install test dependencies**

```bash
cd /home/thoangnn/portfolio/react-portfolio-template
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: clean install, no peer dep errors.

- [ ] **Step 2: Add test config to `vite.config.js`**

Replace the entire file with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/react-portfolio-template/',
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('swiper')) return 'swiper'
                        return
                    }
                }
            }
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ["mixed-decls", "color-functions", "global-builtin", "import"],
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/tests/setup.js'],
    },
})
```

- [ ] **Step 3: Create `src/tests/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add `"test"` script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

So scripts becomes:

```json
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "resume:make:article": "node npm/npm-resume-new-article.js",
    "resume:clear": "node npm/npm-resume-clear.js"
}
```

- [ ] **Step 5: Verify Vitest starts (no tests yet — that is fine)**

```bash
npm test
```

Expected output: something like `No test files found` or `0 tests run`. It must not crash with a config error.

- [ ] **Step 6: Commit**

```bash
git add vite.config.js package.json package-lock.json src/tests/setup.js
git commit -m "chore: add Vitest + React Testing Library for unit tests"
```

---

## Task 2: Pure search filter function + failing tests

**Files:**
- Create: `src/hooks/utils/portfolioSearch.js`
- Create: `src/tests/portfolioSearch.test.js`

- [ ] **Step 1: Write the failing tests first**

Create `src/tests/portfolioSearch.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { filterItemsBySearch } from '../hooks/utils/portfolioSearch.js'

// Helper: build a minimal item shaped like ArticleItemDataWrapper.locales
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
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: `FAIL src/tests/portfolioSearch.test.js` — `Cannot find module '../hooks/utils/portfolioSearch.js'`

- [ ] **Step 3: Create `src/hooks/utils/portfolioSearch.js`**

```js
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
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npm test
```

Expected:
```
✓ src/tests/portfolioSearch.test.js (5)
  ✓ returns all items when query is empty
  ✓ filters by title match (case-insensitive)
  ✓ filters by tag match
  ✓ filters by description match (strips HTML)
  ✓ returns empty array when nothing matches

Test Files  1 passed (1)
Tests       5 passed (5)
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/utils/portfolioSearch.js src/tests/portfolioSearch.test.js
git commit -m "feat: add filterItemsBySearch pure function with unit tests"
```

---

## Task 3: PortfolioSearchBar component

**Files:**
- Create: `src/components/articles/partials/PortfolioSearchBar.jsx`

- [ ] **Step 1: Create `src/components/articles/partials/PortfolioSearchBar.jsx`**

```jsx
import React, { useRef } from 'react'

/**
 * Search bar for the portfolio section.
 *
 * @param {string}   value     Current raw input value
 * @param {Function} onChange  Called with the new string on every keystroke
 * @param {Function} onClear   Called when the × button is clicked
 */
function PortfolioSearchBar({ value, onChange, onClear }) {
    const inputRef = useRef(null)

    const handleClear = () => {
        onClear()
        inputRef.current?.focus()
    }

    return (
        <div className="portfolio-search-bar" role="search">
            {/* Visually hidden label satisfies accessibility requirement */}
            <label htmlFor="portfolio-search-input" className="visually-hidden">
                Search projects by title, tag, or description
            </label>

            <div className="portfolio-search-bar-inner">
                <i className="portfolio-search-bar-icon fa-solid fa-magnifying-glass"
                   aria-hidden="true"/>

                <input
                    ref={inputRef}
                    id="portfolio-search-input"
                    type="search"
                    className="portfolio-search-bar-input text-3"
                    placeholder="Search by title, tag, or description..."
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                />

                {value && (
                    <button
                        type="button"
                        className="portfolio-search-bar-clear"
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true"/>
                    </button>
                )}
            </div>
        </div>
    )
}

export default PortfolioSearchBar
```

- [ ] **Step 2: Run tests again to confirm nothing broke**

```bash
npm test
```

Expected: 5 passing, same as before.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/partials/PortfolioSearchBar.jsx
git commit -m "feat: add PortfolioSearchBar component"
```

---

## Task 4: Wire search into ArticlePortfolio

**Files:**
- Modify: `src/components/articles/ArticlePortfolio.jsx`

- [ ] **Step 1: Replace the contents of `ArticlePortfolio.jsx`**

```jsx
import "./ArticlePortfolio.scss"
import React, { useEffect, useState } from 'react'
import Article from "/src/components/articles/base/Article.jsx"
import Transitionable from "/src/components/capabilities/Transitionable.jsx"
import { useViewport } from "/src/providers/ViewportProvider.jsx"
import { useConstants } from "/src/hooks/constants.js"
import AvatarView from "/src/components/generic/AvatarView.jsx"
import { Tag, Tags } from "/src/components/generic/Tags.jsx"
import ArticleItemPreviewMenu from "/src/components/articles/partials/ArticleItemPreviewMenu.jsx"
import { useLanguage } from "/src/providers/LanguageProvider.jsx"
import PortfolioSearchBar from "/src/components/articles/partials/PortfolioSearchBar.jsx"
import { filterItemsBySearch } from "/src/hooks/utils/portfolioSearch.js"

/**
 * @param {ArticleDataWrapper} dataWrapper
 * @param {Number} id
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolio({ dataWrapper, id }) {
    const [selectedItemCategoryId, setSelectedItemCategoryId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    // Debounce: wait 300 ms after user stops typing before filtering
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const clearSearch = () => setSearchQuery('')

    return (
        <Article id={dataWrapper.uniqueId}
                 type={Article.Types.SPACING_DEFAULT}
                 dataWrapper={dataWrapper}
                 className={`article-portfolio`}
                 selectedItemCategoryId={selectedItemCategoryId}
                 setSelectedItemCategoryId={setSelectedItemCategoryId}>

            {/* ARIA live region — screen readers announce result count changes */}
            <div aria-live="polite" aria-atomic="true" className="visually-hidden">
                {debouncedQuery
                    ? `${filterItemsBySearch(dataWrapper.getOrderedItemsFilteredBy(selectedItemCategoryId), debouncedQuery).length} results for ${debouncedQuery}`
                    : ''}
            </div>

            <PortfolioSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
            />

            <ArticlePortfolioItems
                dataWrapper={dataWrapper}
                selectedItemCategoryId={selectedItemCategoryId}
                searchQuery={debouncedQuery}
                onClearSearch={clearSearch}
            />
        </Article>
    )
}

/**
 * @param {ArticleDataWrapper} dataWrapper
 * @param {String} selectedItemCategoryId
 * @param {String} searchQuery  Debounced query string
 * @param {Function} onClearSearch
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItems({ dataWrapper, selectedItemCategoryId, searchQuery, onClearSearch }) {
    const constants = useConstants()
    const language = useLanguage()
    const viewport = useViewport()

    const categoryFilteredItems = dataWrapper.getOrderedItemsFilteredBy(selectedItemCategoryId)
    const filteredItems = filterItemsBySearch(categoryFilteredItems, searchQuery)

    const customBreakpoint = viewport.getCustomBreakpoint(constants.SWIPER_BREAKPOINTS_FOR_THREE_SLIDES)
    const itemsPerRow = customBreakpoint?.slidesPerView || 1
    const itemsPerRowClass = `article-portfolio-items-${itemsPerRow}-per-row`

    const refreshFlag = dataWrapper.categories?.length
        ? `${selectedItemCategoryId}-${language.getSelectedLanguage()?.id}-${searchQuery}`
        : `${language.getSelectedLanguage()?.id}-${searchQuery}`

    // Empty state: query matched nothing
    if (filteredItems.length === 0 && searchQuery) {
        return (
            <div className="portfolio-search-empty">
                <i className="fa-solid fa-magnifying-glass portfolio-search-empty-icon" aria-hidden="true"/>
                <p className="text-3">
                    No projects found for <strong>"{searchQuery}"</strong>.
                </p>
                <button type="button"
                        className="portfolio-search-empty-reset text-3"
                        onClick={onClearSearch}>
                    Clear search
                </button>
            </div>
        )
    }

    if (dataWrapper.categories?.length) {
        return (
            <Transitionable id={dataWrapper.uniqueId}
                            refreshFlag={refreshFlag}
                            delayBetweenItems={100}
                            animation={Transitionable.Animations.POP}
                            className={`article-portfolio-items ${itemsPerRowClass}`}>
                {filteredItems.map((itemWrapper, key) => (
                    <ArticlePortfolioItem itemWrapper={itemWrapper}
                                          key={key}/>
                ))}
            </Transitionable>
        )
    }
    else {
        return (
            <div className={`article-portfolio-items ${itemsPerRowClass} mb-3 mb-lg-2`}>
                {filteredItems.map((itemWrapper, key) => (
                    <ArticlePortfolioItem itemWrapper={itemWrapper}
                                          key={key}/>
                ))}
            </div>
        )
    }
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItem({ itemWrapper }) {
    return (
        <div className={`article-portfolio-item`}>
            <AvatarView src={itemWrapper.img}
                        faIcon={itemWrapper.faIcon}
                        style={itemWrapper.faIconStyle}
                        alt={itemWrapper.imageAlt}
                        className={`article-portfolio-item-avatar`}/>

            <ArticlePortfolioItemTitle itemWrapper={itemWrapper}/>
            <ArticlePortfolioItemBody itemWrapper={itemWrapper}/>
            <ArticlePortfolioItemFooter itemWrapper={itemWrapper}/>
        </div>
    )
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItemTitle({ itemWrapper }) {
    return (
        <div className={`article-portfolio-item-title`}>
            <h5 className={`article-portfolio-item-title-main`}
                dangerouslySetInnerHTML={{__html: itemWrapper.locales.title || itemWrapper.placeholder}}/>

            <div className={`article-portfolio-item-title-category text-2`}
                 dangerouslySetInnerHTML={{__html: itemWrapper.category?.label }}/>
        </div>
    )
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItemBody({ itemWrapper }) {
    return (
        <div className={`article-portfolio-item-body`}>
            <Tags className={`article-portfolio-item-body-tags`}>
                {itemWrapper.locales.tags && Boolean(itemWrapper.locales.tags.length) && itemWrapper.locales.tags.map((tag, key) => (
                    <Tag key={key}
                         text={tag}
                         variant={Tag.Variants.DARK}
                         className={`article-portfolio-item-body-tag text-1`}/>
                ))}
            </Tags>

            <div className={`article-portfolio-item-body-description text-2`}
                 dangerouslySetInnerHTML={{__html: itemWrapper.locales.text}}/>
        </div>
    )
}

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 * @constructor
 */
function ArticlePortfolioItemFooter({ itemWrapper }) {
    const hasPreview = itemWrapper.preview
    const hasPreviewLinks = itemWrapper.preview?.hasLinks
    const hasScreenshotsOrVideo = itemWrapper.preview?.hasScreenshotsOrYoutubeVideo

    const previewMenuAvailable = hasPreview && (hasPreviewLinks || hasScreenshotsOrVideo)
    if (!previewMenuAvailable)
        return <></>

    return (
        <div className={`article-portfolio-item-footer`}>
            <ArticleItemPreviewMenu itemWrapper={itemWrapper}
                                    spaceBetween={true}
                                    className={`article-portfolio-item-footer-menu`}/>
        </div>
    )
}

export default ArticlePortfolio
```

- [ ] **Step 2: Run tests to confirm they still pass**

```bash
npm test
```

Expected: 5 passing.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/ArticlePortfolio.jsx
git commit -m "feat: wire search state and debounce into ArticlePortfolio"
```

---

## Task 5: Search bar and empty state styles

**Files:**
- Modify: `src/components/articles/ArticlePortfolio.scss`

- [ ] **Step 1: Append the following to the end of `ArticlePortfolio.scss`**

```scss
/** --------- PORTFOLIO SEARCH BAR --------- */
div.portfolio-search-bar {
    margin-bottom: 16px;
    width: 100%;

    div.portfolio-search-bar-inner {
        position: relative;
        display: flex;
        align-items: center;
        background-color: var(--theme-boards-background);
        border: 1px solid var(--theme-borders);
        border-radius: $standard-border-radius;
        padding: 0 12px;
        transition: border-color 0.15s ease;

        &:focus-within {
            border-color: var(--theme-primary);
        }
    }

    .portfolio-search-bar-icon {
        color: var(--theme-texts-light-2);
        font-size: 0.8rem;
        margin-right: 10px;
        flex-shrink: 0;
    }

    .portfolio-search-bar-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--theme-texts);
        padding: 10px 0;

        &::placeholder {
            color: var(--theme-texts-light-2);
        }

        /* Hide the browser-native × that appears in webkit search inputs */
        &::-webkit-search-cancel-button {
            display: none;
        }
    }

    .portfolio-search-bar-clear {
        background: transparent;
        border: none;
        padding: 4px 6px;
        cursor: pointer;
        color: var(--theme-texts-light-2);
        font-size: 0.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        line-height: 1;

        &:hover {
            color: var(--theme-texts);
            background-color: var(--theme-borders);
        }
    }
}

/** --------- PORTFOLIO EMPTY STATE --------- */
div.portfolio-search-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 20px;
    color: var(--theme-texts-light-1);

    .portfolio-search-empty-icon {
        font-size: 2rem;
        margin-bottom: 16px;
        opacity: 0.35;
    }

    p {
        margin-bottom: 16px;

        strong {
            color: var(--theme-texts);
        }
    }

    button.portfolio-search-empty-reset {
        background: transparent;
        border: 1px solid var(--theme-borders);
        border-radius: $standard-border-radius;
        color: var(--theme-primary);
        cursor: pointer;
        padding: 7px 18px;

        &:hover {
            background-color: var(--theme-borders);
        }
    }
}
```

- [ ] **Step 2: Verify dev server compiles without SCSS errors**

```bash
npm run dev
```

Open the Portfolio section and confirm: search bar appears, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/ArticlePortfolio.scss
git commit -m "feat: add search bar and empty state styles"
```

---

## Task 6: Manual smoke test + final commit

- [ ] **Step 1: Verify all required behaviors in the browser**

Run `npm run dev` and navigate to the Portfolio section. Check each item:

| # | Behavior | Pass? |
|---|----------|-------|
| 1 | Search bar appears between category buttons and grid | ☐ |
| 2 | Typing filters by title (try "react") | ☐ |
| 3 | Typing filters by tag (try a tag from portfolio.json) | ☐ |
| 4 | Typing filters by description text | ☐ |
| 5 | Switching category while search is active — only current category's items shown | ☐ |
| 6 | No flicker on each keystroke — waits ~300 ms | ☐ |
| 7 | × button appears only when input has text; clicking it clears and refocuses | ☐ |
| 8 | Empty state with "Clear search" button appears when nothing matches | ☐ |
| 9 | Search bar is full-width on mobile (resize browser < 576 px) | ☐ |
| 10 | Tab key reaches input, then × button; Enter on × clears search | ☐ |

- [ ] **Step 2: Run tests one final time**

```bash
npm test
```

Expected:
```
✓ src/tests/portfolioSearch.test.js (5)

Test Files  1 passed (1)
Tests       5 passed (5)
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: add portfolio search bar with debounce, empty state, and a11y"
```

---

## Self-Review Checklist

| Spec requirement | Covered by |
|-----------------|-----------|
| Match title, tags, description (case-insensitive) | `filterItemsBySearch` in Task 2 |
| Only show items in selected category | `getOrderedItemsFilteredBy` called before `filterItemsBySearch` in Task 4 |
| 300 ms debounce | `useEffect` + `setTimeout` in `ArticlePortfolio` Task 4 |
| Clear button (shows only when text present, focuses input) | `PortfolioSearchBar` Task 3 |
| Empty state with reset | `ArticlePortfolioItems` empty state in Task 4 |
| Accessible label + ARIA live region | `<label>` + `aria-live` in Tasks 3 & 4 |
| Full-width on mobile | `width: 100%` + `margin-bottom` in Task 5 SCSS |
| Unit test 1 — empty query shows all | `it('returns all items when query is empty')` Task 2 |
| Unit test 2 — title/tag/description match | 3 separate `it()` blocks Task 2 |
| Unit test 3 — no match → empty array | `it('returns empty array when nothing matches')` Task 2 |
| Unit test 4 (optional) clear button | Covered by integration (smoke test step) |
| `npm test` script | Task 1 |
