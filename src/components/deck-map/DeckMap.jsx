// DeckMap.jsx
import React, { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { feature } from 'topojson-client';

// Статичные данные
import worldAtlas from '../../map/countries/countries-50m.json';
import ipData from '../../attacks.json'; // ваш файл с IP
import { generateRoutesFromIPs, getCoordsByCountryCode } from './dataAdapter';

// Цвета для разных типов атак
const ATTACK_COLORS = {
  high: [255, 60, 60, 255],    // Ярко-красный
  medium: [255, 140, 60, 255],  // Оранжевый
  low: [255, 220, 60, 255],     // Желтый
  default: [180, 180, 180, 255] // Серый
};

function DeckMap() {
  const [viewState, setViewState] = useState({
    longitude: 30,
    latitude: 20,
    zoom: 1.8,
    pitch: 0,
    bearing: 0
  });

  const [hoverInfo, setHoverInfo] = useState(null);

  // Конвертируем TopoJSON в GeoJSON
  const worldGeoJson = useMemo(() => {
    return feature(worldAtlas, worldAtlas.objects.countries);
  }, []);

  // Генерируем маршруты из IP данных
  const routes = useMemo(() => {
    return generateRoutesFromIPs(ipData, ipData);
  }, []);

  // Статистика атак по странам
  const attackStats = useMemo(() => {
    const stats = {};
    routes.forEach(route => {
      const fromCountry = route.from.country_name || 'Unknown';
      stats[fromCountry] = (stats[fromCountry] || 0) + 1;
    });
    return stats;
  }, [routes]);

  const maxAttacks = Math.max(...Object.values(attackStats), 1);

  const ipStats = useMemo(() => {
    const stats = {};
    ipData.forEach(item => {
      const country = item.countries[0].country_name;
      stats[country] = (stats[country] || 0) + 1;
    });
    return stats;
  }, []);

  // Подготовка данных для маршрутов
  const routeData = useMemo(() => {
    return routes.map((route, index) => {
      // Проверяем, нужно ли использовать северный полюс
      const useNorthPole = !route.from.lon || !route.from.lat || 
                          !route.to.lon || !route.to.lat ||
                          route.from.country_code === route.to.country_code;

      // Получаем координаты
      const sourcePos = useNorthPole 
        ? [0, 90] // Северный полюс
        : [route.from.lon, route.from.lat];
      
      const targetPos = useNorthPole && route.to.lon && route.to.lat
        ? [route.to.lon, route.to.lat]
        : [route.to.lon || 0, route.to.lat || 90];

      return {
        id: `route-${index}`,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        sourceCountry: route.from.country_name,
        targetCountry: route.to.country_name,
        sourceCode: route.from.country_code,
        targetCode: route.to.country_code,
        sourceIP: route.from.ip,
        targetIP: route.to.ip,
        severity: route.severity,
        organization: route.toOrg,
        files: route.files,
        color: ATTACK_COLORS[route.severity] || ATTACK_COLORS.default
      };
    });
  }, [routes]);

  // Слой с картой мира
  const mapLayer = useMemo(() => {
    return new GeoJsonLayer({
      id: 'base-map',
      data: worldGeoJson,
      filled: true,
      stroked: true,
      lineWidthMinPixels: 0.5,
      getLineColor: [30, 50, 80, 255],
      getFillColor: (f) => {
        const countryName = f.properties?.name;
        const attackCount = attackStats[countryName] || 0;
        const ipCount = ipStats[countryName] || 0;
        
        if (attackCount === 0 && ipCount === 0) return [30, 40, 60, 200];
        
        const intensity = Math.min(attackCount / maxAttacks, 1);
        return [
          180 + Math.floor(75 * intensity),
          100 - Math.floor(100 * intensity),
          100 - Math.floor(100 * intensity),
          200
        ];
      },
      pickable: true,
      autoHighlight: true,
      highlightColor: [100, 200, 255, 150],
      onHover: (info) => {
        if (info.object) {
          const countryName = info.object.properties?.name;
          setHoverInfo({
            type: 'country',
            country: countryName,
            attacks: attackStats[countryName] || 0,
            ips: ipStats[countryName] || 0,
            x: info.x,
            y: info.y
          });
        } else {
          setHoverInfo(null);
        }
      }
    });
  }, [worldGeoJson, attackStats, ipStats, maxAttacks]);

  // Слой с точками (IP адреса)
  const pointsLayer = useMemo(() => {
    const points = [];
    
    ipData.forEach(item => {
      const country = item.countries[0];
      const coords = getCoordsByCountryCode(country.country_code);
      
      if (coords) {
        points.push({
          position: [coords.lon, coords.lat],
          country: country.country_name,
          ip: item.ip,
          type: 'ip'
        });
      }
    });

    return new ScatterplotLayer({
      id: 'ip-points',
      data: points,
      getPosition: d => d.position,
      getFillColor: [100, 150, 255, 180],
      getRadius: 4,
      radiusMinPixels: 2,
      radiusMaxPixels: 6,
      pickable: true,
      onHover: (info) => {
        if (info.object) {
          setHoverInfo({
            type: 'ip',
            ip: info.object.ip,
            country: info.object.country,
            x: info.x,
            y: info.y
          });
        }
      }
    });
  }, []);

  // Слой с дугами (маршруты атак)
  const arcsLayer = useMemo(() => {
    return new ArcLayer({
      id: 'arcs',
      data: routeData,
      getSourcePosition: d => d.sourcePosition,
      getTargetPosition: d => d.targetPosition,
      getSourceColor: d => d.color,
      getTargetColor: [100, 200, 255, 200],
      getWidth: d => {
        const attackCount = attackStats[d.sourceCountry] || 0;
        return 1.5 + Math.min(attackCount * 0.3, 5);
      },
      widthMinPixels: 1,
      widthMaxPixels: 8,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 255],
      onHover: (info) => {
        if (info.object) {
          setHoverInfo({
            type: 'route',
            source: info.object.sourceCountry,
            target: info.object.targetCountry,
            sourceIP: info.object.sourceIP,
            targetIP: info.object.targetIP,
            severity: info.object.severity,
            organization: info.object.organization,
            files: info.object.files,
            x: info.x,
            y: info.y
          });
        } else {
          setHoverInfo(null);
        }
      }
    });
  }, [routeData, attackStats]);

  return (
    <div style={{ position: 'relative', width: '1440px', height: '600px' }}>
      {/* Карта */}
      <DeckGL
        views={new MapView()}
        initialViewState={viewState}
        controller={true}
        layers={[mapLayer, pointsLayer, arcsLayer]}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        style={{ background: '#0a1a2a' }}
      />

      {/* Тултип */}
      {hoverInfo && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x + 15,
            top: hoverInfo.y + 15,
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #444',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 1000,
            pointerEvents: 'none',
            maxWidth: '350px',
            fontSize: '12px'
          }}
        >
          {hoverInfo.type === 'country' && (
            <>
              <h4 style={{ margin: '0 0 8px 0', color: '#ff6b6b' }}>
                {hoverInfo.country}
              </h4>
              <p>IP-адресов: <strong>{hoverInfo.ips}</strong></p>
              <p>Атак как источник: <strong>{hoverInfo.attacks}</strong></p>
            </>
          )}

          {hoverInfo.type === 'ip' && (
            <>
              <h4 style={{ margin: '0 0 8px 0', color: '#64b5f6' }}>
                IP: {hoverInfo.ip}
              </h4>
              <p>Страна: <strong>{hoverInfo.country}</strong></p>
            </>
          )}

          {hoverInfo.type === 'route' && (
            <>
              <h4 style={{ margin: '0 0 8px 0', color: '#ff6b6b' }}>
                {hoverInfo.source} → {hoverInfo.target}
              </h4>
              
              <p style={{ fontSize: '11px', color: '#aaa' }}>
                {hoverInfo.sourceIP} → {hoverInfo.targetIP}
              </p>
              
              {hoverInfo.organization && (
                <p style={{ color: '#64b5f6' }}>
                  🏢 {hoverInfo.organization}
                </p>
              )}

              <p style={{ 
                color: hoverInfo.severity === 'high' ? '#ff4444' : 
                       hoverInfo.severity === 'medium' ? '#ff8844' : '#ffdd44'
              }}>
                Уровень: {hoverInfo.severity === 'high' ? 'Высокий' : 
                         hoverInfo.severity === 'medium' ? 'Средний' : 'Низкий'}
              </p>

              {hoverInfo.files && hoverInfo.files.length > 0 && (
                <>
                  <p style={{ margin: '10px 0 5px 0' }}>
                    📁 Файлы ({hoverInfo.files.length}):
                  </p>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {hoverInfo.files.map((file, idx) => (
                      <div key={idx} style={{ 
                        padding: '4px', 
                        borderBottom: '1px solid #333',
                        fontSize: '11px'
                      }}>
                        <div style={{ color: '#ffaa00' }}>{file.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999' }}>
                          <span>{file.type}</span>
                          <span>{file.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DeckMap;