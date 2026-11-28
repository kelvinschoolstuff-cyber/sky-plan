import { useCallback, useEffect, useState } from "react";
import {
  createPlantingPlan,
  deletePlantingPlan,
  getPlantingPlans,
  updatePlantingPlan,
} from "../services/PlantingPlansApi";
import { getFarms } from "../services/FarmsApi";
import { getCrops } from "../services/CropApi";

const PLANS_PER_PAGE = 10;

const emptyForm = {
  farm_id: "",
  crop_id: "",
  season: "",
  planting_date: "",
  expected_harvest_date: "",
  acreage: "",
  status: "planned",
  notes: "",
};

function PlantingPlans() {
  const [plans, setPlans] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [plansResponse, farmsResponse, cropsResponse] = await Promise.all([
        getPlantingPlans({ page, per_page: PLANS_PER_PAGE }),
        getFarms(),
        getCrops(),
      ]);

      const loadedPlans = plansResponse.data || [];

      // Deleting the last plan on a page leaves it empty: go back one page.
      if (loadedPlans.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }

      setPlans(loadedPlans);
      setPagination(
        plansResponse.pagination || {
          page,
          pages: 1,
          total: loadedPlans.length,
        },
      );
      setFarms(farmsResponse.data || []);
      setCrops(cropsResponse.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  function goToPage(nextPage) {
    setError("");
    setMessage("");
    setLoading(true);
    setPage(nextPage);
  }

  useEffect(() => {
    // Loads data after mount; state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

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
      const { farm_id, ...planData } = formData;

      const payload = {
        ...planData,
        crop_id: Number(planData.crop_id),
        acreage: Number(planData.acreage),
      };

      let response;

      if (editingPlanId) {
        response = await updatePlantingPlan(editingPlanId, payload);
      } else {
        response = await createPlantingPlan(farm_id, payload);
      }

      setMessage(response.message || "Planting plan saved successfully.");
      setFormData(emptyForm);
      setEditingPlanId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(plan) {
    setEditingPlanId(plan.id);

    setFormData({
      farm_id: String(plan.farm_id),
      crop_id: String(plan.crop_id),
      season: plan.season || "",
      planting_date: plan.planting_date || "",
      expected_harvest_date: plan.expected_harvest_date || "",
      acreage: String(plan.acreage ?? ""),
      status: plan.status || "planned",
      notes: plan.notes || "",
    });

    setMessage("");
    setError("");
  }

  async function handleDelete(planId) {
    if (
      !window.confirm("Are you sure you want to delete this planting plan?")
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await deletePlantingPlan(planId);
      setMessage(response.message || "Planting plan deleted successfully.");

      if (editingPlanId === planId) {
        setEditingPlanId(null);
        setFormData(emptyForm);
      }

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancelEdit() {
    setEditingPlanId(null);
    setFormData(emptyForm);
    setError("");
    setMessage("");
  }

  function getCropName(cropId) {
    return crops.find((crop) => crop.id === cropId)?.name || `Crop #${cropId}`;
  }

  function getFarmName(farmId) {
    return farms.find((farm) => farm.id === farmId)?.name || `Farm #${farmId}`;
  }

  return (
    <section className="page-section">
      <h2>My Planting Plans</h2>
      <p>Create and manage your planting plans</p>

      {error && <p role="alert">{error}</p>}
      {message && <p role="alert">{message}</p>}

      <h3>{editingPlanId ? "Edit Planting Plan" : "Create planting Plan"}</h3>

      {farms.length === 0 && !loading ? (
        <p>Register a farm before creating a planting plan.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="plan-farm">Farm</label>
            <select
              id="plan-farm"
              name="farm_id"
              value={formData.farm_id}
              onChange={handleChange}
              disabled={Boolean(editingPlanId)}
              required
            >
              <option value="">Select a Farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="plan-crop">Crop</label>
            <select
              id="plan-crop"
              name="crop_id"
              value={formData.crop_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a Crop</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="plan-season">Season</label>
            <input
              id="plan-season"
              name="season"
              value={formData.season}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="plan-planting-date">Planting Date</label>
            <input
              id="plan-planting-date"
              name="planting_date"
              type="date"
              value={formData.planting_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="plan-harvest-date">Expected Harvest Date</label>
            <input
              id="plan-harvest-date"
              name="expected_harvest_date"
              type="date"
              value={formData.expected_harvest_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="plan-acreage">Acreage</label>
            <input
              id="plan-acreage"
              name="acreage"
              type="number"
              min="0.01"
              step="any"
              value={formData.acreage}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="plan-status">Status</label>
            <select
              id="plan-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="harvested">Harvested</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="plan-notes">Notes (optional)</label>
            <textarea
              id="plan-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingPlanId
                ? "Update Plan"
                : "Create Plan"}
          </button>

          {editingPlanId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </form>
      )}

      <h3>Existing Planting plans</h3>

      {loading ? (
        <p>Loading planting plans...</p>
      ) : plans.length === 0 ? (
        <p>No planting plans Found.</p>
      ) : (
        <div>
          {plans.map((plan) => (
            <article key={plan.id}>
              <h4>
                {getCropName(plan.crop_id)} - {getFarmName(plan.farm_id)}
              </h4>
              <p>Season: {plan.season}</p>
              <p>Planting Date: {plan.planting_date}</p>
              <p>Expected Harvest: {plan.expected_harvest_date}</p>
              <p>Acreage: {plan.acreage}</p>
              <p>Status: {plan.status}</p>
              {plan.notes && <p>Notes: {plan.notes}</p>}

              <button type="button" onClick={() => handleEdit(plan)}>
                Edit
              </button>

              <button type="button" onClick={() => handleDelete(plan.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <nav aria-label="Planting plan pages">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>

          <span>
            {" "}
            Page {pagination.page} of {pagination.pages}{" "}
          </span>

          <button
            type="button"
            disabled={page >= pagination.pages || loading}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}

export default PlantingPlans;
