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
  if(isNaN(n)) return {status:'Unknown', color:'secondary', advice: ['Enter a valid number']};
  if(n >= 14) return {status:'High Risk', color:'danger', code:'high', adv:[
    'Strict diet plan recommended',
    'Avoid high carb foods and sugary drinks',
    'Consult a doctor immediately if you have symptoms'
  ]};
  if(n >= 8) return {status:'Moderate', color:'warning', code:'moderate', adv:[
    'Control rice and refined carbs',
    'Adopt a light exercise routine',
    'Prefer low sugar and high fiber foods'
  ]};
  if(n >= 4) return {status:'Normal', color:'success', code:'normal', adv:[
    'Maintain a balanced diet',
    '30 minutes walking daily',
    'Regular monitoring is advised'
  ]};
  return {status:'Below Normal', color:'info', code:'low', adv:['Consider consulting a provider for interpretation']};
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

// On load
window.addEventListener('DOMContentLoaded', ()=>{
  renderFoodSuggestions();
  showToast('Welcome to Diabetes Manager — All client-side demo', 'info');
});

// help button
const helpBtn = document.getElementById('helpBtn');
helpBtn.addEventListener('click', ()=>{
  const msg = `How it works:\n- Upload a report or enter sugar level manually.\n- Click Analyze to classify into Normal / Moderate / High.\n- Food suggestions and doctor info are provided.`;
  alert(msg);
});
