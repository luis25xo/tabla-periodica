import { memo, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { getElement } from '../data/elements';
import type { ElementId } from '../data/types';
import { searchElements } from '../utils/search';

interface Props {
  placedSet: ReadonlySet<ElementId>;
  selectedId: ElementId | null;
  disabled: boolean;
  /** Toma el elemento del mostrador y lo deja en el soporte de selección. */
  onPick: (id: ElementId) => void;
}

/** Buscador de elementos (combobox accesible) por nombre o símbolo químico. */
export const ElementSearch = memo(function ElementSearch({ placedSet, selectedId, disabled, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = useMemo(() => searchElements(query), [query]);
  const showList = open && query.trim() !== '';

  const pick = (id: ElementId) => {
    if (placedSet.has(id)) return;
    onPick(id);
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const id = results[active];
      if (showList && id) pick(id);
    } else if (event.key === 'Escape' && query) {
      event.preventDefault();
      event.stopPropagation();
      setQuery('');
      setOpen(false);
    }
  };

  return (
    <div className="search" data-testid="element-search">
      <span className="search-icon" aria-hidden="true" />
      <input
        type="search"
        className="search-input"
        placeholder="Buscar elemento…"
        aria-label="Buscar elemento por nombre o símbolo"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${results[active]}` : undefined}
        value={query}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="search-results" id={listId} role="listbox" aria-label="Resultados de la búsqueda">
          {results.length === 0 && <li className="search-empty">Ningún elemento coincide.</li>}
          {results.map((id, i) => {
            const element = getElement(id)!;
            const placed = placedSet.has(id);
            return (
              <li
                key={id}
                id={`${listId}-${id}`}
                role="option"
                aria-selected={i === active}
                aria-disabled={placed}
                className={`search-option${i === active ? ' is-active' : ''}${placed ? ' is-placed' : ''}`}
                data-element-id={id}
                // mousedown en lugar de click para que el campo no pierda el foco antes de elegir.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(id);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="search-symbol">{element.symbol}</span>
                <span className="search-name">{element.name}</span>
                {placed && <span className="search-status">Colocado</span>}
                {!placed && id === selectedId && <span className="search-status search-status--selected">Seleccionado</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
