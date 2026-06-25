/** Regional merchant names for realistic debit descriptions. */

const STATE_CITIES: Record<string, string[]> = {
  TX: ["Richardson", "Dallas", "Plano", "Garland", "Frisco"],
  CA: ["Los Angeles", "San Diego", "Sacramento", "Oakland", "Fresno"],
  NY: ["Buffalo", "Rochester", "Albany", "Syracuse", "Yonkers"],
  FL: ["Tampa", "Orlando", "Jacksonville", "Miami", "Tallahassee"],
  IL: ["Chicago", "Springfield", "Naperville", "Peoria", "Rockford"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Dayton"],
  PA: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown", "Erie"],
  NC: ["Charlotte", "Raleigh", "Durham", "Greensboro", "Winston-Salem"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Chandler"],
};

const DEBIT_TEMPLATES = [
  { category: "Grocery", prefix: "HEB" },
  { category: "Grocery", prefix: "Kroger" },
  { category: "Grocery", prefix: "Whole Foods" },
  { category: "Fuel", prefix: "Shell" },
  { category: "Fuel", prefix: "Chevron" },
  { category: "Fuel", prefix: "QuikTrip" },
  { category: "Dining", prefix: "Chipotle" },
  { category: "Dining", prefix: "Starbucks" },
  { category: "Dining", prefix: "Whataburger" },
  { category: "Retail", prefix: "Target" },
  { category: "Retail", prefix: "Walmart" },
  { category: "Retail", prefix: "Home Depot" },
  { category: "Utilities", prefix: "Oncor Electric" },
  { category: "Utilities", prefix: "AT&T" },
  { category: "Utilities", prefix: "Spectrum" },
  { category: "Pharmacy", prefix: "CVS Pharmacy" },
  { category: "Pharmacy", prefix: "Walgreens" },
  { category: "Auto", prefix: "Jiffy Lube" },
  { category: "Auto", prefix: "Discount Tire" },
];

export function normalizeState(state: string | null | undefined): string {
  const code = (state ?? "TX").trim().toUpperCase().slice(0, 2);
  return /^[A-Z]{2}$/.test(code) ? code : "TX";
}

export function pickCity(state: string): string {
  const cities = STATE_CITIES[state] ?? STATE_CITIES.TX ?? ["Richardson"];
  return cities[Math.floor(Math.random() * cities.length)]!;
}

export function buildDebitDescription(state: string): string {
  const st = normalizeState(state);
  const city = pickCity(st);
  const template =
    DEBIT_TEMPLATES[Math.floor(Math.random() * DEBIT_TEMPLATES.length)]!;
  return `${template.prefix} #${100 + Math.floor(Math.random() * 900)} — ${city}, ${st}`;
}

export function debitAmountForCategory(description: string): number {
  if (description.includes("Fuel")) return randomBetween(28, 72);
  if (description.includes("Grocery")) return randomBetween(42, 186);
  if (description.includes("Dining")) return randomBetween(9, 48);
  if (description.includes("Utilities")) return randomBetween(65, 240);
  if (description.includes("Pharmacy")) return randomBetween(12, 85);
  if (description.includes("Auto")) return randomBetween(35, 220);
  return randomBetween(18, 120);
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

export { randomBetween };
