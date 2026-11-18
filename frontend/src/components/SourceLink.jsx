// TM1. props { name, url }. Always opens in a new tab; shows plain text when there is no URL.
export default function SourceLink({ name, url }) {
  if (!name) return null;
  return url ? <a className="source" href={url} target="_blank" rel="noreferrer">{name}</a> : <span className="source">{name}</span>;
}
