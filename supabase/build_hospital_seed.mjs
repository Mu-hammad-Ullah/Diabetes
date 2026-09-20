// hospitals_source.json → seed_hospitals.sql
// - lat/lng নেই এমন entry Nominatim (OpenStreetMap) দিয়ে geocode (1 req/sec, free)
// - না পেলে জেলা-level coordinate (coord_source = 'district')
// - geocode result cache → hospitals_geocode_cache.json (বারবার চালালে আবার call হয় না)
// Run: node supabase/build_hospital_seed.mjs

import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = path.join(dir, 'hospitals_source.json');
const CACHE = path.join(dir, 'hospitals_geocode_cache.json');
const OUT = path.join(dir, 'seed_hospitals.sql');

const rows = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

// অফিস/কলেজ — হাসপাতাল নয়, বাদ
const SKIP = new Set(['NHN Head Office', 'Ibrahim Medical College']);

const TYPE = { BADAS: 'diabetic_center', NHN: 'diabetic_center', 'Diabetic Association': 'diabetic_center', Government: 'hospital', Private: 'hospital', Diagnostic: 'clinic' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nominatim(q) {
  if (q in cache) return cache[q];
  await sleep(1100);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bd&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'diabetes-care-seed/1.0 (github.com/Mu-hammad-Ullah/Diabetes)' } });
  const json = res.ok ? await res.json() : [];
  const hit = json[0] ? { lat: Number(json[0].lat), lng: Number(json[0].lon), display: json[0].display_name } : null;
  cache[q] = hit;
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  return hit;
}

// জেলা-শহর (district HQ) coordinate — geocode যাচাই ও fallback-এর জন্য
const DISTRICT = {
  Dhaka: [23.7639, 90.3890], Gazipur: [23.9999, 90.4203], Narayanganj: [23.6238, 90.5000], Manikganj: [23.8617, 90.0003],
  Munshiganj: [23.5422, 90.5305], Kishoreganj: [24.4260, 90.7820], Tangail: [24.2513, 89.9167], Faridpur: [23.6070, 89.8429],
  Gopalganj: [23.0050, 89.8266], Chattogram: [22.3569, 91.7832], "Cox's Bazar": [21.4272, 92.0058], Bandarban: [22.1953, 92.2184],
  Cumilla: [23.4607, 91.1809], Brahmanbaria: [23.9571, 91.1119], Chandpur: [23.2333, 90.6710], Feni: [23.0159, 91.3976],
  Noakhali: [22.8696, 91.0994], Lakshmipur: [22.9443, 90.8300], Rajshahi: [24.3745, 88.6042], Bogura: [24.8481, 89.3730],
  Pabna: [24.0064, 89.2372], Sirajganj: [24.4534, 89.7007], Chapainawabganj: [24.5965, 88.2776], Khulna: [22.8456, 89.5403],
  Jashore: [23.1667, 89.2089], Kushtia: [23.9013, 89.1200], Satkhira: [22.7185, 89.0705], Bagerhat: [22.6516, 89.7853],
  Chuadanga: [23.6402, 88.8418], Jhenaidah: [23.5450, 89.1539], Barishal: [22.7010, 90.3535], Bhola: [22.6859, 90.6482],
  Barguna: [22.1590, 90.1257], Patuakhali: [22.3596, 90.3299], Sylhet: [24.8949, 91.8687], Habiganj: [24.3745, 91.4155],
  Moulvibazar: [24.4829, 91.7774], Rangpur: [25.7439, 89.2752], Dinajpur: [25.6217, 88.6355], Nilphamari: [25.9310, 88.8560],
  Panchagarh: [26.3411, 88.5542], Mymensingh: [24.7471, 90.4203], Jamalpur: [24.9375, 89.9377], Sherpur: [25.0205, 90.0153],
};
const km = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
// geocode result জেলা-শহরের কাছাকাছি (Dhaka ৩০ কিমি, অন্য ২০ কিমি) হলে গ্রহণ
const nearDistrict = (p, district) => {
  if (!p) return false; const d = DISTRICT[district]; if (!d) return p.lat > 20.5 && p.lat < 26.7 && p.lng > 88 && p.lng < 92.8;
  return km(p.lat, p.lng, d[0], d[1]) <= (district === 'Dhaka' ? 30 : 20);
};

const out = [];
let geocoded = 0, districtLevel = 0;
for (const h of rows) {
  if (SKIP.has(h.name)) continue;
  let lat = Number(h.latitude), lng = Number(h.longitude), source = h.coord_source || 'OpenStreetMap';
  if (!lat || !lng) {
    // 1) নাম + জেলা  2) ঠিকানা  3) জেলা
    const tries = [`${h.name}, ${h.district}, Bangladesh`, `${h.address}, Bangladesh`];
    let hit = null;
    for (const q of tries) {
      hit = await nominatim(q);
      if (nearDistrict(hit, h.district)) break;
      hit = null;
    }
    if (hit) { lat = hit.lat; lng = hit.lng; source = 'geocoded'; geocoded++; }
    else if (DISTRICT[h.district]) { [lat, lng] = DISTRICT[h.district]; source = 'district'; districtLevel++; }
    else { console.error('NO COORDS:', h.name); continue; }
    process.stderr.write(`${source.padEnd(9)} ${h.name} → ${lat.toFixed(5)}, ${lng.toFixed(5)}\n`);
  }
  const phone = (h.phone || '').split(';')[0].replace(/Emergency/i, '').trim() || null;
  out.push({
    name: h.name.trim(), name_bn: h.name_bn?.trim() || null, type: TYPE[h.category] ?? 'hospital',
    address: [h.address, h.division && h.division !== h.district ? `${h.division} Division` : null].filter(Boolean).join(' · '),
    city: h.district, lat: +lat.toFixed(6), lng: +lng.toFixed(6), phone,
    website: h.source_url && !/facebook|findoutdoctor|doctoraidbd|daktarachen|healthdirectorybd|sebaghar|openstreetmap|hris\.mohfw/.test(h.source_url) ? h.source_url : null,
    specialized: ['BADAS', 'NHN', 'Diabetic Association'].includes(h.category),
    source,
  });
}

// duplicate (name, city) — শেষেরটা রাখা
const seen = new Map();
for (const r of out) seen.set(`${r.name}|${r.city}`, r);
const rowsOut = [...seen.values()];

const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const sql = `-- =====================================================================
--  Curated hospital list — বাংলাদেশ (${rowsOut.length} entries)
--  Source: supabase/hospitals_source.json → build_hospital_seed.mjs (auto-generated, হাতে edit করবেন না;
--  পরিবর্তন করতে JSON বদলে script আবার চালান, অথবা admin panel থেকে edit করুন)
--  coord source: OpenStreetMap-verified ${rowsOut.filter((r) => r.source === 'OpenStreetMap').length},
--  geocoded from address ${geocoded}, district-level (approx) ${districtLevel}
--  Run: Supabase → SQL Editor → paste → Run
-- =====================================================================

create unique index if not exists hospitals_name_city_uidx on public.hospitals (name, city);

-- v1 seed-এর পুরনো BD row (নাম সামান্য আলাদা ছিল) পুরোপুরি সরিয়ে এই list বসানো হচ্ছে।
-- ⚠️ admin panel থেকে নিজে যোগ করা BD hospital থাকলে সেগুলোও মুছবে — চাইলে নিচের লাইন comment করুন।
delete from public.hospitals where country_code = 'BD';

insert into public.hospitals (name, name_bn, type, address, city, country_code, lat, lng, phone, website, is_diabetes_specialized) values
${rowsOut.map((r) => `(${q(r.name)}, ${q(r.name_bn)}, ${q(r.type)}, ${q(r.address)}, ${q(r.city)}, 'BD', ${r.lat}, ${r.lng}, ${q(r.phone)}, ${q(r.website)}, ${r.specialized})`).join(',\n')}
on conflict (name, city) do update
  set name_bn = excluded.name_bn,
      type = excluded.type,
      address = excluded.address,
      lat = excluded.lat,
      lng = excluded.lng,
      phone = excluded.phone,
      website = excluded.website,
      is_diabetes_specialized = excluded.is_diabetes_specialized;
`;
fs.writeFileSync(OUT, sql);
console.log(`wrote ${OUT}: ${rowsOut.length} rows (geocoded ${geocoded}, district-level ${districtLevel})`);
