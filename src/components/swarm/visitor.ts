// A rough "where is the visitor" from the browser's time zone —
// nothing is requested or sent anywhere. Used to draw an arc on the globe and
// to say how far apart and how many hours apart we are.
import { HOME_ZONE, offsetMinutes } from "@/lib/kyiv";

export type Place = { lat: number; lon: number; ua: string; en: string };

/** Representative city per common time zone. Unknown zones get no arc. */
const ZONES: Record<string, Place> = {
  "Europe/Kyiv": { lat: 50.45, lon: 30.52, ua: "Київ", en: "Kyiv" },
  "Europe/Kiev": { lat: 50.45, lon: 30.52, ua: "Київ", en: "Kyiv" },
  "Europe/London": { lat: 51.51, lon: -0.13, ua: "Лондон", en: "London" },
  "Europe/Dublin": { lat: 53.35, lon: -6.26, ua: "Дублін", en: "Dublin" },
  "Europe/Lisbon": { lat: 38.72, lon: -9.14, ua: "Лісабон", en: "Lisbon" },
  "Europe/Madrid": { lat: 40.42, lon: -3.7, ua: "Мадрид", en: "Madrid" },
  "Europe/Paris": { lat: 48.86, lon: 2.35, ua: "Париж", en: "Paris" },
  "Europe/Brussels": { lat: 50.85, lon: 4.35, ua: "Брюссель", en: "Brussels" },
  "Europe/Amsterdam": { lat: 52.37, lon: 4.9, ua: "Амстердам", en: "Amsterdam" },
  "Europe/Luxembourg": { lat: 49.61, lon: 6.13, ua: "Люксембург", en: "Luxembourg" },
  "Europe/Berlin": { lat: 52.52, lon: 13.4, ua: "Берлін", en: "Berlin" },
  "Europe/Zurich": { lat: 47.38, lon: 8.54, ua: "Цюрих", en: "Zurich" },
  "Europe/Vienna": { lat: 48.21, lon: 16.37, ua: "Відень", en: "Vienna" },
  "Europe/Rome": { lat: 41.9, lon: 12.5, ua: "Рим", en: "Rome" },
  "Europe/Prague": { lat: 50.08, lon: 14.44, ua: "Прага", en: "Prague" },
  "Europe/Warsaw": { lat: 52.23, lon: 21.01, ua: "Варшава", en: "Warsaw" },
  "Europe/Budapest": { lat: 47.5, lon: 19.04, ua: "Будапешт", en: "Budapest" },
  "Europe/Bratislava": { lat: 48.15, lon: 17.11, ua: "Братислава", en: "Bratislava" },
  "Europe/Copenhagen": { lat: 55.68, lon: 12.57, ua: "Копенгаген", en: "Copenhagen" },
  "Europe/Stockholm": { lat: 59.33, lon: 18.07, ua: "Стокгольм", en: "Stockholm" },
  "Europe/Oslo": { lat: 59.91, lon: 10.75, ua: "Осло", en: "Oslo" },
  "Europe/Helsinki": { lat: 60.17, lon: 24.94, ua: "Гельсінкі", en: "Helsinki" },
  "Europe/Tallinn": { lat: 59.44, lon: 24.75, ua: "Таллінн", en: "Tallinn" },
  "Europe/Riga": { lat: 56.95, lon: 24.11, ua: "Рига", en: "Riga" },
  "Europe/Vilnius": { lat: 54.69, lon: 25.28, ua: "Вільнюс", en: "Vilnius" },
  "Europe/Chisinau": { lat: 47.01, lon: 28.86, ua: "Кишинів", en: "Chișinău" },
  "Europe/Bucharest": { lat: 44.43, lon: 26.1, ua: "Бухарест", en: "Bucharest" },
  "Europe/Sofia": { lat: 42.7, lon: 23.32, ua: "Софія", en: "Sofia" },
  "Europe/Athens": { lat: 37.98, lon: 23.73, ua: "Афіни", en: "Athens" },
  "Europe/Belgrade": { lat: 44.79, lon: 20.45, ua: "Белград", en: "Belgrade" },
  "Europe/Istanbul": { lat: 41.01, lon: 28.98, ua: "Стамбул", en: "Istanbul" },
  "Asia/Tbilisi": { lat: 41.72, lon: 44.79, ua: "Тбілісі", en: "Tbilisi" },
  "Asia/Jerusalem": { lat: 31.77, lon: 35.21, ua: "Єрусалим", en: "Jerusalem" },
  "Asia/Dubai": { lat: 25.2, lon: 55.27, ua: "Дубай", en: "Dubai" },
  "Asia/Almaty": { lat: 43.24, lon: 76.89, ua: "Алмати", en: "Almaty" },
  "Asia/Kolkata": { lat: 22.57, lon: 88.36, ua: "Колката", en: "Kolkata" },
  "Asia/Singapore": { lat: 1.35, lon: 103.82, ua: "Сінгапур", en: "Singapore" },
  "Asia/Shanghai": { lat: 31.23, lon: 121.47, ua: "Шанхай", en: "Shanghai" },
  "Asia/Hong_Kong": { lat: 22.32, lon: 114.17, ua: "Гонконг", en: "Hong Kong" },
  "Asia/Seoul": { lat: 37.57, lon: 126.98, ua: "Сеул", en: "Seoul" },
  "Asia/Tokyo": { lat: 35.68, lon: 139.69, ua: "Токіо", en: "Tokyo" },
  "Australia/Sydney": { lat: -33.87, lon: 151.21, ua: "Сідней", en: "Sydney" },
  "Africa/Cairo": { lat: 30.04, lon: 31.24, ua: "Каїр", en: "Cairo" },
  "Africa/Johannesburg": { lat: -26.2, lon: 28.05, ua: "Йоганнесбург", en: "Johannesburg" },
  "America/New_York": { lat: 40.71, lon: -74.01, ua: "Нью-Йорк", en: "New York" },
  "America/Toronto": { lat: 43.65, lon: -79.38, ua: "Торонто", en: "Toronto" },
  "America/Chicago": { lat: 41.88, lon: -87.63, ua: "Чикаго", en: "Chicago" },
  "America/Denver": { lat: 39.74, lon: -104.99, ua: "Денвер", en: "Denver" },
  "America/Los_Angeles": { lat: 34.05, lon: -118.24, ua: "Лос-Анджелес", en: "Los Angeles" },
  "America/Vancouver": { lat: 49.28, lon: -123.12, ua: "Ванкувер", en: "Vancouver" },
  "America/Mexico_City": { lat: 19.43, lon: -99.13, ua: "Мехіко", en: "Mexico City" },
  "America/Sao_Paulo": { lat: -23.55, lon: -46.63, ua: "Сан-Паулу", en: "São Paulo" },
  "America/Argentina/Buenos_Aires": { lat: -34.6, lon: -58.38, ua: "Буенос-Айрес", en: "Buenos Aires" },
};

export const HOME = ZONES[HOME_ZONE];

export function visitorZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function visitorPlace(zone = visitorZone()): Place | null {
  return ZONES[zone] ?? null;
}

export function isHome(zone = visitorZone()) {
  return zone === HOME_ZONE || zone === "Europe/Kiev";
}

/** Great-circle distance in km. */
export function distanceKm(a: Place, b: Place) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Hours the visitor is ahead of (+) or behind (−) Ukraine right now. */
export function hoursFromHome(at = new Date()) {
  const visitor = -at.getTimezoneOffset();
  return (visitor - offsetMinutes(HOME_ZONE, at)) / 60;
}

/** "14:32" in Ukraine, right now. */
export function homeTime(at = new Date()) {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: HOME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}
