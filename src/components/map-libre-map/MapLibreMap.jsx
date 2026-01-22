import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";

// Цветовая палитра для стрелок
const DEFAULT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#76D7C4",
  "#F1948A",
  "#85C1E9",
  "#D7BDE2",
  "#F9E79F",
  "#ABEBC6",
  "#EDBB99",
  "#A569BD",
  "#5DADE2",
];

const MapLibreOceanMap = ({
  points = [],
  connections = [],
  arrowColors = DEFAULT_COLORS,
  showLabels = true,
  center = [0, 20],
  zoom = 2,
  darkMode = true,
  showParabolicCurves = true,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // Расчет параболической кривой (дуги)
  const calculateParabolicCurve = (
    from,
    to,
    steps = 20,
    heightFactor = 0.3,
  ) => {
    const coordinates = [];
    const [lng1, lat1] = from;
    const [lng2, lat2] = to;

    const midLng = (lng1 + lng2) / 2;
    const midLat = (lat1 + lat2) / 2;

    // Высота дуги
    const distance = Math.sqrt(
      Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2),
    );
    const height = distance * heightFactor;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Квадратичная кривая Безье
      const lng =
        Math.pow(1 - t, 2) * lng1 +
        2 * (1 - t) * t * midLng +
        Math.pow(t, 2) * lng2;

      const lat =
        Math.pow(1 - t, 2) * lat1 +
        2 * (1 - t) * t * (midLat + height) +
        Math.pow(t, 2) * lat2;

      coordinates.push([lng, lat]);
    }

    return coordinates;
  };

  // Создание маркера с кастомным HTML
  const createCustomMarker = (point, color = "#1890ff") => {
    const el = document.createElement("div");
    el.className = "custom-marker";

    el.innerHTML = `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `;

    el.style.width = "24px";
    el.style.height = "24px";

    return el;
  };

  // Добавление параболической стрелки
  const addParabolicArrow = (from, to, color, id) => {
    if (!map.current) return;

    const curvePoints = calculateParabolicCurve(from, to, 30, 0.3);

    // Добавляем источник данных
    map.current.addSource(`arrow-${id}`, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: curvePoints,
        },
      },
    });

    // Добавляем линию с градиентом
    map.current.addLayer({
      id: `arrow-line-${id}`,
      type: "line",
      source: `arrow-${id}`,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 3,
        "line-opacity": 0.8,
        "line-gradient": [
          "interpolate",
          ["linear"],
          ["line-progress"],
          0,
          color,
          1,
          color,
        ],
      },
    });

    // Добавляем наконечник стрелки
    const lastPoint = curvePoints[curvePoints.length - 1];
    const secondLastPoint = curvePoints[curvePoints.length - 2];

    const arrowEl = document.createElement("div");
    arrowEl.className = "arrow-head";
    arrowEl.innerHTML = `
      <div style="
        width: 0;
        height: 0;
        border-left: 12px solid ${color};
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
      "></div>
    `;

    const arrowMarker = new maplibregl.Marker({
      element: arrowEl,
      anchor: "center",
      rotationAlignment: "map",
    })
      .setLngLat(lastPoint)
      .addTo(map.current);

    // Поворачиваем наконечник
    const dx = lastPoint[0] - secondLastPoint[0];
    const dy = lastPoint[1] - secondLastPoint[1];
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    arrowEl.style.transform = `rotate(${angle}deg)`;

    return arrowMarker;
  };

  // Инициализация карты
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Стили карты (темная тема с голубыми материками)
    const mapStyle = darkMode
      ? {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm-tiles",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        }
      : "https://demotiles.maplibre.org/style.json";

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    // Добавляем элементы управления
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(new maplibregl.ScaleControl(), "bottom-left");

    map.current.on("load", () => {
      setMapLoaded(true);

      // Добавляем точки
      points.forEach((point, index) => {
        const markerColor =
          point.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        const markerEl = createCustomMarker(point, markerColor);

        const marker = new maplibregl.Marker({
          element: markerEl,
          anchor: "center",
        })
          .setLngLat([point.coordinates[0], point.coordinates[1]])
          .addTo(map.current);

        // Добавляем всплывающее окно
        if (point.content || point.label) {
          const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: false,
          }).setHTML(`
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">
                ${point.label || point.id}
              </h3>
              ${point.content ? `<p style="margin: 0; color: #666; font-size: 12px;">${point.content}</p>` : ""}
            </div>
          `);

          marker.setPopup(popup);
        }

        markersRef.current.push(marker);
      });

      // Добавляем соединения
      connections.forEach((connection, index) => {
        const fromPoint = findPointById(connection.from);
        const toPoint = findPointById(connection.to);

        if (!fromPoint || !toPoint) return;

        const arrowColor = getArrowColor(index);

        if (showParabolicCurves) {
          // Параболическая стрелка
          const arrowMarker = addParabolicArrow(
            [fromPoint.coordinates[0], fromPoint.coordinates[1]],
            [toPoint.coordinates[0], toPoint.coordinates[1]],
            arrowColor,
            `${connection.from}-${connection.to}`,
          );

          markersRef.current.push(arrowMarker);
        } else {
          // Прямая линия
          map.current.addSource(`line-${connection.from}-${connection.to}`, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [fromPoint.coordinates[0], fromPoint.coordinates[1]],
                  [toPoint.coordinates[0], toPoint.coordinates[1]],
                ],
              },
            },
          });

          map.current.addLayer({
            id: `line-${connection.from}-${connection.to}`,
            type: "line",
            source: `line-${connection.from}-${connection.to}`,
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": arrowColor,
              "line-width": 2,
              "line-opacity": 0.7,
              "line-dasharray": [2, 2],
            },
          });
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Обновляем точки при изменении пропсов
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Удаляем старые маркеры
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Удаляем старые слои линий
    connections.forEach((connection) => {
      const lineId = `line-${connection.from}-${connection.to}`;
      const arrowLineId = `arrow-line-${connection.from}-${connection.to}`;
      const arrowSourceId = `arrow-${connection.from}-${connection.to}`;

      if (map.current.getLayer(lineId)) {
        map.current.removeLayer(lineId);
      }
      if (map.current.getSource(lineId)) {
        map.current.removeSource(lineId);
      }
      if (map.current.getLayer(arrowLineId)) {
        map.current.removeLayer(arrowLineId);
      }
      if (map.current.getSource(arrowSourceId)) {
        map.current.removeSource(arrowSourceId);
      }
    });

    // Добавляем новые точки и соединения (код аналогичный выше)
  }, [points, connections, mapLoaded]);

  return (
    <div
      style={{
        position: "relative",
        width: "80%",
        height: "600px",
        display: "block",
        backgroundColor: "#0a1f44",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
        overflow: "hidden",
      }}
    >
      {/* Градиентный фон */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, #0a1f44 0%, #1a3a6d 100%)`,
          zIndex: 0,
        }}
      />

      {/* Контейнер для карты */}
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Легенда */}
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
            zIndex: 1000,
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

      {/* Информация */}
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
          zIndex: 1000,
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

      {/* Заголовок */}
      <div
        style={{
          position: "absolute",
          top: 25,
          left: 25,
          right: 25,
          textAlign: "center",
          zIndex: 1000,
        }}
      >
        <h1
          style={{
            color: "#FFFFFF",
            fontSize: "28px",
            fontWeight: "700",
            margin: 0,
            textShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            letterSpacing: "1px",
          }}
        >
          Карта соединений (MapLibre)
        </h1>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "16px",
            margin: "8px 0 0 0",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
          }}
        >
          {showParabolicCurves ? "Параболические стрелки" : "Прямые соединения"}
        </p>
      </div>

      {/* Стили */}
      <style>{`
        .maplibregl-popup-content {
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          padding: 0 !important;
          overflow: hidden;
        }
        
        .maplibregl-popup-close-button {
          font-size: 18px;
          padding: 4px 8px;
        }
        
        .custom-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        
        .arrow-head {
          z-index: 10;
        }
        
        .maplibregl-ctrl-group {
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
          overflow: hidden;
        }
        
        .maplibregl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
        }
        
        .maplibregl-ctrl-group button:hover {
          background: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default MapLibreOceanMap;
