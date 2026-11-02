import type { Category, Product } from "@/types";

/**
 * Sample catalogue: 48 products built from 51 shop status photos.
 * Names and models were read from photos; anything uncertain is flagged
 * `nameUnconfirmed`. ALL PRICES AND STOCK ARE DEMONSTRATION VALUES.
 */

export const CATEGORIES: Category[] = [
  { id: "lighting", slug: "lighting", name: "Lighting", blurb: "LED bulbs, solar lamps and ceiling lights", icon: "Lightbulb" },
  { id: "torches", slug: "torches", name: "Torches", blurb: "Rechargeable, solar and tactical torches", icon: "Flashlight" },
  { id: "audio", slug: "audio", name: "Audio", blurb: "Speakers, radios, headphones and mics", icon: "Speaker" },
  { id: "power", slug: "power", name: "Power", blurb: "Extensions, plugs, adapters and cable", icon: "PlugZap" },
  { id: "tools", slug: "tools", name: "Tools", blurb: "Pliers, testers and soldering", icon: "Wrench" },
  { id: "home-kitchen", slug: "home-kitchen", name: "Home & Kitchen", blurb: "Kettles, gas cookers, fans and spares", icon: "CookingPot" },
  { id: "security", slug: "security-cameras", name: "Security Cameras", blurb: "Wi-Fi bulb and pan-tilt cameras", icon: "Cctv" },
  { id: "tv-mounts", slug: "tv-mounts", name: "TV Mounts", blurb: "Fixed and tilting wall brackets", icon: "Tv" },
  { id: "other", slug: "other", name: "Other", blurb: "Antennas, tape and everyday extras", icon: "Package" },
];

type V = [label: string, price: number, stock: number];

interface Def {
  id: string;
  cat: string;
  name: string;
  brand: string;
  desc: string;
  v: V[];
  imgs?: number;
  featured?: boolean;
  unconfirmed?: boolean;
  /** days before seed date the product was "added" (for New arrivals) */
  age: number;
}

const DEFS: Def[] = [
  // Lighting
  { id: "bulb-avc", cat: "lighting", name: "AVC LED Bulb (B22)", brand: "AVC", age: 40, featured: true,
    desc: "Bright, energy-saving LED bulb with a standard B22 pin base. Daylight white, long life and low running cost.",
    v: [["7W · 700lm", 120, 64], ["9W · 900lm", 150, 52], ["12W · 1200lm", 200, 38]] },
  { id: "bulb-dplight-rgb", cat: "lighting", name: "Dplight RGB Colour Bulb with Remote", brand: "Dplight", age: 12, imgs: 2,
    desc: "Colour-changing LED bulb (DP-807A / DP-809A) with a remote. Pick a colour for the sitting room or switch back to plain white.",
    v: [["7W · DP-807A", 250, 30], ["9W · DP-809A", 300, 24]] },
  { id: "cob-unit", cat: "lighting", name: "COB LED Light Module", brand: "Generic", age: 75, imgs: 2, unconfirmed: true,
    desc: "Replacement round COB LED module with leads, for surface lights and DIY fittings. Confirm wattage with staff before buying.",
    v: [["Cool white", 80, 120], ["Warm white", 80, 4]] },
  { id: "lamp-solar-shell", cat: "lighting", name: "Dplight F18-170 Solar Shell Lamp", brand: "Dplight", age: 6, featured: true,
    desc: "Rechargeable 4500mAh shell lamp with a stand and solar panel. Lights a room through a blackout.",
    v: [["Standard", 1850, 9]] },
  { id: "bulb-rechargeable-40w", cat: "lighting", name: "Dplight 3740-1 Rechargeable Emergency Bulb", brand: "Dplight", age: 30,
    desc: "40W hook-on bulb with a built-in battery. Works from mains and keeps glowing when power goes off.",
    v: [["40W", 650, 26]] },
  { id: "ceiling-light-led", cat: "lighting", name: "Round LED Ceiling Light, Decor Centre", brand: "Generic", age: 3, unconfirmed: true,
    desc: "Layered round LED ceiling light with a decorative picture centre and three light modes.",
    v: [["40 cm", 3500, 4], ["50 cm", 4800, 2]] },

  // Torches
  { id: "torch-652c", cat: "torches", name: "652C Rechargeable COB Torch with Case", brand: "Generic", age: 20, featured: true,
    desc: "Compact aluminium torch with a front beam and side COB panel. USB rechargeable, comes in a hard carry case.",
    v: [["Standard", 850, 18]] },
  { id: "torch-1056s", cat: "torches", name: "1056S Rechargeable Torch with Side Light", brand: "Generic", age: 50,
    desc: "Lightweight rechargeable torch with a bright head and long side COB strip. Charge indicator on the handle.",
    v: [["Yellow", 450, 22], ["Green", 450, 15]] },
  { id: "torch-th5155", cat: "torches", name: "TH-5155 Solar Rechargeable Torch", brand: "Generic", age: 8,
    desc: "Torch with a solar panel on the body plus USB charging and a dome lamp end. Good for homes without steady power.",
    v: [["Green", 550, 11], ["Peach", 550, 7], ["Blue", 550, 0]] },
  { id: "torch-metal-classic", cat: "torches", name: "Classic Metal Torch", brand: "Generic", age: 90, unconfirmed: true,
    desc: "Chrome-body torch with a coloured head. Simple, tough and ready for the night shift.",
    v: [["Blue", 350, 14], ["Red", 350, 12]] },
  { id: "torch-jc7125", cat: "torches", name: "JC-7125 Rechargeable Torch", brand: "Generic", age: 15,
    desc: "Rechargeable torch with a soft-touch body and USB cable. Light enough for children to carry.",
    v: [["White", 300, 20], ["Mint", 300, 16], ["Blue", 300, 3], ["Pink", 300, 10]] },
  { id: "torch-288", cat: "torches", name: "Light 288 Zoom Tactical Flashlight", brand: "Generic", age: 4, featured: true,
    desc: "Aluminium tactical torch with zoom focus and several dimming modes. Long throw for security rounds.",
    v: [["Standard", 1200, 8]] },
  { id: "torch-721", cat: "torches", name: "721 High Power Torch with Side Light", brand: "Generic", age: 25,
    desc: "High-power torch with a side LED panel, coloured indicator lights and a wrist strap. USB rechargeable.",
    v: [["Standard", 750, 17]] },

  // Audio
  { id: "speaker-phone-stand", cat: "audio", name: "Mini Bluetooth Speaker with Phone Stand", brand: "Generic", age: 10, unconfirmed: true,
    desc: "Pocket Bluetooth speaker with a phone slot on top and a carry loop. FM, TF card and USB play.",
    v: [["Red", 1100, 6], ["Black", 1100, 9], ["Blue", 1100, 5], ["Green", 1100, 3]] },
  { id: "speaker-ln726bt", cat: "audio", name: "BoomBest LN-726BT Super Bass Speaker", brand: "BoomBest", age: 18, featured: true,
    desc: "Wireless speaker with deep bass, a shoulder strap and TWS pairing. Bluetooth, USB, TF and FM.",
    v: [["Standard", 3800, 5]] },
  { id: "speaker-caston-sth10", cat: "audio", name: "Caston ST-H10 Wireless Speaker", brand: "Caston", age: 35,
    desc: "Compact fabric speaker with RGB light ring and strap. Bluetooth 5.0 with hands-free calls.",
    v: [["Black", 1500, 8], ["Red", 1500, 6]] },
  { id: "mic-bnk-b1", cat: "audio", name: "BNK B-1 Wired Microphone", brand: "BNK", age: 60,
    desc: "Dynamic handheld microphone for church, events and karaoke. Comes boxed with cable.",
    v: [["Standard", 900, 12]] },
  { id: "radio-sonitec-st5400", cat: "audio", name: "Sonitec ST-5400 8-Band Radio", brand: "Sonitec", age: 70,
    desc: "Classic multi-band radio with FM, MW and SW bands. Battery or mains powered.",
    v: [["Standard", 1350, 10]] },
  { id: "speaker-ln-f15", cat: "audio", name: "LN F15 TWS Wireless Speaker", brand: "LN", age: 22,
    desc: "Box speaker with a carry handle, TWS pairing and USB/TF playback.",
    v: [["Standard", 2600, 4]] },
  { id: "headphones-oraimo", cat: "audio", name: "Oraimo Wireless Headphones (Pure Bass)", brand: "Oraimo", age: 5, unconfirmed: true, featured: true,
    desc: "Over-ear wireless headphones with cushioned cups and long battery life. Model to be confirmed by the shop.",
    v: [["Grey", 2500, 6], ["Silver", 2500, 4], ["Green", 2500, 3], ["Pink", 2500, 2]] },
  { id: "speaker-solar-oval", cat: "audio", name: "Solar Bluetooth Speaker with FM Antenna", brand: "Generic", age: 28, unconfirmed: true,
    desc: "Oval speaker with a solar panel, telescopic FM antenna and strap. Bluetooth, USB and TF.",
    v: [["Grey", 1650, 7], ["Black", 1650, 9]] },
  { id: "radio-solar-torch", cat: "audio", name: "Solar FM Radio Speaker with Torch", brand: "Generic", age: 9, unconfirmed: true,
    desc: "Retro-styled radio speaker with a solar panel, built-in torch and phone rest. FM, Bluetooth and USB.",
    v: [["Black / Grey", 1950, 5], ["Black / Beige", 1950, 4]] },
  { id: "speaker-ln716bt", cat: "audio", name: "BoomBest LN-716BT Super Bass Speaker", brand: "BoomBest", age: 14,
    desc: "Large barrel speaker with a carry handle and strap. Loud, bass-heavy sound for outdoor use.",
    v: [["Standard", 4500, 3]] },
  { id: "mic-foam", cat: "audio", name: "BNK Microphone Foam Cover", brand: "BNK", age: 80, unconfirmed: true,
    desc: "Coloured foam windscreens for handheld mics. Reduce pops and keep mics clean.",
    v: [["Single", 100, 60], ["Pack of 5", 450, 12]] },
  { id: "speaker-ln1036bt", cat: "audio", name: "BoomBest LN-1036BT Wireless Speaker", brand: "BoomBest", age: 2,
    desc: "Square wireless speaker with a phone rest, FM antenna and wrist strap.",
    v: [["Standard", 3200, 6]] },
  { id: "radio-ns1587bt", cat: "audio", name: "NS-1587BT Solar Radio with Bluetooth", brand: "NS", age: 45,
    desc: "Multi-band radio with a detachable solar panel, Bluetooth and USB playback.",
    v: [["Standard", 2300, 0]] },

  // Power
  { id: "ext-6way", cat: "power", name: "6-Way Extension Socket", brand: "Generic", age: 55,
    desc: "Six switched 13A sockets on a long white cable. Fused plug, each socket with its own switch.",
    v: [["3 m cable", 1250, 10], ["5 m cable", 1450, 8]] },
  { id: "plug-h13a", cat: "power", name: "High Astra 13A Plug Top (H13A)", brand: "High Astra", age: 65,
    desc: "Fused 13A three-pin plug with a wiring guide on the cover.",
    v: [["Standard", 120, 140]] },
  { id: "cable-twin-earth", cat: "power", name: "Mattstarplas Twin & Earth Cable 2.5 mm²", brand: "Mattstarplas", age: 85,
    desc: "Flat twin-with-earth house wiring cable, 300/500V. Sold per metre or as a full roll.",
    v: [["Per metre", 120, 270], ["Full roll (90 m)", 9800, 3]] },
  { id: "plug-881", cat: "power", name: "Universal Socket Adapter (Model 881)", brand: "Safari", age: 60,
    desc: "Converts two-pin and foreign plugs to a UK three-pin socket. 250V.",
    v: [["Standard", 150, 85]] },
  { id: "ext-jsb-4way", cat: "power", name: "JSB 4-Way Extension Socket", brand: "JSB", age: 33,
    desc: "Four switched sockets with a fused plug, boxed. Everyday office and home use.",
    v: [["3 m cable", 1050, 14], ["5 m cable", 1300, 6]] },
  { id: "cable-speaker", cat: "power", name: "Isotstar Red/Black Speaker Cable", brand: "Isotstar", age: 48,
    desc: "Twin red/black flex for speakers, LED strips and low-voltage wiring.",
    v: [["Per metre", 40, 400], ["Roll (100 m)", 3200, 4]] },
  { id: "ext-babastra-4way", cat: "power", name: "Bab-Astra 13A 4-Way Slimline Extension", brand: "Bab-Astra", age: 16,
    desc: "Slim 4-way extension lead with individual switches and a 4 m cable.",
    v: [["4 m cable", 1250, 11]] },
  { id: "plug-travel", cat: "power", name: "Universal Travel Conversion Plug", brand: "Generic", age: 38,
    desc: "Travel adaptor that takes UK, EU, US, Australian and Chinese plugs.",
    v: [["Standard", 350, 40]] },

  // Tools
  { id: "soldering-iron-60w", cat: "tools", name: "60W Soldering Iron", brand: "Generic", age: 42,
    desc: "Mains soldering iron for electronics repair. Heats quickly, replaceable tip.",
    v: [["Blue", 450, 13], ["Yellow", 450, 9]] },
  { id: "voltage-tester", cat: "tools", name: "Dupro Voltage Tester Screwdriver", brand: "Dupro", age: 58, imgs: 2,
    desc: "Neon test screwdriver for checking live wires, 100–500V AC. Pocket clip included.",
    v: [["Small", 80, 90], ["Big", 150, 40]] },
  { id: "pliers-aweisi-8", cat: "tools", name: 'Aweisi 8" Combination Pliers', brand: "Aweisi", age: 26,
    desc: "CR-V steel combination pliers with insulated grips. Grip, cut and strip wire.",
    v: [['8"', 650, 15]] },

  // Home & kitchen
  { id: "mini-fan", cat: "home-kitchen", name: "Rechargeable Mini Handheld Fan", brand: "Generic", age: 7,
    desc: "USB-rechargeable desk and handheld fan with a stand. Quiet and light enough for a handbag.",
    v: [["Beige", 650, 8], ["Pink", 650, 12], ["White", 650, 5]] },
  { id: "cooker-coil", cat: "home-kitchen", name: "Electric Cooker Coil Element", brand: "Generic", age: 95, unconfirmed: true,
    desc: "Spiral replacement hot-plate coil for electric cookers. Check the wattage on your cooker first.",
    v: [["1000W", 450, 10], ["1500W", 550, 8], ["2000W", 650, 2]] },
  { id: "gas-regulator", cat: "home-kitchen", name: "Sungas Gas Regulator", brand: "Sungas", age: 100, unconfirmed: true,
    desc: "Clip-on LPG regulator for household gas cylinders.",
    v: [["6 kg cylinder", 650, 15], ["13 kg cylinder", 850, 9]] },
  { id: "stove-ailyons-gso14", cat: "home-kitchen", name: "Ailyons GSO14-5 Glass-Top Double Gas Cooker", brand: "Ailyons", age: 11, featured: true,
    desc: "Two-burner tempered-glass gas cooker with auto ignition and brass caps.",
    v: [["Standard", 5500, 4]] },
  { id: "kettle-ailyons", cat: "home-kitchen", name: "Ailyons 2.0L Electric Kettle (FK-0301-G)", brand: "Ailyons", age: 19, featured: true,
    desc: "Stainless steel cordless kettle with auto shut-off and boil-dry protection.",
    v: [["2.0 L", 1450, 16]] },

  // Security
  { id: "cam-panoramic-bulb", cat: "security", name: "360° Panoramic Wi-Fi Bulb Camera", brand: "Generic", age: 24,
    desc: "Screws into a light socket and streams a 360° view to your phone over Wi-Fi. Night vision and two-way audio.",
    v: [["Standard", 2800, 7]] },
  { id: "cam-narobstar-ptz", cat: "security", name: "Narobstar Light-Bulb PTZ Camera", brand: "Narobstar", age: 13,
    desc: "HD pan-and-tilt camera that fits a bulb holder. Follows motion and records to a memory card.",
    v: [["Standard", 3200, 5]] },

  // TV mounts
  { id: "mount-sh45f", cat: "tv-mounts", name: 'SH45F Fixed TV Wall Mount 26"–65"', brand: "Skill Tech", age: 52,
    desc: "Low-profile fixed bracket for flat and curved TVs. VESA up to 400×400, holds 30 kg.",
    v: [["26\"–65\"", 1200, 12]] },
  { id: "mount-sh20t", cat: "tv-mounts", name: 'SH20T Tilting TV Wall Mount 15"–43"', brand: "Skill Tech", age: 44,
    desc: "Tilting bracket for small and mid-size TVs. Angle the screen down to cut glare.",
    v: [["15\"–43\"", 950, 10]] },

  // Other
  { id: "gotv-gotenna", cat: "other", name: "GOtv GOtenna Antenna", brand: "GOtv", age: 66,
    desc: "Indoor/outdoor antenna for GOtv decoders. Improves signal in weak areas.",
    v: [["Standard", 1000, 9]] },
  { id: "tape-packing", cat: "other", name: "Clear Packing Tape 48 mm", brand: "Generic", age: 72,
    desc: "Strong clear tape for sealing cartons and parcels.",
    v: [["Single roll", 150, 48], ["Pack of 6", 800, 8]] },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/["″]/g, "in").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildSeedProducts(now: Date): Product[] {
  return DEFS.map((d, i) => {
    const created = new Date(now.getTime() - d.age * 86_400_000).toISOString();
    const sku = `DL-${String(i + 1).padStart(3, "0")}`;
    const images = Array.from({ length: d.imgs ?? 1 }, (_, k) => `/products/${d.id}-${k + 1}.webp`);
    return {
      id: d.id,
      slug: slugify(d.name),
      sku,
      categoryId: d.cat,
      name: d.name,
      brand: d.brand,
      description: d.desc,
      images,
      published: true,
      featured: !!d.featured,
      createdAt: created,
      updatedAt: created,
      nameUnconfirmed: d.unconfirmed,
      variants: d.v.map(([label, price, stock], k) => ({
        id: `${d.id}-v${k + 1}`,
        label,
        sku: `${sku}-${k + 1}`,
        price,
        stock,
        updatedAt: created,
      })),
    };
  });
}
