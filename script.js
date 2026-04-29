// script.js - Diabetes Management System (client-side only)
// Author: GitHub Copilot

// Predefined food dataset (mock)
const foodDataset = [
  {name: 'Leafy Greens', type: 'Vegetable', benefit: 'Low carb, high fiber'},
  {name: 'Broccoli', type: 'Vegetable', benefit: 'Rich in vitamins, low GI'},
  {name: 'Lentils', type: 'Protein', benefit: 'Slow-digesting carbs, protein-rich'},
  {name: 'Eggs', type: 'Protein', benefit: 'Low carb, high protein'},
  {name: 'Greek Yogurt', type: 'Dairy', benefit: 'Probiotic, moderate protein'},
  {name: 'Oats (small portion)', type: 'Grain', benefit: 'Fiber-rich, choose controlled portion'},
  {name: 'Nuts (almonds, walnuts)', type: 'Snack', benefit: 'Healthy fats, low sugar'},
  {name: 'Berries', type: 'Fruit', benefit: 'Lower sugar fruits, antioxidant-rich'},
  {name: 'Quinoa', type: 'Grain', benefit: 'Balanced carbs and protein'}
];

// Elements
const reportInput = document.getElementById('reportInput');
const previewArea = document.getElementById('previewArea');
const simulateExtractBtn = document.getElementById('simulateExtractBtn');
const clearFileBtn = document.getElementById('clearFileBtn');
const sugarInput = document.getElementById('sugarInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const displayLevel = document.getElementById('displayLevel');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const quickAdvice = document.getElementById('quickAdvice');
const adviceList = document.getElementById('adviceList');
const foodContainer = document.getElementById('food');
const toastContainer = document.getElementById('toastContainer');
const lastUpdated = document.getElementById('lastUpdated');

let currentLevel = null;
let currentFile = null;

// Utility: show toast
function showToast(message, type='info'){
  const colorClass = type === 'success' ? 'bg-success text-white' : type === 'danger' ? 'bg-danger text-white' : 'bg-dark text-white';
  const id = 'toast'+Date.now();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `\n    <div id="${id}" class="toast align-items-center ${colorClass} border-0 fade show" role="alert" aria-live="assertive" aria-atomic="true">\n      <div class="d-flex">\n        <div class="toast-body">${message}</div>\n        <button type=\"button\" class=\"btn-close btn-close-white me-2 m-auto\" data-bs-dismiss=\"toast\" aria-label=\"Close\"></button>\n      </div>\n    </div>`;
  toastContainer.appendChild(wrapper);
  setTimeout(()=>{ const t = document.getElementById(id); if(t) t.classList.remove('show'); setTimeout(()=>{ if(t) t.remove(); },400); }, 4000);
}

// Render food cards
function renderFoodSuggestions(){
  foodContainer.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'row g-3';
  foodDataset.forEach(item =>{
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card p-3 h-100 fade-in">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <h6 class="mb-1">${item.name}</h6>
              <small class="text-muted">${item.type} • ${item.benefit}</small>
            </div>
            <i class="bi bi-leaf fs-3 text-success"></i>
          </div>
        </div>
      </div>
    `;
    row.appendChild(col);
  });
  foodContainer.appendChild(row);
}

// File preview
reportInput.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  currentFile = file || null;
  previewArea.innerHTML = '';
  if(!file) return;

  const fileType = file.type;
  if(fileType.startsWith('image/')){
    const img = document.createElement('img');
    img.file = file;
    previewArea.appendChild(img);
    const reader = new FileReader();
    reader.onload = ((aImg) => (evt) => { aImg.src = evt.target.result; });
    reader.readAsDataURL(file);
  } else if(fileType === 'application/pdf' || file.name.endsWith('.pdf')){
    const embed = document.createElement('embed');
    embed.src = URL.createObjectURL(file);
    embed.type = 'application/pdf';
    embed.width = '100%';
    embed.height = '300px';
    previewArea.appendChild(embed);
  } else {
    previewArea.innerHTML = '<div class="text-muted small">Preview not available for this file type.</div>';
  }
  showToast('File loaded. You can simulate extracting value from the report.', 'success');
});

clearFileBtn.addEventListener('click', ()=>{
  reportInput.value = '';
  previewArea.innerHTML = '';
  currentFile = null;
  showToast('File cleared', 'info');
});

// Simulate extract: pick random plausible value based on dataset
simulateExtractBtn.addEventListener('click', ()=>{
  if(!currentFile){ showToast('No file uploaded to extract from', 'danger'); return; }
  // simulate reading: random between 4 and 18
  const simulated = (Math.random() * 14 + 4).toFixed(1);
  sugarInput.value = simulated;
  showToast('Simulated extraction completed: value placed into manual input field', 'success');
});

// Classification logic
function classifyLevel(val){
  const n = Number(val);
  if(isNaN(n)) return {status:'Unknown', color:'secondary', advice: ['সঠিক সংখ্যা দিন']};
  if(n >= 14) return {status:'উচ্চ ঝুঁকি', color:'danger', code:'high', adv:[
    'খুবই নিয়ন্ত্রিত ডায়েট মেনে চলুন',
    'চিনি ও উচ্চ কার্ব খাবার সম্পূর্ণ এড়িয়ে চলুন',
    'প্রচুর পানি পান করুন',
    'যত দ্রুত সম্ভব ডাক্তারের পরামর্শ নিন',
    'নিয়মিত রক্তের শুগার পরীক্ষা করুন',
    'যেকোনো অস্বাভাবিক উপসর্গ হলে দ্রুত চিকিৎসা নিন'
  ]};
  if(n >= 8) return {status:'মাঝারি', color:'warning', code:'moderate', adv:[
    'চিনি ও মিষ্টি জাতীয় খাবার এড়িয়ে চলুন',
    'ভাত, রুটি ও আলু কম খান',
    'সবজি ও আঁশযুক্ত খাবার বেশি খান',
    'হালকা ব্যায়াম করুন (৩০ মিনিট হাঁটা)',
    'প্রতিদিন নির্দিষ্ট সময়ে ওষুধ গ্রহণ করুন',
    'পর্যাপ্ত পানি পান করুন'
  ]};
  if(n >= 4) return {status:'স্বাভাবিক', color:'success', code:'normal', adv:[
    'সুষম ও নিয়মিত খাবার খান',
    'প্রতিদিন অন্তত ৩০ মিনিট হাঁটুন',
    'চিনি ও ফাস্টফুড এড়িয়ে চলুন',
    'পর্যাপ্ত ঘুম ও বিশ্রাম নিন',
    'নিয়মিত রক্তের শুগার পরীক্ষা করুন',
    'স্ট্রেস কমান ও মানসিক প্রশান্তি বজায় রাখুন'
  ]};
  return {status:'স্বাভাবিকের নিচে', color:'info', code:'low', adv:[
    'ডাক্তারের পরামর্শ নিন',
    'খাবার গ্রহণের সময় ঠিক রাখুন',
    'প্রচুর পানি পান করুন',
    'কমপক্ষে ৬-৭ ঘন্টা ঘুমান',
    'নিজেকে পর্যবেক্ষণে রাখুন'
  ]};
}

// Update dashboard
function updateDashboard(level){
  currentLevel = Number(level);
  displayLevel.textContent = isNaN(currentLevel) ? '--' : currentLevel.toFixed(1);
  const res = classifyLevel(currentLevel);
  statusText.textContent = res.status;
  // status dot color
  statusDot.className = 'status-dot mt-2';
  if(res.color === 'success') { statusDot.classList.add('status-green'); }
  else if(res.color === 'warning'){ statusDot.classList.add('status-yellow'); }
  else if(res.color === 'danger'){ statusDot.classList.add('status-red'); }
  else { statusDot.style.background = '#e9ecef'; }

  // quick advice
  quickAdvice.textContent = res.adv[0] || '';

  // advice list
  adviceList.innerHTML = '';
  res.adv.forEach(a =>{
    const item = document.createElement('div');
    item.className = 'list-group-item';
    item.innerHTML = `<div class=\"d-flex align-items-start gap-2\"><i class=\"bi bi-check-circle-fill text-success mt-1\"></i><div>${a}</div></div>`;
    adviceList.appendChild(item);
  });

  // show food suggestions filtered (simple logic)
  if(res.code === 'normal') renderFilteredFood(['Vegetable','Protein','Snack']);
  else if(res.code === 'moderate') renderFilteredFood(['Vegetable','Protein','Grain','Dairy']);
  else renderFilteredFood(['Vegetable','Protein']);

  // last updated
  lastUpdated.textContent = 'Analyzed: ' + new Date().toLocaleString();

  // toast
  showToast(`Analysis complete — Status: ${res.status}`, res.color === 'danger' ? 'danger' : 'success');
}

function renderFilteredFood(types){
  const filtered = foodDataset.filter(f => types.includes(f.type));
  foodContainer.innerHTML = '';
  const row = document.createElement('div'); row.className='row g-3';
  filtered.forEach(item =>{
    const col = document.createElement('div'); col.className='col-sm-6 col-md-4';
    col.innerHTML = `\n      <div class=\"card p-3 h-100 fade-in\">\n        <div class=\"card-body\">\n          <div class=\"d-flex align-items-center justify-content-between\">\n            <div>\n              <h6 class=\"mb-1\">${item.name}</h6>\n              <small class=\"text-muted\">${item.type} • ${item.benefit}</small>\n            </div>\n            <i class=\"bi bi-leaf fs-3 text-success\"></i>\n          </div>\n        </div>\n      </div>\n    `;
    row.appendChild(col);
  });
  foodContainer.appendChild(row);
}

// Buttons
analyzeBtn.addEventListener('click', ()=>{
  const val = sugarInput.value;
  if(!val){ showToast('Please enter a sugar level or simulate from a report', 'danger'); return; }
  updateDashboard(val);
});
resetBtn.addEventListener('click', ()=>{
  sugarInput.value = '';
  displayLevel.textContent = '--';
  statusText.textContent = '--';
  statusDot.className = 'status-dot mt-2';
  quickAdvice.textContent = 'Use upload or manual input to analyze your sugar level.';
  adviceList.innerHTML = '';
  renderFoodSuggestions();
  lastUpdated.textContent = 'Not analyzed';
  showToast('Reset complete', 'info');
});

// Chart.js CDN inject
(function addChartJs(){
  if(!document.getElementById('chartjs')){
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    s.id = 'chartjs';
    document.head.appendChild(s);
  }
})();

// Local Storage: Save & Load last 10 records
function saveRecord(level, status){
  const records = JSON.parse(localStorage.getItem('sugarRecords')||'[]');
  const newRec = {level, status, time: new Date().toLocaleString()};
  records.unshift(newRec);
  if(records.length>10) records.length=10;
  localStorage.setItem('sugarRecords', JSON.stringify(records));
}
function loadRecords(){
  return JSON.parse(localStorage.getItem('sugarRecords')||'[]');
}
function renderHistory(){
  const list = document.getElementById('historyList');
  const records = loadRecords();
  if(records.length===0){ list.innerHTML = '<div class="text-muted">কোনো রেকর্ড নেই</div>'; return; }
  list.innerHTML = '<ul class="list-group">'+records.map(r=>`<li class='list-group-item d-flex justify-content-between align-items-center'><span>${r.level} mmol/L (${r.status})</span><span class='text-muted small'>${r.time}</span></li>`).join('')+'</ul>';
}
document.getElementById('clearHistoryBtn').onclick = ()=>{ localStorage.removeItem('sugarRecords'); renderHistory(); showToast('রেকর্ড মুছে ফেলা হয়েছে','info'); };

// Chart: Render sugar level trend
let sugarChart=null;
function renderChart(){
  const ctx = document.getElementById('sugarChart').getContext('2d');
  const records = loadRecords().slice().reverse();
  const data = {
    labels: records.map(r=>r.time),
    datasets: [{
      label: 'Sugar Level (mmol/L)',
      data: records.map(r=>r.level),
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13,110,253,0.1)',
      tension:0.3,
      fill:true,
      pointRadius:4
    }]
  };
  if(sugarChart) sugarChart.destroy();
  sugarChart = new Chart(ctx, {type:'line', data, options:{scales:{y:{beginAtZero:true}}}});
}
document.getElementById('downloadChartBtn').onclick = ()=>{
  if(sugarChart){
    const a = document.createElement('a');
    a.href = sugarChart.toBase64Image();
    a.download = 'sugar_trend_chart.png';
    a.click();
  }
};

// Print/Download Report
function printReport(){
  window.print();
}
document.getElementById('printBtn').onclick = printReport;

// Bengali Language Toggle
let isBangla = false;
const langMap = {
  'Personal Diabetes Management':'ব্যক্তিগত ডায়াবেটিস ব্যবস্থাপনা',
  'Upload Medical Report':'মেডিকেল রিপোর্ট আপলোড করুন',
  'Manual Sugar Input':'ম্যানুয়াল শুগার ইনপুট',
  'Analyze':'বিশ্লেষণ করুন',
  'Reset':'রিসেট',
  'Result Dashboard':'ফলাফল ড্যাশবোর্ড',
  'Quick Advice':'দ্রুত পরামর্শ',
  'Personalized Plan':'ব্যক্তিগত পরিকল্পনা',
  'Food Suggestions':'খাবারের পরামর্শ',
  'Doctor Recommendations':'ডাক্তার সুপারিশ',
  'Not analyzed':'বিশ্লেষণ করা হয়নি',
  'Clear':'পরিষ্কার করুন',
  'Simulate Extract':'সিমুলেট এক্সট্রাক্ট',
  'Enter blood sugar in mmol/L':'রক্তের শুগার দিন (mmol/L)',
  'Status':'অবস্থা',
  'Sugar Level':'শুগার লেভেল',
  'mmol/L':'মিমল/এল',
  'Use upload or manual input to analyze your sugar level.':'আপলোড বা ইনপুট ব্যবহার করুন',
  'Contact Clinic':'ক্লিনিক যোগাযোগ',
  'Book Appointment':'অ্যাপয়েন্টমেন্ট নিন',
  'How it works':'কিভাবে কাজ করে',
  'Dashboard':'ড্যাশবোর্ড',
  'Food':'খাবার',
  'Doctors':'ডাক্তার',
  'Download Chart':'চার্ট ডাউনলোড',
  'Print/Download Report':'প্রিন্ট/ডাউনলোড রিপোর্ট',
  'বাংলা / English':'English / বাংলা',
  'Set Reminder':'রিমাইন্ডার সেট করুন',
  'Close':'বন্ধ করুন',
  'Save':'সেভ করুন',
  'Time':'সময়',
  'Message':'মেসেজ',
  'No records':'কোনো রেকর্ড নেই'
};
function toggleLanguage(){
  isBangla = !isBangla;
  // For demo: just change some static text
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    el.textContent = isBangla ? (langMap[key]||key) : key;
  });
  showToast(isBangla?'বাংলা ভাষা চালু হয়েছে':'English enabled','info');
}
document.getElementById('langToggleBtn').onclick = toggleLanguage;

// Reminder System
let reminderTimeout=null;
document.getElementById('reminderBtn').onclick = ()=>{
  const modal = new bootstrap.Modal(document.getElementById('reminderModal'));
  modal.show();
};
document.getElementById('saveReminderBtn').onclick = ()=>{
  const time = document.getElementById('reminderTime').value;
  const msg = document.getElementById('reminderMsg').value||'রিমাইন্ডার!';
  if(!time){ showToast('সময় দিন','danger'); return; }
  const now = new Date();
  const [h,m] = time.split(':');
  const target = new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0,0);
  let delay = target-now; if(delay<0) delay+=24*60*60*1000;
  if(reminderTimeout) clearTimeout(reminderTimeout);
  reminderTimeout = setTimeout(()=>{
    showToast(msg,'success');
    alert(msg);
  }, delay);
  showToast('রিমাইন্ডার সেট হয়েছে','success');
  bootstrap.Modal.getInstance(document.getElementById('reminderModal')).hide();
};

// Update: Save record and update chart/history on analyze
const origUpdateDashboard = updateDashboard;
updateDashboard = function(level){
  origUpdateDashboard(level);
  const res = classifyLevel(level);
  saveRecord(level, res.status);
  renderHistory();
  renderChart();
};

// Blood Sugar Tracker (fasting/after meal/history)
const sugarTrackerForm = document.getElementById('sugarTrackerForm');
const sugarHistory = document.getElementById('sugarHistory');
function loadSugarHistory() {
  const data = JSON.parse(localStorage.getItem('sugarHistory')||'[]');
  if (!data.length) {
    sugarHistory.innerHTML = '<div class="text-muted">কোনো তথ্য নেই</div>';
    return;
  }
  sugarHistory.innerHTML = '<ul class="list-group">' + data.map(d => `<li class='list-group-item d-flex justify-content-between align-items-center'><span>ফাস্টিং: ${d.fasting} | খাবারের পর: ${d.afterMeal} mmol/L</span><span class='text-muted small'>${d.time}</span></li>`).join('') + '</ul>';
}
sugarTrackerForm.onsubmit = function(e) {
  e.preventDefault();
  const fasting = document.getElementById('fastingInput').value;
  const afterMeal = document.getElementById('afterMealInput').value;
  if (!fasting || !afterMeal) return;
  const data = JSON.parse(localStorage.getItem('sugarHistory')||'[]');
  data.unshift({fasting, afterMeal, time: new Date().toLocaleString()});
  if (data.length > 20) data.length = 20;
  localStorage.setItem('sugarHistory', JSON.stringify(data));
  loadSugarHistory();
  sugarTrackerForm.reset();
};

// BMI Calculator
const bmiForm = document.getElementById('bmiForm');
const bmiResult = document.getElementById('bmiResult');
bmiForm.onsubmit = function(e) {
  e.preventDefault();
  const h = parseFloat(document.getElementById('heightInput').value) / 100;
  const w = parseFloat(document.getElementById('weightInput').value);
  if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
    bmiResult.innerHTML = '<span class="text-danger">সঠিক তথ্য দিন</span>';
    return;
  }
  const bmi = w / (h * h);
  let msg = `আপনার BMI: <strong>${bmi.toFixed(1)}</strong> - `;
  if (bmi < 18.5) msg += '<span class="text-info">কম ওজন</span>';
  else if (bmi < 25) msg += '<span class="text-success">স্বাভাবিক</span>';
  else if (bmi < 30) msg += '<span class="text-warning">ওভারওয়েট</span>';
  else msg += '<span class="text-danger">স্থূলতা</span>';
  bmiResult.innerHTML = msg;
};

// Chart/Visual: Sugar Range
function renderSugarRangeChart() {
  const ctx = document.getElementById('sugarRangeChart').getContext('2d');
  if(window.sugarRangeChartObj) window.sugarRangeChartObj.destroy();
  window.sugarRangeChartObj = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['স্বাভাবিক', 'মাঝারি', 'উচ্চ'],
      datasets: [{
        label: 'mmol/L',
        data: [6, 11, 16],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444']
      }]
    },
    options: {
      plugins: {legend: {display: false}},
      scales: {y: {beginAtZero: true, max: 20}}
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderFoodSuggestions();
  renderHistory();
  renderChart();
  loadTracker();
  loadSugarHistory();
  renderSugarRangeChart();
  showToast('Welcome to Diabetes Manager — All client-side demo - Muhammadullah', 'info');
});

// help button
const helpBtn = document.getElementById('helpBtn');
helpBtn.addEventListener('click', ()=>{
  const msg = `How it works:\n- Upload a report or enter sugar level manually.\n- Click Analyze to classify into Normal / Moderate / High.\n- Food suggestions and doctor info are provided.`;
  alert(msg);
});
