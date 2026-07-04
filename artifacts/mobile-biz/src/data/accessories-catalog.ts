export interface AccessoryVariant {
  label: string;    // e.g. "5000mAh", "Type-C", "Large"
  priceAdder: number; // ZMW added on top of base price
}

export interface CatalogAccessory {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  imageUrl: string;
  variants: AccessoryVariant[];
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const IMG = (file: string) => `${BASE}/accessories/${file}`;

type RawAccessory = Omit<CatalogAccessory, "id">;

const raw: RawAccessory[] = [
  // ──────────────────────── PHONE CASES ────────────────────────
  { name: "Clear TPU Case", category: "Cases", subcategory: "Soft Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "MagSafe", priceAdder: 20 }
  ]},
  { name: "Slim Matte Case", category: "Cases", subcategory: "Slim Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
  { name: "Leather Wallet Case", category: "Cases", subcategory: "Wallet Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "Premium Leather", priceAdder: 60 }
  ]},
  { name: "Rugged Armor Case", category: "Cases", subcategory: "Rugged Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "With Kickstand", priceAdder: 30 }
  ]},
  { name: "Silicone Soft Case", category: "Cases", subcategory: "Soft Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
  { name: "Carbon Fiber Case", category: "Cases", subcategory: "Designer Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
  { name: "Ring Holder Case", category: "Cases", subcategory: "Grip Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
  { name: "Flip Book Case", category: "Cases", subcategory: "Flip Cases", imageUrl: IMG("cases.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "Leather", priceAdder: 50 }
  ]},

  // ──────────────────────── SCREEN PROTECTORS ────────────────────────
  { name: "Tempered Glass Screen Protector", category: "Screen Protectors", subcategory: "Tempered Glass", imageUrl: IMG("screen-protectors.jpg"), variants: [
    { label: "Standard 9H", priceAdder: 0 }, { label: "Privacy", priceAdder: 25 }, { label: "2-Pack", priceAdder: 10 }
  ]},
  { name: "Full Coverage Tempered Glass", category: "Screen Protectors", subcategory: "Full Coverage", imageUrl: IMG("screen-protectors.jpg"), variants: [
    { label: "Clear", priceAdder: 0 }, { label: "Matte Anti-Glare", priceAdder: 20 }
  ]},
  { name: "Camera Lens Protector", category: "Screen Protectors", subcategory: "Lens Protectors", imageUrl: IMG("screen-protectors.jpg"), variants: [
    { label: "2-Pack", priceAdder: 0 }
  ]},
  { name: "Hydrogel Film Protector", category: "Screen Protectors", subcategory: "Hydrogel Film", imageUrl: IMG("screen-protectors.jpg"), variants: [
    { label: "Clear", priceAdder: 0 }, { label: "Matte", priceAdder: 15 }
  ]},

  // ──────────────────────── CHARGERS ────────────────────────
  { name: "USB-C Fast Charger", category: "Chargers", subcategory: "Wall Chargers", imageUrl: IMG("chargers.jpg"), variants: [
    { label: "18W", priceAdder: 0 }, { label: "33W", priceAdder: 50 }, { label: "65W GaN", priceAdder: 120 }, { label: "120W", priceAdder: 200 }
  ]},
  { name: "iPhone Lightning Charger", category: "Chargers", subcategory: "Wall Chargers", imageUrl: IMG("chargers.jpg"), variants: [
    { label: "20W", priceAdder: 0 }, { label: "30W", priceAdder: 50 }
  ]},
  { name: "Multi-Port GaN Charger", category: "Chargers", subcategory: "Multi-Port", imageUrl: IMG("chargers.jpg"), variants: [
    { label: "65W 3-Port", priceAdder: 0 }, { label: "100W 4-Port", priceAdder: 120 }
  ]},
  { name: "Travel Adapter Charger", category: "Chargers", subcategory: "Travel", imageUrl: IMG("chargers.jpg"), variants: [
    { label: "Universal", priceAdder: 0 }
  ]},

  // ──────────────────────── CABLES ────────────────────────
  { name: "USB-C Braided Cable", category: "Cables", subcategory: "USB-C Cables", imageUrl: IMG("cables.jpg"), variants: [
    { label: "1m", priceAdder: 0 }, { label: "2m", priceAdder: 15 }, { label: "3m", priceAdder: 25 }
  ]},
  { name: "Lightning Cable (Apple)", category: "Cables", subcategory: "Lightning Cables", imageUrl: IMG("cables.jpg"), variants: [
    { label: "1m", priceAdder: 0 }, { label: "2m", priceAdder: 20 }
  ]},
  { name: "Micro-USB Cable", category: "Cables", subcategory: "Micro-USB", imageUrl: IMG("cables.jpg"), variants: [
    { label: "1m", priceAdder: 0 }, { label: "2m", priceAdder: 10 }
  ]},
  { name: "3-in-1 Multi Cable", category: "Cables", subcategory: "Multi Cables", imageUrl: IMG("cables.jpg"), variants: [
    { label: "1.2m", priceAdder: 0 }
  ]},
  { name: "USB-C to USB-C 100W Cable", category: "Cables", subcategory: "USB-C Cables", imageUrl: IMG("cables.jpg"), variants: [
    { label: "1m 100W", priceAdder: 0 }, { label: "2m 100W", priceAdder: 25 }
  ]},

  // ──────────────────────── EARPHONES ────────────────────────
  { name: "TWS Wireless Earbuds", category: "Earphones", subcategory: "True Wireless", imageUrl: IMG("earphones.jpg"), variants: [
    { label: "Basic", priceAdder: 0 }, { label: "ANC", priceAdder: 120 }, { label: "Pro ANC", priceAdder: 250 }
  ]},
  { name: "Wired Earphones 3.5mm", category: "Earphones", subcategory: "Wired", imageUrl: IMG("earphones.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "Bass Boost", priceAdder: 20 }
  ]},
  { name: "Over-Ear Wireless Headphones", category: "Earphones", subcategory: "Headphones", imageUrl: IMG("earphones.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "ANC", priceAdder: 200 }
  ]},
  { name: "Sports Neckband Earphones", category: "Earphones", subcategory: "Neckband", imageUrl: IMG("earphones.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
  { name: "Gaming Earbuds", category: "Earphones", subcategory: "Gaming", imageUrl: IMG("earphones.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }, { label: "Low Latency", priceAdder: 80 }
  ]},

  // ──────────────────────── POWER BANKS ────────────────────────
  { name: "Slim Power Bank", category: "Power Banks", subcategory: "Slim", imageUrl: IMG("power-banks.jpg"), variants: [
    { label: "5000mAh", priceAdder: 0 }, { label: "10000mAh", priceAdder: 80 }
  ]},
  { name: "Fast Charge Power Bank", category: "Power Banks", subcategory: "Fast Charge", imageUrl: IMG("power-banks.jpg"), variants: [
    { label: "10000mAh 22.5W", priceAdder: 0 }, { label: "20000mAh 65W", priceAdder: 120 }
  ]},
  { name: "MagSafe Wireless Power Bank", category: "Power Banks", subcategory: "Wireless", imageUrl: IMG("power-banks.jpg"), variants: [
    { label: "5000mAh 15W", priceAdder: 0 }, { label: "10000mAh 15W", priceAdder: 100 }
  ]},
  { name: "High Capacity Power Bank", category: "Power Banks", subcategory: "High Capacity", imageUrl: IMG("power-banks.jpg"), variants: [
    { label: "20000mAh", priceAdder: 0 }, { label: "30000mAh", priceAdder: 150 }
  ]},

  // ──────────────────────── BLUETOOTH SPEAKERS ────────────────────────
  { name: "Portable Bluetooth Speaker", category: "Speakers", subcategory: "Portable", imageUrl: IMG("speakers.jpg"), variants: [
    { label: "Mini 5W", priceAdder: 0 }, { label: "Medium 10W", priceAdder: 80 }, { label: "Large 20W", priceAdder: 180 }
  ]},
  { name: "Waterproof Outdoor Speaker", category: "Speakers", subcategory: "Waterproof", imageUrl: IMG("speakers.jpg"), variants: [
    { label: "10W IP67", priceAdder: 0 }, { label: "20W IP67", priceAdder: 120 }
  ]},
  { name: "TWS Party Speaker (Pair)", category: "Speakers", subcategory: "Party", imageUrl: IMG("speakers.jpg"), variants: [
    { label: "2x10W", priceAdder: 0 }
  ]},
  { name: "Sound Bar Mini Speaker", category: "Speakers", subcategory: "Sound Bar", imageUrl: IMG("speakers.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},

  // ──────────────────────── SMARTWATCHES ────────────────────────
  { name: "Budget Smart Band", category: "Smartwatches", subcategory: "Smart Bands", imageUrl: IMG("smartwatches.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
  { name: "Smart Watch Fitness", category: "Smartwatches", subcategory: "Fitness", imageUrl: IMG("smartwatches.jpg"), variants: [
    { label: "1.44\" Basic", priceAdder: 0 }, { label: "1.7\" AMOLED", priceAdder: 100 }, { label: "1.96\" Premium", priceAdder: 200 }
  ]},
  { name: "Calling Smart Watch", category: "Smartwatches", subcategory: "Calling", imageUrl: IMG("smartwatches.jpg"), variants: [
    { label: "BT Call", priceAdder: 0 }, { label: "4G LTE", priceAdder: 300 }
  ]},
  { name: "Kids Smart Watch GPS", category: "Smartwatches", subcategory: "Kids", imageUrl: IMG("smartwatches.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},

  // ──────────────────────── WIRELESS CHARGERS ────────────────────────
  { name: "Wireless Charging Pad", category: "Wireless Chargers", subcategory: "Charging Pads", imageUrl: IMG("wireless-chargers.jpg"), variants: [
    { label: "10W Qi", priceAdder: 0 }, { label: "15W MagSafe", priceAdder: 60 }
  ]},
  { name: "3-in-1 Wireless Charging Stand", category: "Wireless Chargers", subcategory: "Charging Stands", imageUrl: IMG("wireless-chargers.jpg"), variants: [
    { label: "15W", priceAdder: 0 }
  ]},
  { name: "Car Wireless Charger Mount", category: "Wireless Chargers", subcategory: "Car Wireless", imageUrl: IMG("wireless-chargers.jpg"), variants: [
    { label: "15W Auto-Clamp", priceAdder: 0 }
  ]},

  // ──────────────────────── CAR MOUNTS ────────────────────────
  { name: "Dashboard Car Mount", category: "Car Mounts", subcategory: "Dashboard", imageUrl: IMG("car-mounts.jpg"), variants: [
    { label: "Suction Cup", priceAdder: 0 }, { label: "Magnetic", priceAdder: 20 }
  ]},
  { name: "Air Vent Car Mount", category: "Car Mounts", subcategory: "Vent Mounts", imageUrl: IMG("car-mounts.jpg"), variants: [
    { label: "Clip Type", priceAdder: 0 }, { label: "Magnetic", priceAdder: 15 }
  ]},
  { name: "CD Slot Car Mount", category: "Car Mounts", subcategory: "CD Slot", imageUrl: IMG("car-mounts.jpg"), variants: [
    { label: "Standard", priceAdder: 0 }
  ]},
];

export const accessoriesCatalog: CatalogAccessory[] = raw.map((a, i) => ({
  ...a,
  id: `acc-${i}`,
}));

export const accessoryCategories = [
  "All",
  ...Array.from(new Set(raw.map(a => a.category))),
];
