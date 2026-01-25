## Sipmple Map (react-simple-maps d3 framer-motion)

### react-simple-maps

#### CWE

CWE-400: Неконтролируемое потребление ресурсов
Тип уязвимости: Отказ в обслуживании с помощью регулярных выражений (ReDoS)
Затронутая зависимость: версии d3-color до версии 3.1.0
react-simple-maps Статус: Основной пакет react-simple-maps (версия 3.0.0 и, вероятно, более ранние версии) имеет конфликтующие зависимости, которые препятствуют прямому обновлению до исправленной версии d3-color в рамках его текущей структуры. Проблема все еще остается открытой в официальном репозитории.

### d3

#### CVE

CVE-2017-16044
Описание: пакет оказался вредоносным (malicious module / typosquatting)
Затронутые версии: все версии пакета „d3.js“, который был опубликован под этим именем в npm

CWE-200: Exposure of Sensitive Information (утечка данных)

CWE-506: Embedded Malicious Code (в некоторых классификациях)

#### CWE

CWE-200 – Exposure of Sensitive Information to an Unauthorized Actor — утечка чувствительной информации из-за исполнения чужого вредоносного кода.

CWE-506 – Embedded Malicious Code — встроенный вредоносный код (неофициальное дополнительное обозначение в ряде источников).

### framer-motion

Официально CWE и CVE нет. Но пользователи жалуются на:

- выполнение вредоносного кода при установке,

- кража секретов/ключей,

- полный компромисс системы

## MapLibre (react-simple-maps d3 framer-motion)

#### CWE

CWE-506 – Embedded Malicious Code — встроенный вредоносный код

## AtlasMap (d3-geo d3-shape topojson-client world-atlas)

### d3-geo

CWE и CVE нет

### d3-shape

CWE и CVE нет

### topojson-client

CWE и CVE нет

### world-atlas

CWE и CVE нет
