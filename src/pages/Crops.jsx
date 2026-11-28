import { useEffect, useState } from "react";
import { getCrops } from "../services/CropApi";

function Crops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCrops() {
      try {
        const result = await getCrops();
        setCrops(result.data || []);
      } catch (err) {
        setError(err.message || "Unable to load crop information.");
      } finally {
        setLoading(false);
      }
    }

    fetchCrops();
  }, []);

  return (
    <section className="page-section">
      <h2>Crop information</h2>
      <p>Explore crop information and growing requirements.</p>

      {loading && <p>Loading crops...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && crops.length === 0 && (
        <p>No crop information is currently available.</p>
      )}

      {!loading && !error && crops.length > 0 && (
        <div className="crop-list">
          {crops.map((crop) => (
            <article className="crop-card" key={crop.id}>
              <h3>{crop.name}</h3>
              {crop.description && <p>{crop.description}</p>}

              <p>
                <strong>Growing duration:</strong>{" "}
                {crop.growing_duration || "Not available"}
              </p>
              <p>
                <strong>Suitable temperature:</strong>{" "}
                {crop.suitable_temperature || "Not available"}
              </p>
              <p>
                <strong>Rainfall requirements:</strong>{" "}
                {crop.rainfall_requirements || "Not available"}
              </p>
              <p>
                <strong>Soil requirements:</strong>{" "}
                {crop.soil_requirements || "Not available"}
              </p>
              <p>
                <strong>Water requirements:</strong>{" "}
                {crop.water_requirements || "Not available"}
              </p>
              <p>
                <strong>Management practices:</strong>{" "}
                {crop.management_practices || "Not available"}
              </p>

              {crop.disclaimer && <small>{crop.disclaimer}</small>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export default Crops;
