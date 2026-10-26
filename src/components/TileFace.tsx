interface Props {
  symbol: string;
  name: string;
}

/** Contenido de una ficha: símbolo químico y nombre del elemento. */
export function TileFace({ symbol, name }: Props) {
  return (
    <>
      <span className="tile-symbol" aria-hidden="true">
        {symbol}
      </span>
      <span className="tile-name">{name}</span>
    </>
  );
}
