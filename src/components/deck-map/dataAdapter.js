// dataAdapter.js
// Функция для преобразования ваших данных в формат для карты

// Координаты стран (можно расширить)
const countryCoordinates = {
  'RU': { lon: 37.6173, lat: 55.7558, name: 'Россия' },
  'US': { lon: -95.7129, lat: 37.0902, name: 'США' },
  'AU': { lon: 133.7751, lat: -25.2744, name: 'Австралия' },
  'BF': { lon: -1.5616, lat: 12.3714, name: 'Буркина-Фасо' },
  'BR': { lon: -51.9253, lat: -14.2350, name: 'Бразилия' },
  'CN': { lon: 104.1954, lat: 35.8617, name: 'Китай' },
  'GB': { lon: -3.4359, lat: 55.3781, name: 'Великобритания' },
  'DE': { lon: 10.4515, lat: 51.1657, name: 'Германия' },
  'FR': { lon: 2.2137, lat: 46.2276, name: 'Франция' },
  'JP': { lon: 138.2529, lat: 36.2048, name: 'Япония' },
  'IN': { lon: 78.9629, lat: 20.5937, name: 'Индия' },
  'CA': { lon: -106.3468, lat: 56.1304, name: 'Канада' },
  // Добавьте другие страны по необходимости
};

// Функция для получения координат по коду страны
export const getCoordsByCountryCode = (code) => {
  return countryCoordinates[code] || null;
};

// Генерация случайных связей между IP для демонстрации
export const generateRoutesFromIPs = (ipList, targetIPs = null) => {
  // Если нет целевых IP, используем те же данные для демо
  const targets = targetIPs || ipList;
  
  const routes = [];
  
  // Создаем связи между источниками и целями
  ipList.forEach((source, index) => {
    // Берем случайную цель
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    const sourceCountry = source.countries[0];
    const targetCountry = target.countries[0];
    
    const sourceCoords = getCoordsByCountryCode(sourceCountry.country_code);
    const targetCoords = getCoordsByCountryCode(targetCountry.country_code);
    
    // Генерируем случайные файлы для демо
    const malwareTypes = ['trojan', 'ransomware', 'worm', 'backdoor', 'keylogger'];
    const fileCount = Math.floor(Math.random() * 5) + 1;
    const files = [];
    
    for (let i = 0; i < fileCount; i++) {
      files.push({
        name: `malware_${i + 1}.exe`,
        type: malwareTypes[Math.floor(Math.random() * malwareTypes.length)],
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    routes.push({
      id: `route-${index}`,
      from: {
        ip: source.ip,
        country_name: sourceCountry.country_name,
        country_code: sourceCountry.country_code,
        lon: sourceCoords?.lon,
        lat: sourceCoords?.lat
      },
      to: {
        ip: target.ip,
        country_name: targetCountry.country_name,
        country_code: targetCountry.country_code,
        lon: targetCoords?.lon,
        lat: targetCoords?.lat
      },
      toOrg: `Organization ${Math.floor(Math.random() * 10) + 1}`,
      severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      files: files
    });
  });
  
  return routes;
};

// Функция для создания маршрутов на основе реальных данных
export const createRoutesFromData = (sourceIPs, targetIPs, malwareFiles) => {
  const routes = [];
  
  const filesByIP = {};
  malwareFiles?.forEach(file => {
    if (!filesByIP[file.source_ip]) {
      filesByIP[file.source_ip] = [];
    }
    filesByIP[file.source_ip].push(file);
  });
  
  sourceIPs.forEach(source => {
    const sourceCountry = source.countries[0];
    const sourceCoords = getCoordsByCountryCode(sourceCountry.country_code);
    
    // Для каждого источника находим цели (в демо берем случайную)
    targetIPs.forEach(target => {
      const targetCountry = target.countries[0];
      const targetCoords = getCoordsByCountryCode(targetCountry.country_code);
      
      // Получаем файлы для этого источника
      const files = filesByIP[source.ip] || [];
      
      if (files.length > 0) {
        routes.push({
          id: `route-${routes.length}`,
          from: {
            ip: source.ip,
            country_name: sourceCountry.country_name,
            country_code: sourceCountry.country_code,
            lon: sourceCoords?.lon,
            lat: sourceCoords?.lat
          },
          to: {
            ip: target.ip,
            country_name: targetCountry.country_name,
            country_code: targetCountry.country_code,
            lon: targetCoords?.lon,
            lat: targetCoords?.lat
          },
          toOrg: target.organization || 'Unknown',
          severity: calculateSeverity(files),
          files: files.map(f => ({
            name: f.filename,
            type: f.malware_type,
            timestamp: f.detected_at
          }))
        });
      }
    });
  });
  
  return routes;
};

const calculateSeverity = (files) => {
  const types = files.map(f => f.malware_type);
  if (types.includes('ransomware')) return 'high';
  if (types.includes('trojan')) return 'medium';
  return 'low';
};