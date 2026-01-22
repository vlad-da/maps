import React, { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";

const worldGeoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Цветовая палитра для стрелок (яркие цвета для контраста на темном фоне)
const DEFAULT_COLORS = [
  "#FF9E6D",
  "#6DFF9E",
  "#6DAFFF",
  "#FF6DAF",
  "#FFD46D",
  "#9E6DFF",
  "#6DFFED",
  "#FFB36D",
  "#6DFF80",
  "#AF6DFF",
  "#FF6D9E",
  "#80FF6D",
  "#FF8A6D",
  "#6DC8FF",
  "#FF6DE2",
  "#D4FF6D",
  "#FF6D80",
  "#6DFFD4",
  "#FFAF6D",
  "#C86DFF",
];

const OceanMap = ({
  points = [],
  connections = [],
  arrowColors = DEFAULT_COLORS,
  showLabels = true,
  oceanColor = "#0a1f44",
  landColor = "#4a90e2",
  landBorderColor = "#2a70c2",
}) => {
  // Функция для получения цвета стрелки
  const getArrowColor = (index) => {
    if (connections[index] && connections[index].color) {
      return connections[index].color;
    }
    return arrowColors[index % arrowColors.length];
  };

  // Находим точку по ID
  const findPointById = (id) => {
    return points.find((point) => point.id === id);
  };

  // Расчет позиции для наконечника стрелки
  const calculateArrowHeadPosition = (start, end, percentage = 0.85) => {
    return [
      start[0] + (end[0] - start[0]) * percentage,
      start[1] + (end[1] - start[1]) * percentage,
    ];
  };

  // Расчет угла для стрелки
  const calculateArrowAngle = (start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // Преобразуем точки в формат для Line
  const lineConnections = useMemo(() => {
    return connections
      .map((connection, index) => {
        const fromPoint = findPointById(connection.from);
        const toPoint = findPointById(connection.to);

        if (!fromPoint || !toPoint) return null;

        return {
          id: `line-${index}`,
          from: fromPoint.coordinates,
          to: toPoint.coordinates,
          color: getArrowColor(index),
          arrowHeadPosition: calculateArrowHeadPosition(
            fromPoint.coordinates,
            toPoint.coordinates,
            0.85,
          ),
          angle: calculateArrowAngle(
            fromPoint.coordinates,
            toPoint.coordinates,
          ),
          fromLabel: fromPoint.label || connection.from,
          toLabel: toPoint.label || connection.to,
        };
      })
      .filter(Boolean);
  }, [points, connections, arrowColors]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
        backgroundColor: oceanColor,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Градиентный фон для океана */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${oceanColor} 0%, #1a3a6d 100%)`,
          zIndex: 0,
        }}
      />

      {/* Звезды (опциональный эффект) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          opacity: 0.2,
          zIndex: 1,
        }}
      />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 150,
          center: [20, 30],
          rotate: [-10, 0, 0],
        }}
        style={{
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))",
        }}
      >
        {/* Материки с голубыми оттенками */}
        <Geographies geography={worldGeoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // Динамический голубой цвет с вариациями
              const continent = geo.properties.continent;
              let fillColor = landColor;
              let strokeColor = landBorderColor;

              // Добавляем небольшие вариации для разных материков
              if (continent === "Europe") fillColor = "#5a9ae2";
              else if (continent === "Asia") fillColor = "#4a8cd2";
              else if (continent === "Africa") fillColor = "#3a7cc2";
              else if (continent === "North America") fillColor = "#5a9ae2";
              else if (continent === "South America") fillColor = "#4a8ad2";
              else if (continent === "Australia") fillColor = "#5a9ae2";
              else if (continent === "Antarctica") fillColor = "#6aaaf2";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={0.8}
                  style={{
                    default: {
                      outline: "none",
                      transition: "all 0.3s ease",
                    },
                    hover: {
                      fill: "#6ab0f2",
                      stroke: "#3a7cc2",
                      strokeWidth: 1.2,
                      outline: "none",
                    },
                    pressed: {
                      fill: "#5aa0e2",
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Линии между точками с эффектом свечения */}
        {lineConnections.map((line, index) => (
          <g key={line.id}>
            {/* Эффект свечения */}
            <Line
              from={line.from}
              to={line.to}
              stroke={line.color}
              strokeWidth={4}
              strokeOpacity={0.2}
              strokeLinecap="round"
            />

            {/* Основная линия */}
            <Line
              from={line.from}
              to={line.to}
              stroke={line.color}
              strokeWidth={2.5}
              strokeOpacity={0.9}
              strokeLinecap="round"
            />

            {/* Наконечник стрелки */}
            <g
              transform={`translate(${line.arrowHeadPosition[0]}, ${line.arrowHeadPosition[1]})`}
            >
              <g transform={`rotate(${line.angle})`}>
                {/* Эффект свечения для наконечника */}
                <path
                  d="M0,0 L-12,-8 L-12,8 Z"
                  fill={line.color}
                  fillOpacity={0.3}
                  stroke="none"
                />
                {/* Основной наконечник */}
                <path
                  d="M0,0 L-10,-6 L-10,6 Z"
                  fill={line.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeOpacity={0.8}
                />
              </g>
            </g>

            {/* Начало стрелки с эффектом свечения */}
            <circle
              cx={line.from[0]}
              cy={line.from[1]}
              r={6}
              fill={line.color}
              fillOpacity={0.3}
              stroke="none"
            />
            <circle
              cx={line.from[0]}
              cy={line.from[1]}
              r={4}
              fill={line.color}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          </g>
        ))}

        {/* Точки на карте с эффектом свечения */}
        {points.map((point) => (
          <Marker key={point.id} coordinates={point.coordinates}>
            {/* Эффект свечения */}
            <circle
              r={12}
              fill={point.color || "#4ECDC4"}
              fillOpacity={0.2}
              stroke="none"
            />

            {/* Внешний кружок */}
            <circle
              r={8}
              fill={point.color || "#4ECDC4"}
              stroke="#FFFFFF"
              strokeWidth={2}
              style={{
                cursor: "pointer",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
              }}
            />

            {/* Внутренний кружок */}
            <circle r={4} fill="#FFFFFF" />

            {/* Подпись */}
            {showLabels && (
              <text
                textAnchor="middle"
                y={-18}
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "13px",
                  fontWeight: "bold",
                  fill: "#FFFFFF",
                  pointerEvents: "none",
                  textShadow: "0 2px 6px rgba(0, 0, 0, 0.8)",
                  paintOrder: "stroke",
                  stroke: "rgba(0, 0, 0, 0.5)",
                  strokeWidth: "3px",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                }}
              >
                {point.label || point.id}
              </text>
            )}

            {/* Всплывающая подсказка */}
            {point.content && <title>{point.content}</title>}
          </Marker>
        ))}
      </ComposableMap>

      {/* Легенда с темным фоном */}
      {connections.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 25,
            right: 25,
            backgroundColor: "rgba(10, 31, 68, 0.85)",
            padding: "18px 22px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            maxWidth: "320px",
            border: "1px solid rgba(74, 144, 226, 0.3)",
            backdropFilter: "blur(10px)",
            zIndex: 10,
          }}
        >
          <h4
            style={{
              margin: "0 0 15px 0",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            🌍 Маршруты соединений
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "220px",
              overflowY: "auto",
              paddingRight: "10px",
            }}
          >
            {connections.map((connection, index) => {
              const fromPoint = findPointById(connection.from);
              const toPoint = findPointById(connection.to);
              const arrowColor = getArrowColor(index);

              if (!fromPoint || !toPoint) return null;

              return (
                <div
                  key={`legend-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      backgroundColor: arrowColor,
                      borderRadius: "50%",
                      border: "2px solid white",
                      boxShadow: `0 0 8px ${arrowColor}`,
                    }}
                  />
                  <span
                    style={{
                      color: "#E0E0E0",
                      fontSize: "14px",
                      flex: 1,
                      fontWeight: "500",
                    }}
                  >
                    {fromPoint?.label || connection.from} →{" "}
                    {toPoint?.label || connection.to}
                  </span>
                  <div
                    style={{
                      width: "24px",
                      height: "3px",
                      backgroundColor: arrowColor,
                      borderRadius: "2px",
                      boxShadow: `0 0 6px ${arrowColor}`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Информация в левом нижнем углу */}
      <div
        style={{
          position: "absolute",
          bottom: 25,
          left: 25,
          backgroundColor: "rgba(10, 31, 68, 0.85)",
          padding: "15px 20px",
          borderRadius: "12px",
          fontSize: "14px",
          color: "#FFFFFF",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(74, 144, 226, 0.3)",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "5px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#4ECDC4",
              borderRadius: "50%",
              boxShadow: "0 0 6px #4ECDC4",
            }}
          />
          <span>
            Городов:{" "}
            <strong style={{ color: "#FFFFFF" }}>{points.length}</strong>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#FF9E6D",
              borderRadius: "50%",
              boxShadow: "0 0 6px #FF9E6D",
            }}
          />
          <span>
            Соединений:{" "}
            <strong style={{ color: "#FFFFFF" }}>{connections.length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default OceanMap;
