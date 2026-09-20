// script.js — Daily Diabetes Care Guide (client-side, localStorage)
// শুধু index.html-এ যে section গুলো আছে সেগুলোর logic এখানে।

'use strict';

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const HISTORY_KEY = 'sugarHistory';
const HISTORY_LIMIT = 30;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(data) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(data.slice(0, HISTORY_LIMIT)));
}

// ---------- Sugar classification (mmol/L) ----------
// fasting ও after-meal-এর থ্রেশহোল্ড আলাদা। এটা diagnosis নয়, সাধারণ গাইড।
function classifyFasting(v) {
  if (v < 3.9) return { code: 'low', label: 'কম (হাইপো ঝুঁকি)', color: 'info' };
  if (v <= 5.6) return { code: 'normal', label: 'স্বাভাবিক', color: 'success' };
  if (v <= 6.9) return { code: 'moderate', label: 'প্রি-ডায়াবেটিস রেঞ্জ', color: 'warning' };
  if (v < 14) return { code: 'high', label: 'উচ্চ', color: 'danger' };
  return { code: 'critical', label: 'অত্যন্ত উচ্চ', color: 'danger' };
}

function classifyAfterMeal(v) {
  if (v < 3.9) return { code: 'low', label: 'কম (হাইপো ঝুঁকি)', color: 'info' };
  if (v <= 7.8) return { code: 'normal', label: 'স্বাভাবিক', color: 'success' };
  if (v <= 11.0) return { code: 'moderate', label: 'প্রি-ডায়াবেটিস রেঞ্জ', color: 'warning' };
  if (v < 14) return { code: 'high', label: 'উচ্চ', color: 'danger' };
  return { code: 'critical', label: 'অত্যন্ত উচ্চ', color: 'danger' };
}

const ADVICE = {
  low: [
    'এখনই ১৫ গ্রাম দ্রুত কার্ব নিন (আধা গ্লাস জুস বা ৩-৪টা গ্লুকোজ ট্যাবলেট)',
    '১৫ মিনিট পর আবার সুগার মাপুন',
    'ঘন ঘন কম হলে অবশ্যই ডাক্তারকে জানান — ওষুধের মাত্রা ঠিক করা লাগতে পারে'
  ],
  normal: [
    'সুষম ও নিয়মিত খাবার খান',
    'প্রতিদিন অন্তত ৩০ মিনিট হাঁটুন',
    'পর্যাপ্ত ঘুম ও বিশ্রাম নিন',
    'নিয়মিত সুগার পরীক্ষা চালিয়ে যান'
  ],
  moderate: [
    'চিনি ও মিষ্টি জাতীয় খাবার এড়িয়ে চলুন',
    'ভাত, রুটি ও আলুর পরিমাণ কমান; সবজি ও আঁশযুক্ত খাবার বাড়ান',
    'প্রতিদিন ৩০ মিনিট হাঁটুন',
    'পরবর্তী চেকআপে ডাক্তারকে এই রিডিং দেখান'
  ],
  high: [
    'নিয়ন্ত্রিত ডায়েট মেনে চলুন, চিনি ও উচ্চ কার্ব খাবার সম্পূর্ণ এড়িয়ে চলুন',
    'প্রচুর পানি পান করুন',
    'ওষুধ নিয়মিত খাচ্ছেন কি না নিশ্চিত করুন',
    'কয়েকদিন এমন থাকলে যত দ্রুত সম্ভব ডাক্তার দেখান'
  ],
  critical: [
    '⚠️ এই মাত্রা বিপজ্জনক — আজই ডাক্তার দেখান বা নিকটস্থ হাসপাতালে যান',
    'বমি, শ্বাসকষ্ট, তীব্র দুর্বলতা বা অচেতন ভাব হলে জরুরি বিভাগে যান',
    'নিজে থেকে ওষুধের মাত্রা বদলাবেন না'
  ]
};

const SEVERITY = ['normal', 'moderate', 'high', 'low', 'critical'];
function worse(a, b) {
  return SEVERITY.indexOf(a) >= SEVERITY.indexOf(b) ? a : b;
}

// ---------- Blood Sugar Tracker ----------
const sugarTrackerForm = $('sugarTrackerForm');
const sugarHistory = $('sugarHistory');
const sugarAdvice = $('sugarAdvice');
const clearHistoryBtn = $('clearHistoryBtn');

function renderSugarHistory() {
  if (!sugarHistory) return;
  const data = loadHistory();
  if (!data.length) {
    sugarHistory.innerHTML = '<div class="text-muted">কোনো তথ্য নেই</div>';
    return;
  }
  sugarHistory.innerHTML = '<ul class="list-group">' + data.map((d) => {
    const f = classifyFasting(Number(d.fasting));
    const a = classifyAfterMeal(Number(d.afterMeal));
    return `<li class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
      <span>
        ফাস্টিং: <span class="badge bg-${f.color}">${escapeHtml(d.fasting)}</span>
        &nbsp;খাবারের পর: <span class="badge bg-${a.color}">${escapeHtml(d.afterMeal)}</span> mmol/L
      </span>
      <span class="text-muted small">${escapeHtml(d.time)}</span>
    </li>`;
  }).join('') + '</ul>';
}

function renderAdvice(fasting, afterMeal) {
  if (!sugarAdvice) return;
  const f = classifyFasting(fasting);
  const a = classifyAfterMeal(afterMeal);
  const code = worse(f.code, a.code);
  const color = code === 'critical' || code === 'high' ? 'danger'
    : code === 'moderate' ? 'warning'
    : code === 'low' ? 'info' : 'success';
  sugarAdvice.innerHTML = `
    <div class="alert alert-${color} mb-0">
      <div class="fw-bold mb-2">
        ফাস্টিং: ${f.label} &nbsp;|&nbsp; খাবারের পর: ${a.label}
      </div>
      <ul class="mb-2">${ADVICE[code].map((t) => `<li>${t}</li>`).join('')}</ul>
      <small class="text-muted">এটি সাধারণ পরামর্শ, চিকিৎসা নয়। ওষুধ বা ডোজ পরিবর্তনের আগে অবশ্যই ডাক্তারের সাথে কথা বলুন।</small>
    </div>`;
}

if (sugarTrackerForm) {
  sugarTrackerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fasting = parseFloat($('fastingInput').value);
    const afterMeal = parseFloat($('afterMealInput').value);
    if (!Number.isFinite(fasting) || !Number.isFinite(afterMeal)) return;
    if (fasting > 40 || afterMeal > 40) {
      sugarAdvice.innerHTML = '<div class="alert alert-danger mb-0">মান mmol/L-এ দিন (সাধারণত ২–৩০ এর মধ্যে)। mg/dL হলে ১৮ দিয়ে ভাগ করুন।</div>';
      return;
    }
    const data = loadHistory();
    data.unshift({
      fasting: fasting.toFixed(1),
      afterMeal: afterMeal.toFixed(1),
      time: new Date().toLocaleString('bn-BD')
    });
    saveHistory(data);
    renderSugarHistory();
    renderAdvice(fasting, afterMeal);
    sugarTrackerForm.reset();
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', () => {
    if (!confirm('সব রেকর্ড মুছে ফেলবেন?')) return;
    localStorage.removeItem(HISTORY_KEY);
    renderSugarHistory();
    if (sugarAdvice) sugarAdvice.innerHTML = '';
  });
}

// ---------- BMI Calculator ----------
const bmiForm = $('bmiForm');
const bmiResult = $('bmiResult');

if (bmiForm) {
  bmiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const h = parseFloat($('heightInput').value) / 100;
    const w = parseFloat($('weightInput').value);
    if (!(h > 0) || !(w > 0)) {
      bmiResult.innerHTML = '<span class="text-danger">সঠিক তথ্য দিন</span>';
      return;
    }
    const bmi = w / (h * h);
    // দক্ষিণ এশীয়দের জন্য WHO-র কম থ্রেশহোল্ড (২৩ / ২৭.৫) ব্যবহার করা হয়েছে
    let label, color;
    if (bmi < 18.5) { label = 'কম ওজন'; color = 'info'; }
    else if (bmi < 23) { label = 'স্বাভাবিক'; color = 'success'; }
    else if (bmi < 27.5) { label = 'ওভারওয়েট'; color = 'warning'; }
    else { label = 'স্থূলতা'; color = 'danger'; }
    bmiResult.innerHTML = `আপনার BMI: <strong>${bmi.toFixed(1)}</strong> — <span class="text-${color} fw-bold">${label}</span>
      <div class="small text-muted mt-1">দক্ষিণ এশীয়দের জন্য প্রযোজ্য মানদণ্ড (স্বাভাবিক: ১৮.৫–২২.৯)</div>`;
  });
}

// ---------- Nearby Hospitals Map (Leaflet + OpenStreetMap Overpass) ----------
const hospitalMapStatus = $('hospitalMapStatus');
const hospitalList = $('hospitalList');
const findHospitalsBtn = $('findHospitalsBtn');

const sampleHospitals = [
  { name: 'BIRDEM General Hospital', location: 'শাহবাগ, ঢাকা', lat: 23.7388, lng: 90.3956, type: 'ডায়াবেটিস বিশেষায়িত' },
  { name: 'Ibrahim Cardiac Hospital & Research Institute', location: 'শাহবাগ, ঢাকা', lat: 23.7392, lng: 90.3965, type: 'বিশেষায়িত' },
  { name: 'Bangabandhu Sheikh Mujib Medical University', location: 'শাহবাগ, ঢাকা', lat: 23.7383, lng: 90.3947, type: 'সরকারি' },
  { name: 'Square Hospitals Ltd.', location: 'পান্থপথ, ঢাকা', lat: 23.7530, lng: 90.3817, type: 'বেসরকারি' },
  { name: 'Chittagong Medical College Hospital', location: 'চট্টগ্রাম', lat: 22.3590, lng: 91.8320, type: 'সরকারি' },
  { name: 'Khulna Medical College Hospital', location: 'খুলনা', lat: 22.8080, lng: 89.5450, type: 'সরকারি' },
  { name: 'Rajshahi Medical College Hospital', location: 'রাজশাহী', lat: 24.3700, lng: 88.5900, type: 'সরকারি' },
  { name: 'Sylhet M.A.G. Osmani Medical College Hospital', location: 'সিলেট', lat: 24.8990, lng: 91.8580, type: 'সরকারি' }
];

let hospitalMapInstance = null;
let hospitalMarkersLayer = null;
let userMarker = null;

function updateHospitalStatus(message) {
  if (hospitalMapStatus) hospitalMapStatus.textContent = message;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderHospitalList(hospitals) {
  if (!hospitalList) return;
  if (!hospitals.length) {
    hospitalList.innerHTML = '<div class="text-muted small">কোনো হাসপাতাল খুঁজে পাওয়া যায়নি।</div>';
    return;
  }
  hospitalList.innerHTML = '<div class="list-group">' + hospitals.slice(0, 8).map((h) => `
    <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
       href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" rel="noopener">
      <div>
        <div class="fw-semibold">${escapeHtml(h.name)}</div>
        <small class="text-muted">${escapeHtml(h.type)} · ${escapeHtml(h.location)}</small>
      </div>
      ${h.distance != null ? `<span class="badge bg-light text-dark">${h.distance.toFixed(1)} km</span>` : '<i class="bi bi-arrow-up-right"></i>'}
    </a>`).join('') + '</div>';
}

function addHospitalMarkers(hospitals) {
  if (!hospitalMapInstance) return;
  if (hospitalMarkersLayer) hospitalMarkersLayer.clearLayers();
  else hospitalMarkersLayer = window.L.layerGroup().addTo(hospitalMapInstance);
  hospitals.forEach((h) => {
    window.L.marker([h.lat, h.lng]).addTo(hospitalMarkersLayer)
      .bindPopup(`<strong>${escapeHtml(h.name)}</strong><br>${escapeHtml(h.type)}`);
  });
}

function showUserLocation(lat, lng) {
  if (!hospitalMapInstance) return;
  hospitalMapInstance.setView([lat, lng], 13);
  if (userMarker) userMarker.remove();
  userMarker = window.L.circleMarker([lat, lng], { radius: 8, color: '#0d6efd', fillOpacity: 0.9 })
    .addTo(hospitalMapInstance).bindPopup('আপনার অবস্থান').openPopup();
}

async function loadNearbyHospitals(lat, lng) {
  const query = `[out:json][timeout:25];(
    node["amenity"~"hospital|clinic"](around:8000,${lat},${lng});
    way["amenity"~"hospital|clinic"](around:8000,${lat},${lng});
  );out center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const withDistance = (list) => list
    .map((h) => ({ ...h, distance: distanceKm(lat, lng, h.lat, h.lng) }))
    .sort((a, b) => a.distance - b.distance);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('overpass');
    const data = await res.json();
    const hospitals = data.elements
      .map((item) => ({
        name: item.tags?.name || item.tags?.['name:en'] || 'Hospital',
        location: item.tags?.['addr:city'] || item.tags?.['addr:street'] || 'কাছাকাছি',
        lat: item.lat ?? item.center?.lat,
        lng: item.lon ?? item.center?.lon,
        type: item.tags?.amenity === 'clinic' ? 'ক্লিনিক' : 'হাসপাতাল'
      }))
      .filter((h) => h.lat && h.lng && h.name !== 'Hospital');

    if (hospitals.length) {
      const sorted = withDistance(hospitals);
      addHospitalMarkers(sorted.slice(0, 30));
      renderHospitalList(sorted);
      updateHospitalStatus(`আপনার ৮ কিমি-র মধ্যে ${sorted.length}টি হাসপাতাল/ক্লিনিক পাওয়া গেছে।`);
      return;
    }
  } catch {
    // fall through to sample list
  }
  const sorted = withDistance(sampleHospitals);
  addHospitalMarkers(sorted);
  renderHospitalList(sorted);
  updateHospitalStatus('কাছাকাছি তথ্য পাওয়া যায়নি, দূরত্ব অনুযায়ী প্রধান হাসপাতালগুলো দেখানো হচ্ছে।');
}

function locateAndLoad() {
  if (!navigator.geolocation) {
    updateHospitalStatus('এই ডিভাইসে লোকেশন সাপোর্ট নেই।');
    return;
  }
  updateHospitalStatus('আপনার অবস্থান জানতে চেষ্টা করছি...');
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      showUserLocation(coords.latitude, coords.longitude);
      loadNearbyHospitals(coords.latitude, coords.longitude);
    },
    () => updateHospitalStatus('অবস্থান পাওয়া যায়নি। ব্রাউজারে লোকেশন অনুমতি দিন, অথবা নিচের তালিকা দেখুন।'),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function initHospitalMap() {
  if (!$('hospitalMap')) return;
  if (typeof window.L === 'undefined') {
    updateHospitalStatus('মানচিত্র লাইব্রেরি লোড হয়নি।');
    renderHospitalList(sampleHospitals);
    return;
  }
  hospitalMapInstance = window.L.map('hospitalMap').setView([23.8103, 90.4125], 7);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(hospitalMapInstance);
  addHospitalMarkers(sampleHospitals);
  renderHospitalList(sampleHospitals);
  updateHospitalStatus('"আমার কাছের খুঁজুন" চাপলে আপনার আশেপাশের হাসপাতাল দেখাবে।');
}

if (findHospitalsBtn) findHospitalsBtn.addEventListener('click', locateAndLoad);

// ---------- Sugar range chart ----------
function renderSugarRangeChart() {
  const canvas = $('sugarRangeChart');
  if (!canvas || typeof window.Chart === 'undefined') return;
  new window.Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['স্বাভাবিক (ফাস্টিং ≤5.6)', 'প্রি-ডায়াবেটিস (5.7–6.9)', 'ডায়াবেটিস (≥7.0)', 'বিপজ্জনক (≥14)'],
      datasets: [{
        label: 'mmol/L',
        data: [5.6, 6.9, 10, 14],
        backgroundColor: ['#22c55e', '#facc15', '#f97316', '#ef4444']
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 16 } }
    }
  });
}

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  renderSugarHistory();
  initHospitalMap();
  renderSugarRangeChart();
});
