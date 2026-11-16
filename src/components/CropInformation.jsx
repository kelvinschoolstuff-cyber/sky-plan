function CropInformation({ crop }) {
  if (!crop) {
    return <p>Select a crop to view the information currently verified for it.</p>;
  }

  const facts = [
    ["Growing duration", crop.growingDuration],
    ["Suitable temperature", crop.suitableTemperature],
    ["Rainfall needs", crop.rainfallRequirements],
    ["Soil", crop.soilRequirements],
    ["Water", crop.waterRequirements],
  ];

  return (
    <article className="crop-information" aria-labelledby="crop-information-title">
      <h2 id="crop-information-title">{crop.name}</h2>
      <dl>
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h3>Basic management practices</h3>
      {crop.managementPractices.length > 0 ? (
        <ul>
          {crop.managementPractices.map((practice) => <li key={practice}>{practice}</li>)}
        </ul>
      ) : (
        <p>Unavailable until a crop-specific source is verified.</p>
      )}
      <p><strong>Source review:</strong> {crop.verificationStatus}</p>
      <h3>Sources</h3>
      <ul>
        {crop.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>
            {source.publicationDate && <span> ({source.publicationDate})</span>}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default CropInformation;
