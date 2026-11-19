// TM2. props { label, value }. Renders one <dt>/<dd> pair, so use it inside a <dl>.
export default function CropFact({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value === null || value === undefined || value === "" ? "not stated" : value}</dd>
    </>
  );
}
