import React, { useMemo, useState, useEffect } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { line, curveBasis } from "d3-shape";
import { feature } from "topojson-client";
import worldData from "../../world-110m.json";

/* ======================
   Хук размеров окна
====================== */
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

/* ======================
   Компонент карты
====================== */
export default function AtlasMap({ routes }) {
  const { width, height } = useWindowSize();

  // 🌍 Проекция
  const projection = useMemo(
    () =>
      geoMercator()
        .scale(width / 6)
        .translate([width / 2, height / 1.5]),
    [width, height],
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  // 🌐 Земля
  const land = useMemo(() => feature(worldData, worldData.objects.land), []);

  // ✏️ Генератор кривых
  const curvedLine = useMemo(
    () =>
      line()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(curveBasis),
    [],
  );

  // ➰ Построение дуги
  const buildArc = (from, to) => {
    const source = projection([from.lon, from.lat]);
    const target = projection([to.lon, to.lat]);
    if (!source || !target) return null;

    const midX = (source[0] + target[0]) / 2;
    const midY = (source[1] + target[1]) / 2 - height / 8;

    return curvedLine([source, [midX, midY], target]);
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "1440px",
        height: "600px",
        background: "#0a2a43",
        display: "block",
      }}
    >
      {/* 🔺 Наконечник стрелки */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="4"
          markerHeight="4"
          refX="3.5"
          refY="2"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 4 2 L 0 4 z" fill="red" />
        </marker>
      </defs>

      {/* 🌍 Земля */}
      <g>
        {land.features.map((geo, i) => (
          <path
            key={i}
            d={pathGenerator(geo)}
            fill="#5dade2"
            stroke="#0a2a43"
            strokeWidth={0.4}
          />
        ))}
      </g>

      {/* 📍 Города */}
      <g>
        {routes.map((r, i) => {
          const from = projection([r.from.lon, r.from.lat]);
          const to = projection([r.to.lon, r.to.lat]);
          if (!from || !to) return null;

          return (
            <g key={i}>
              <circle
                cx={from[0]}
                cy={from[1]}
                r={4}
                fill="#00e5ff"
                stroke="#0a2a43"
                strokeWidth={1.5}
              />
              <circle
                cx={to[0]}
                cy={to[1]}
                r={4}
                fill="#ff5252"
                stroke="#0a2a43"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </g>

      {/* ✈️ Маршруты */}
      <g>
        {routes.map((r, i) => {
          const d = buildArc(r.from, r.to);
          if (!d) return null;

          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={r.color || "#ffffff"}
              strokeWidth={8}
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </g>
    </svg>
  );
}
