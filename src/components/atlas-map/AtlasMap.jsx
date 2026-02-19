import { useMemo, useState, useEffect } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "../../map/countries/countries-50m.json";
import Arrow from "../arrow/arrow";

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () =>
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

function curvedPath(from, to) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  const cx = (from[0] + to[0]) / 2 - dy * 0.25;
  const cy = (from[1] + to[1]) / 2 + dx * 0.25;

  return `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`;
}

// Функция для определения цвета страны на основе количества атак
function getCountryColor(attackCount, maxAttacks) {
  if (attackCount === 0) return "#4a5568"; // серый для неактивных
  const intensity = Math.min(attackCount / maxAttacks, 1);
  // От желтого к красному в зависимости от интенсивности
  return `hsl(${20 + (1 - intensity) * 20}, 100%, ${40 + intensity * 20}%)`;
}

// Компонент тултипа
function Tooltip({ data, position }) {
  if (!data) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: position.x + 10,
        top: position.y + 10,
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #444",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        zIndex: 1000,
        pointerEvents: "none",
        maxWidth: "400px",
        fontSize: "12px",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", color: "#ff6b6b" }}>
        {data.fromCountry} → {data.toCountry}
      </h4>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #444" }}>
            <th style={{ textAlign: "left", padding: "4px" }}>Дата/время</th>
            <th style={{ textAlign: "left", padding: "4px" }}>Файл</th>
            <th style={{ textAlign: "left", padding: "4px" }}>Тип</th>
            <th style={{ textAlign: "left", padding: "4px" }}>Организация</th>
          </tr>
        </thead>
        <tbody>
          {data.files.map((file, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #333" }}>
              <td style={{ padding: "4px" }}>{file.timestamp}</td>
              <td style={{ padding: "4px" }}>{file.name}</td>
              <td style={{ padding: "4px" }}>{file.type}</td>
              <td style={{ padding: "4px" }}>{file.organization}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Компонент фильтров
function Filters({ onFilterChange, organizations }) {
  const [timeRange, setTimeRange] = useState("today");
  const [selectedOrg, setSelectedOrg] = useState("all");

  const handleTimeChange = (e) => {
    setTimeRange(e.target.value);
    onFilterChange({ timeRange: e.target.value, organization: selectedOrg });
  };

  const handleOrgChange = (e) => {
    setSelectedOrg(e.target.value);
    onFilterChange({ timeRange, organization: e.target.value });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        zIndex: 100,
        border: "1px solid #444",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>Временной диапазон:</label>
        <select
          value={timeRange}
          onChange={handleTimeChange}
          style={{
            background: "#333",
            color: "white",
            border: "1px solid #555",
            padding: "5px",
            borderRadius: "4px",
          }}
        >
          <option value="today">Сегодня</option>
          <option value="yesterday">Вчера</option>
          <option value="30days">30 дней</option>
          <option value="1year">1 год</option>
          <option value="all">Все время</option>
        </select>
      </div>
      <div>
        <label style={{ marginRight: "10px" }}>Организация:</label>
        <select
          value={selectedOrg}
          onChange={handleOrgChange}
          style={{
            background: "#333",
            color: "white",
            border: "1px solid #555",
            padding: "5px",
            borderRadius: "4px",
          }}
        >
          <option value="all">Все организации</option>
          {organizations.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AtlasMap({ initialRoutes = [] }) {
  const { width, height } = useWindowSize();
  const [routes, setRoutes] = useState(initialRoutes);
  const [tooltip, setTooltip] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [filters, setFilters] = useState({
    timeRange: "today",
    organization: "all",
  });
  const [attackStats, setAttackStats] = useState({});

  // Анимация появления
  useEffect(() => {
    // Сначала показываем карту
    setTimeout(() => setShowMap(true), 500);
    // Потом показываем маршруты
    setTimeout(() => setShowRoutes(true), 1500);
  }, []);

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(width / 6)
        .translate([width / 2, height / 1.5]),
    [width, height]
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const land = useMemo(
    () => feature(worldData, worldData.objects.countries),
    []
  );

  // Получение списка организаций для фильтра
  const organizations = useMemo(() => {
    const orgs = new Set();
    routes.forEach((route) => {
      if (route.toOrg) orgs.add(route.toOrg);
    });
    return Array.from(orgs);
  }, [routes]);

  // Обновление статистики атак
  useEffect(() => {
    const stats = {};
    routes.forEach((route) => {
      const fromCountry = route.from.country_name;
      stats[fromCountry] = (stats[fromCountry] || 0) + 1;
    });
    setAttackStats(stats);
  }, [routes]);

  // Максимальное количество атак для градиента
  const maxAttacks = Math.max(...Object.values(attackStats), 1);

  // Симуляция получения новых данных (для демонстрации)
  useEffect(() => {
    const interval = setInterval(() => {
      // Здесь будет реальный запрос к API
      // fetchNewData().then(newRoutes => setRoutes(newRoutes));
    }, 30000); // Опрос каждые 30 секунд

    return () => clearInterval(interval);
  }, []);

  // Фильтрация маршрутов
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      if (filters.organization !== "all" && route.toOrg !== filters.organization) {
        return false;
      }
      // Здесь добавить фильтрацию по времени
      return true;
    });
  }, [routes, filters]);

  // Обработчик для "северного полюса" (default position)
  const getDefaultPosition = () => {
    return projection([0, 90]); // Северный полюс
  };

  const handleRouteMouseEnter = (event, routeData) => {
    setTooltip({
      position: { x: event.clientX, y: event.clientY },
      data: routeData,
    });
  };

  const handleRouteMouseLeave = () => {
    setTooltip(null);
  };

  const handleMouseMove = (event) => {
    if (tooltip) {
      setTooltip({
        ...tooltip,
        position: { x: event.clientX, y: event.clientY },
      });
    }
  };

  return (
    <div style={{ position: "relative" }} onMouseMove={handleMouseMove}>
      <Filters onFilterChange={setFilters} organizations={organizations} />

      <svg
        width={width}
        height={height}
        style={{
          width: "1440px",
          height: "600px",
          background: "#0a2a43",
          display: "block",
          transition: "opacity 0.5s ease-in-out",
          opacity: showMap ? 1 : 0,
        }}
      >
        {/* Земля */}
        <g>
          {land.features.map((geo, i) => {
            const countryName = geo.properties.name || `country-${i}`;
            const attackCount = attackStats[countryName] || 0;
            const fillColor = showMap 
              ? getCountryColor(attackCount, maxAttacks)
              : "#4a5568";

            return (
              <path
                key={`country-${i}`}
                d={pathGenerator(geo)}
                fill={fillColor}
                stroke="#1a365d"
                strokeWidth={0.4}
                className="country"
                data-country={countryName}
                style={{
                  transition: "fill 0.3s ease-in-out",
                }}
              />
            );
          })}
        </g>

        {/* Маршруты */}
        {showRoutes &&
          filteredRoutes.map((r, i) => {
            let from, to;

            if (!r.from.lon || !r.from.lat) {
              from = getDefaultPosition();
            } else {
              from = projection([r.from.lon, r.from.lat]);
            }

            if (!r.to.lon || !r.to.lat) {
              to = getDefaultPosition();
            } else {
              to = projection([r.to.lon, r.to.lat]);
            }

            if (!from || !to) return null;

            // Если источник и цель в одной стране, рисуем с северного полюса
            if (r.from.country_name === r.to.country_name) {
              from = getDefaultPosition();
            }

            const pathId = `route-${i}`;
            const d = curvedPath(from, to);
            
            // Толщина линии зависит от количества атак
            const strokeWidth = 2.5 + (attackStats[r.from.country_name] || 0) * 0.5;

            return (
              <g
                key={i}
                onMouseEnter={(e) => handleRouteMouseEnter(e, r)}
                onMouseLeave={handleRouteMouseLeave}
              >
                <circle cx={from[0]} cy={from[1]} r={4} fill="#fff" />
                <circle cx={to[0]} cy={to[1]} r={4} fill="#fff" />

                <path
                  id={pathId}
                  d={d}
                  fill="none"
                  stroke={r.color || "#ff6b6b"}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="1000"
                    to="0"
                    dur="3s"
                    fill="freeze"
                    begin="0s"
                  />
                </path>

                <Arrow pathId={pathId} color={r.color || "#ff6b6b"} duration="1s" />
              </g>
            );
          })}
      </svg>

      <Tooltip data={tooltip?.data} position={tooltip?.position || { x: 0, y: 0 }} />
    </div>
  );
}