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
