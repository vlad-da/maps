import { Route, Routes } from "react-router-dom";
import Layout from "./layout/Layout";
import AtlasMap from "./components/atlas-map/AtlasMap";
import WrapMapLibre from "./components/map-libre-map/WrapMapLibre";
import WrapOc from "./components/simple-map/WrapOc";
import DeckMap from "./components/deck-map/DeckMap";
const mockRoutes = [
  {
    from: {
      lon: 37.6173,
      lat: 55.7558,
      country_name: "Россия",
      country_code: "RU"
    },
    to: {
      lon: -77.0369,
      lat: 38.9072,
      country_name: "США",
      country_code: "US"
    },
    toOrg: "Bank of America",
    color: "#ff6b6b",
    files: [
      {
        timestamp: "2024-01-15 14:30:00",
        name: "bank_trojan.exe",
        type: "Троян",
        organization: "Bank of America"
      },
      {
        timestamp: "2024-01-15 14:28:00",
        name: "keylogger.dll",
        type: "Кейлоггер",
        organization: "Bank of America"
      }
    ]
  },
  {
    from: {
      lon: 116.4074,
      lat: 39.9042,
      country_name: "Китай",
      country_code: "CN"
    },
    to: {
      lon: 139.6917,
      lat: 35.6895,
      country_name: "Япония",
      country_code: "JP"
    },
    toOrg: "Toyota",
    color: "#ff4444",
    files: [
      {
        timestamp: "2024-01-15 09:15:00",
        name: "ransomware.exe",
        type: "Вымогатель",
        organization: "Toyota"
      }
    ]
  },
  {
    from: {
      lon: 10.4515,
      lat: 51.1657,
      country_name: "Германия",
      country_code: "DE"
    },
    to: {
      lon: 2.3522,
      lat: 48.8566,
      country_name: "Франция",
      country_code: "FR"
    },
    toOrg: "TotalEnergies",
    color: "#ff8800",
    files: [
      {
        timestamp: "2024-01-15 11:20:00",
        name: "phishing.doc",
        type: "Фишинг",
        organization: "TotalEnergies"
      },
      {
        timestamp: "2024-01-15 11:18:00",
        name: "malware.js",
        type: "Скрипт",
        organization: "TotalEnergies"
      },
      {
        timestamp: "2024-01-15 11:15:00",
        name: "backdoor.exe",
        type: "Бэкдор",
        organization: "TotalEnergies"
      }
    ]
  },
  {
    from: {
      // Неизвестная геолокация - будет использован северный полюс
      lon: null,
      lat: null,
      country_name: "Неизвестно",
      country_code: "XX"
    },
    to: {
      lon: -46.6333,
      lat: -23.5505,
      country_name: "Бразилия",
      country_code: "BR"
    },
    toOrg: "Petrobras",
    color: "#ff6b6b",
    files: [
      {
        timestamp: "2024-01-15 16:45:00",
        name: "unknown_malware.exe",
        type: "Неизвестный",
        organization: "Petrobras"
      }
    ]
  },
  {
    from: {
      lon: 37.6173,
      lat: 55.7558,
      country_name: "Россия",
      country_code: "RU"
    },
    to: {
      lon: 37.6173,
      lat: 55.7558,
      country_name: "Россия", // Та же страна - будет использован северный полюс
      country_code: "RU"
    },
    toOrg: "Сбербанк",
    color: "#ff4444",
    files: [
      {
        timestamp: "2024-01-15 08:30:00",
        name: "internal_attack.exe",
        type: "Внутренняя атака",
        organization: "Сбербанк"
      },
      {
        timestamp: "2024-01-15 08:25:00",
        name: "data_stealer.dll",
        type: "Стилер",
        organization: "Сбербанк"
      }
    ]
  }
];
function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<AtlasMap initialRoutes={mockRoutes} />} />
          <Route path="/map-libre-map" element={<WrapMapLibre />} />
          <Route path="/simple-map" element={<WrapOc />} />
          <Route path="/deck-map" element={<DeckMap />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
