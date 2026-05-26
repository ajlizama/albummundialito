// Fixture oficial del Mundial 2026 (104 partidos)
// Fechas y horarios desde ESPN.cl (hora chilena, UTC-4 en junio/julio).
// Estructura del bracket KO desde Wikipedia / FIFA.

export type FixtureStage = "group" | "r32" | "r16" | "qf" | "sf" | "tp" | "final";

export interface FixtureMatch {
  num: number;
  date: string;        // "2026-06-11" — fecha del kickoff en hora chilena
  timeChile: string;   // "16:00"
  kickoffISO: string;  // "2026-06-11T16:00:00-04:00"
  stage: FixtureStage;
  group?: string;      // "A" .. "L" (solo fase de grupos)
  homeCode?: string;   // código equipo (solo fase de grupos)
  awayCode?: string;
  homeLabel: string;   // siempre presente (en KO: "1º A", "Ganador 73", etc.)
  awayLabel: string;
  city: string;
  venue: string;
}

const VENUES: Record<string, string> = {
  "Ciudad de México": "Estadio Azteca",
  "Guadalajara": "Estadio Akron",
  "Monterrey": "Estadio BBVA",
  "Toronto": "BMO Field",
  "Vancouver": "BC Place",
  "Atlanta": "Mercedes-Benz Stadium",
  "Boston": "Gillette Stadium (Foxborough)",
  "Dallas": "AT&T Stadium (Arlington)",
  "Houston": "NRG Stadium",
  "Kansas City": "Arrowhead Stadium",
  "Los Ángeles": "SoFi Stadium (Inglewood)",
  "Miami": "Hard Rock Stadium",
  "Nueva Jersey": "MetLife Stadium (East Rutherford)",
  "Philadelphia": "Lincoln Financial Field",
  "San Francisco": "Levi's Stadium (Santa Clara)",
  "Seattle": "Lumen Field",
};

export const HOST_CITIES = Object.keys(VENUES);

function ven(city: string): string {
  return VENUES[city] ?? "";
}

function isoChile(date: string, time: string): string {
  return `${date}T${time}:00-04:00`;
}

type GroupRow = [num: number, date: string, time: string, group: string, home: string, away: string, city: string];

const GROUP_MATCHES: GroupRow[] = [
  [1,  "2026-06-11", "16:00", "A", "MEX", "RSA", "Ciudad de México"],
  [2,  "2026-06-11", "23:00", "A", "KOR", "CZE", "Guadalajara"],
  [3,  "2026-06-12", "16:00", "B", "CAN", "BIH", "Toronto"],
  [4,  "2026-06-12", "22:00", "D", "USA", "PAR", "Los Ángeles"],
  [5,  "2026-06-13", "16:00", "B", "QAT", "SUI", "San Francisco"],
  [6,  "2026-06-13", "19:00", "C", "BRA", "MAR", "Nueva Jersey"],
  [7,  "2026-06-13", "22:00", "C", "HAI", "SCO", "Boston"],
  [8,  "2026-06-14", "01:00", "D", "AUS", "TUR", "Vancouver"],
  [9,  "2026-06-14", "14:00", "E", "GER", "CUW", "Houston"],
  [10, "2026-06-14", "17:00", "F", "NED", "JPN", "Dallas"],
  [11, "2026-06-14", "20:00", "E", "CIV", "ECU", "Philadelphia"],
  [12, "2026-06-14", "23:00", "F", "SWE", "TUN", "Monterrey"],
  [13, "2026-06-15", "13:00", "H", "ESP", "CPV", "Atlanta"],
  [14, "2026-06-15", "16:00", "G", "BEL", "EGY", "Seattle"],
  [15, "2026-06-15", "19:00", "H", "KSA", "URU", "Miami"],
  [16, "2026-06-15", "22:00", "G", "IRN", "NZL", "Los Ángeles"],
  [17, "2026-06-16", "16:00", "I", "FRA", "SEN", "Nueva Jersey"],
  [18, "2026-06-16", "19:00", "I", "IRQ", "NOR", "Boston"],
  [19, "2026-06-16", "22:00", "J", "ARG", "ALG", "Kansas City"],
  [20, "2026-06-17", "01:00", "J", "AUT", "JOR", "San Francisco"],
  [21, "2026-06-17", "14:00", "K", "POR", "COD", "Houston"],
  [22, "2026-06-17", "17:00", "L", "ENG", "CRO", "Dallas"],
  [23, "2026-06-17", "20:00", "L", "GHA", "PAN", "Toronto"],
  [24, "2026-06-17", "23:00", "K", "UZB", "COL", "Ciudad de México"],
  [25, "2026-06-18", "13:00", "A", "CZE", "RSA", "Atlanta"],
  [26, "2026-06-18", "16:00", "B", "SUI", "BIH", "Los Ángeles"],
  [27, "2026-06-18", "19:00", "B", "CAN", "QAT", "Vancouver"],
  [28, "2026-06-18", "22:00", "A", "MEX", "KOR", "Guadalajara"],
  [29, "2026-06-19", "16:00", "D", "USA", "AUS", "Seattle"],
  [30, "2026-06-19", "19:00", "C", "SCO", "MAR", "Boston"],
  [31, "2026-06-19", "21:30", "C", "BRA", "HAI", "Philadelphia"],
  [32, "2026-06-20", "00:00", "D", "TUR", "PAR", "San Francisco"],
  [33, "2026-06-20", "14:00", "F", "NED", "SWE", "Houston"],
  [34, "2026-06-20", "17:00", "E", "GER", "CIV", "Toronto"],
  [35, "2026-06-20", "21:00", "E", "ECU", "CUW", "Kansas City"],
  [36, "2026-06-21", "01:00", "F", "TUN", "JPN", "Monterrey"],
  [37, "2026-06-21", "13:00", "H", "ESP", "KSA", "Atlanta"],
  [38, "2026-06-21", "16:00", "G", "BEL", "IRN", "Los Ángeles"],
  [39, "2026-06-21", "19:00", "H", "URU", "CPV", "Miami"],
  [40, "2026-06-21", "22:00", "G", "NZL", "EGY", "Vancouver"],
  [41, "2026-06-22", "14:00", "J", "ARG", "AUT", "Dallas"],
  [42, "2026-06-22", "18:00", "I", "FRA", "IRQ", "Philadelphia"],
  [43, "2026-06-22", "21:00", "I", "NOR", "SEN", "Nueva Jersey"],
  [44, "2026-06-23", "00:00", "J", "JOR", "ALG", "San Francisco"],
  [45, "2026-06-23", "14:00", "K", "POR", "UZB", "Houston"],
  [46, "2026-06-23", "17:00", "L", "ENG", "GHA", "Boston"],
  [47, "2026-06-23", "20:00", "L", "PAN", "CRO", "Toronto"],
  [48, "2026-06-23", "23:00", "K", "COL", "COD", "Guadalajara"],
  [49, "2026-06-24", "16:00", "B", "SUI", "CAN", "Vancouver"],
  [50, "2026-06-24", "16:00", "B", "BIH", "QAT", "Seattle"],
  [51, "2026-06-24", "19:00", "C", "MAR", "HAI", "Atlanta"],
  [52, "2026-06-24", "19:00", "C", "BRA", "SCO", "Miami"],
  [53, "2026-06-24", "22:00", "A", "RSA", "KOR", "Monterrey"],
  [54, "2026-06-24", "22:00", "A", "CZE", "MEX", "Ciudad de México"],
  [55, "2026-06-25", "17:00", "E", "CUW", "CIV", "Philadelphia"],
  [56, "2026-06-25", "17:00", "E", "ECU", "GER", "Nueva Jersey"],
  [57, "2026-06-25", "20:00", "F", "JPN", "SWE", "Dallas"],
  [58, "2026-06-25", "20:00", "F", "TUN", "NED", "Kansas City"],
  [59, "2026-06-25", "23:00", "D", "PAR", "AUS", "San Francisco"],
  [60, "2026-06-25", "23:00", "D", "TUR", "USA", "Los Ángeles"],
  [61, "2026-06-26", "16:00", "I", "NOR", "FRA", "Boston"],
  [62, "2026-06-26", "16:00", "I", "SEN", "IRQ", "Toronto"],
  [63, "2026-06-26", "21:00", "H", "CPV", "KSA", "Houston"],
  [64, "2026-06-26", "21:00", "H", "URU", "ESP", "Guadalajara"],
  [65, "2026-06-27", "00:00", "G", "EGY", "IRN", "Seattle"],
  [66, "2026-06-27", "00:00", "G", "NZL", "BEL", "Vancouver"],
  [67, "2026-06-27", "18:00", "L", "CRO", "GHA", "Philadelphia"],
  [68, "2026-06-27", "18:00", "L", "PAN", "ENG", "Nueva Jersey"],
  [69, "2026-06-27", "20:30", "K", "COL", "POR", "Miami"],
  [70, "2026-06-27", "20:30", "K", "COD", "UZB", "Atlanta"],
  [71, "2026-06-27", "23:00", "J", "ALG", "AUT", "Kansas City"],
  [72, "2026-06-27", "23:00", "J", "JOR", "ARG", "Dallas"],
];

const GROUP_FIXTURES: FixtureMatch[] = GROUP_MATCHES.map(([num, date, time, group, home, away, city]) => ({
  num,
  date,
  timeChile: time,
  kickoffISO: isoChile(date, time),
  stage: "group",
  group,
  homeCode: home,
  awayCode: away,
  homeLabel: home,
  awayLabel: away,
  city,
  venue: ven(city),
}));

type KORow = [num: number, date: string, time: string, stage: FixtureStage, home: string, away: string, city: string];

const KO_MATCHES: KORow[] = [
  // Dieciseisavos (Round of 32)
  [73, "2026-06-28", "16:00", "r32", "2º A",  "2º B", "Los Ángeles"],
  [74, "2026-06-29", "14:00", "r32", "1º E",  "3º (A/B/C/D/F)", "Boston"],
  [75, "2026-06-29", "17:30", "r32", "1º F",  "2º C", "Monterrey"],
  [76, "2026-06-29", "22:00", "r32", "1º C",  "2º F", "Houston"],
  [77, "2026-06-30", "14:00", "r32", "1º I",  "3º (C/D/F/G/H)", "Nueva Jersey"],
  [78, "2026-06-30", "18:00", "r32", "2º E",  "2º I", "Dallas"],
  [79, "2026-06-30", "22:00", "r32", "1º A",  "3º (C/E/F/H/I)", "Ciudad de México"],
  [80, "2026-07-01", "13:00", "r32", "1º L",  "3º (E/H/I/J/K)", "Atlanta"],
  [81, "2026-07-01", "17:00", "r32", "1º D",  "3º (B/E/F/I/J)", "San Francisco"],
  [82, "2026-07-01", "21:00", "r32", "1º G",  "3º (A/E/H/I/J)", "Seattle"],
  [83, "2026-07-02", "16:00", "r32", "2º K",  "2º L", "Toronto"],
  [84, "2026-07-02", "20:00", "r32", "1º H",  "2º J", "Los Ángeles"],
  [85, "2026-07-03", "00:00", "r32", "1º B",  "3º (E/F/G/I/J)", "Vancouver"],
  [86, "2026-07-03", "15:00", "r32", "1º J",  "2º H", "Miami"],
  [87, "2026-07-03", "19:00", "r32", "1º K",  "3º (D/E/I/J/L)", "Kansas City"],
  [88, "2026-07-03", "22:30", "r32", "2º D",  "2º G", "Dallas"],

  // Octavos (Round of 16)
  [89,  "2026-07-04", "14:00", "r16", "Ganador 74",  "Ganador 77", "Philadelphia"],
  [90,  "2026-07-04", "18:00", "r16", "Ganador 73",  "Ganador 75", "Houston"],
  [91,  "2026-07-05", "17:00", "r16", "Ganador 76",  "Ganador 78", "Nueva Jersey"],
  [92,  "2026-07-05", "21:00", "r16", "Ganador 79",  "Ganador 80", "Ciudad de México"],
  [93,  "2026-07-06", "16:00", "r16", "Ganador 83",  "Ganador 84", "Dallas"],
  [94,  "2026-07-06", "21:00", "r16", "Ganador 81",  "Ganador 82", "Seattle"],
  [95,  "2026-07-07", "13:00", "r16", "Ganador 86",  "Ganador 88", "Atlanta"],
  [96,  "2026-07-07", "17:00", "r16", "Ganador 85",  "Ganador 87", "Vancouver"],

  // Cuartos de final
  [97,  "2026-07-09", "17:00", "qf", "Ganador 89", "Ganador 90", "Boston"],
  [98,  "2026-07-10", "16:00", "qf", "Ganador 93", "Ganador 94", "Los Ángeles"],
  [99,  "2026-07-11", "18:00", "qf", "Ganador 91", "Ganador 92", "Miami"],
  [100, "2026-07-11", "22:00", "qf", "Ganador 95", "Ganador 96", "Kansas City"],

  // Semifinales
  [101, "2026-07-14", "16:00", "sf", "Ganador 97", "Ganador 98",  "Dallas"],
  [102, "2026-07-15", "16:00", "sf", "Ganador 99", "Ganador 100", "Atlanta"],

  // Tercer puesto
  [103, "2026-07-18", "18:00", "tp", "Perdedor 101", "Perdedor 102", "Miami"],

  // Final
  [104, "2026-07-19", "16:00", "final", "Ganador 101", "Ganador 102", "Nueva Jersey"],
];

const KO_FIXTURES: FixtureMatch[] = KO_MATCHES.map(([num, date, time, stage, home, away, city]) => ({
  num,
  date,
  timeChile: time,
  kickoffISO: isoChile(date, time),
  stage,
  homeLabel: home,
  awayLabel: away,
  city,
  venue: ven(city),
}));

export const FIXTURE: FixtureMatch[] = [...GROUP_FIXTURES, ...KO_FIXTURES];

export const STAGE_LABEL: Record<FixtureStage, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos de final",
  r16: "Octavos de final",
  qf: "Cuartos de final",
  sf: "Semifinales",
  tp: "Tercer puesto",
  final: "Final",
};

export const STAGE_SHORT: Record<FixtureStage, string> = {
  group: "Grupos",
  r32: "16avos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semis",
  tp: "3º puesto",
  final: "Final",
};

// Lookup de la fecha visible y agradable en español (Hora Chile).
export function formatChileDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${d} de ${months[m - 1]}`;
}
