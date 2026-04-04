export default function NarrativeCard({ narrative }) {
  return (
    <div>
      <div className="card-title">Analysis</div>
      <p className="narrative-text">{narrative}</p>
    </div>
  );
}
