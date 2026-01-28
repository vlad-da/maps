import { useMemo, useState, useEffect } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "../../map/countries/countries-50m.json";
// import worldData from "../../map/countries/countries-110m.json";
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

/* ======================
   Кривая маршрута
====================== */
function curvedPath(from, to) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  const cx = (from[0] + to[0]) / 2 - dy * 0.25;
  const cy = (from[1] + to[1]) / 2 + dx * 0.25;

  return `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`;
}

function generateCountryColors(countries) {
  const colors = {};

  countries.features.forEach((country, index) => {
    const hue = (index * 137.508) % 360;
    const saturation = 60 + Math.random() * 30;
    const lightness = 40 + Math.random() * 30;

    colors[country.properties.name || `country-${index}`] =
      `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });

  return colors;
}

export default function AtlasMap({ routes }) {
  const { width, height } = useWindowSize();

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(width / 6)
        .translate([width / 2, height / 1.5]),
    [width, height],
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const land = useMemo(
    () => feature(worldData, worldData.objects.countries),
    [],
  );
  console.log(worldData.objects);
  const countryColors = useMemo(() => {
    if (!land) return {};
    return generateCountryColors(land);
  }, [land]);

  return (
    <svg
      width={width}
      height={height}
      style={{
        width: "1440px",
        height: "600px",
        background: "#0a2a43",
        display: "block",
      }}
    >
      {/* 🌍 Земля */}
      <g>
        {land.features.map((geo, i) => {
          const countryName = geo.properties.name || `country-${i}`;
          const fillColor = countryColors[countryName] || "#4a5568";

          return (
            <path
              key={`country-${i}`}
              d={pathGenerator(geo)}
              fill={fillColor}
              stroke="#1a365d"
              strokeWidth={0.4}
              className="country"
              data-country={countryName}
            />
          );
        })}
      </g>

      {/* ✈️ Маршруты */}
      {routes.map((r, i) => {
        const from = projection([r.from.lon, r.from.lat]);
        const to = projection([r.to.lon, r.to.lat]);
        if (!from || !to) return null;

        const pathId = `route-${i}`;
        const d = curvedPath(from, to);

        return (
          <g key={i}>
            <circle cx={from[0]} cy={from[1]} r={4} fill="#fff" />
            <circle cx={to[0]} cy={to[1]} r={4} fill="#fff" />

            {/* линия */}
            <path
              id={pathId}
              d={d}
              fill="none"
              stroke={r.color || "#ffffff"}
              strokeWidth={2.5}
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

            <Arrow pathId={pathId} color={r.color || "#ffffff"} duration="1s" />
          </g>
        );
      })}
    </svg>
  );
}
