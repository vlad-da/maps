import MapLibreMap from "./MapLibreMap";

function WrapMapLibre() {
  const cities = [
    {
      id: "moscow",
      coordinates: [37.6173, 55.7558],
      label: "Москва",
      content: "Россия",
      color: "#FF6B6B",
    },
    {
      id: "london",
      coordinates: [-0.1276, 51.5072],
      label: "Лондон",
      content: "Великобритания",
      color: "#4ECDC4",
    },
    {
      id: "ny",
      coordinates: [-74.006, 40.7128],
      label: "Нью-Йорк",
      content: "США",
      color: "#45B7D1",
    },
    {
      id: "paris",
      coordinates: [2.3522, 48.8566],
      label: "Париж",
      content: "Франция",
      color: "#96CEB4",
    },
    {
      id: "tokyo",
      coordinates: [139.6503, 35.6762],
      label: "Токио",
      content: "Япония",
      color: "#FFEAA7",
    },
    {
      id: "sydney",
      coordinates: [151.2093, -33.8688],
      label: "Сидней",
      content: "Австралия",
      color: "#DDA0DD",
    },
    {
      id: "rio",
      coordinates: [-43.1729, -22.9068],
      label: "Рио",
      content: "Бразилия",
      color: "#98D8C8",
    },
    {
      id: "cairo",
      coordinates: [31.2357, 30.0444],
      label: "Каир",
      content: "Египет",
      color: "#F7DC6F",
    },
    {
      id: "delhi",
      coordinates: [77.1025, 28.7041],
      label: "Дели",
      content: "Индия",
      color: "#BB8FCE",
    },
    {
      id: "beijing",
      coordinates: [116.4074, 39.9042],
      label: "Пекин",
      content: "Китай",
      color: "#85C1E9",
    },
  ];

  const connections = [
    { from: "moscow", to: "london" },
    { from: "moscow", to: "ny" },
    { from: "london", to: "ny" },
    { from: "paris", to: "tokyo" },
    { from: "ny", to: "sydney" },
    { from: "tokyo", to: "sydney" },
    { from: "rio", to: "london" },
    { from: "cairo", to: "delhi" },
    { from: "beijing", to: "ny" },
    { from: "delhi", to: "tokyo" },
    { from: "paris", to: "cairo" },
    { from: "moscow", to: "beijing" },
  ];

  return (
    <div
      style={{
        width: "1440px",
        height: "100vh",
        padding: "20px",
        backgroundColor: "#0a1525",
        background: "linear-gradient(135deg, #0a1525 0%, #1a2c4d 100%)",
      }}
    >
      <div
        style={{
          height: "calc(100vh - 40px)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        <MapLibreMap
          points={cities}
          connections={connections}
          darkMode={true}
          showParabolicCurves={true}
          center={[0, 30]}
          zoom={2}
        />
      </div>
    </div>
  );
}

export default WrapMapLibre;
