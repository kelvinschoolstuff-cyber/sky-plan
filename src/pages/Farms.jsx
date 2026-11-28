import { useCallback, useEffect, useState } from "react";

import {
  createFarm,
  deleteFarm,
  getFarms,
  updateFarm,
} from "../services/FarmsApi";

const emptyForm = {
  name: "",
  location: "",
  county: "",
  agroecological_zone: "",
};

function Farms() {
  const [farms, setFarms] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFarms = useCallback(async () => {
    try {
      const response = await getFarms();
      setFarms(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loads data after mount; state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFarms();
  }, [loadFarms]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      let response;

      if (editingFarmId) {
        response = await updateFarm(editingFarmId, formData);
      } else {
        response = await createFarm(formData);
      }

      setMessage(response.message || "Farm saved successfully.");
      setFormData(emptyForm);
      setEditingFarmId(null);
      await loadFarms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(farm) {
    setEditingFarmId(farm.id);
    setFormData({
      name: farm.name || "",
      location: farm.location || "",
      county: farm.county || "",
      agroecological_zone: farm.agroecological_zone || "",
    });

    setMessage("");
    setError("");
  }

  async function handleDelete(farmId) {
    if (!window.confirm("Are you sure you want to delete this farm?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await deleteFarm(farmId);

      setMessage(response.message || "Farm deleted successfully.");

      if (editingFarmId === farmId) {
        setEditingFarmId(null);
        setFormData(emptyForm);
      }

      await loadFarms();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancelEdit() {
    setEditingFarmId(null);
    setFormData(emptyForm);
    setError("");
    setMessage("");
  }

  return (
    <section className="page-section">
      <h2>My Farms</h2>
      <p>Manage your registered Farms.</p>

      {error && <p role="alert">{error}</p>}
      {message && <p role="alert">{message}</p>}

      <h3>{editingFarmId ? "Edit Farm" : "Register a Farm"}</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="farm-name">Farm Name</label>
          <input
            id="farm-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={120}
          />
        </div>

        <div>
          <label htmlFor="farm-location">Location</label>
          <input
            id="farm-location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            maxLength={150}
          />
        </div>

        <div>
          <label htmlFor="farm-county">County</label>
          <input
            id="farm-county"
            name="county"
            value={formData.county}
            onChange={handleChange}
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="farm-zone">Agroecological Zone (optional)</label>
          <input
            id="farm-zone"
            name="agroecological_zone"
            value={formData.agroecological_zone}
            onChange={handleChange}
            maxLength={120}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : editingFarmId
              ? "Update Farm"
              : "Register Farm"}
        </button>

        {editingFarmId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <h3>Registered Farms</h3>

      {loading ? (
        <p>Loading Farms...</p>
      ) : farms.length === 0 ? (
        <p>You have not registered any farms yet.</p>
      ) : (
        <div>
          {farms.map((farm) => (
            <article key={farm.id}>
              <h4>{farm.name}</h4>
              <p>Location: {farm.location}</p>
              <p>County: {farm.county}</p>
              <p>
                Agroecological Zone:{" "}
                {farm.agroecological_zone || "Not specified"}
              </p>

              <button type="button" onClick={() => handleEdit(farm)}>
                Edit
              </button>

              <button type="button" onClick={() => handleDelete(farm.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Farms;
