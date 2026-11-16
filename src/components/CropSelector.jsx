function CropSelector({ crops, selectedCropId, onSelect }) {
  return (
    <div className="crop-selector">
      <label htmlFor="crop-choice">Choose a crop</label>
      <select
        id="crop-choice"
        value={selectedCropId}
        onChange={(event) => onSelect(event.target.value)}
      >
        <option value="">Select a crop</option>
        {crops.map((crop) => (
          <option key={crop.id} value={crop.id}>{crop.name}</option>
        ))}
      </select>
    </div>
  );
}

export default CropSelector;
