
const STORAGE_KEY = 'hector_weekly_tracker_v6';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const PLAN = {
  "Monday": {"academic":["Leave 08:30 → Arrive college 09:00","Classes 09:00–14:25","Arrive home 14:55","Home study 18:30–20:10 (home)"],"exercise":["Rest day"],"nutrition":["Breakfast: Protein porridge","Lunch: Steak + veg (home)","Dinner: Mindful Chef"]},
  "Tuesday": {"academic":["Leave 10:50 → Arrive college 11:20","Classes 11:20–16:45","Study 13:20–14:20 (college)","Arrive home 17:15"],"exercise":["5km run"],"nutrition":["Breakfast: Overnight oats","Lunch: Protein snack + Subway","Dinner: Mindful Chef"]},
  "Wednesday": {"academic":["Leave 10:50 → Arrive college 11:20","Classes 11:20–15:35","Arrive home 16:05","Home study 16:20–17:20 (home)"],"exercise":["Rugby training 18:00"],"nutrition":["Breakfast: Overnight oats","Lunch: Sandwich/wrap","Dinner: Mindful Chef"]},
  "Thursday": {"academic":["Leave 08:30 → Arrive college 09:00","Classes 09:00–14:25","Arrive home 14:55","Home study 18:30–19:30 (home)"],"exercise":["Hard gym 20:00"],"nutrition":["Breakfast: Protein porridge","Lunch: Steak + veg (home)","Dinner: Choice meal"]},
  "Friday": {"academic":["Leave 08:30 → Arrive college 09:00","Classes 09:00–16:45","Study 11:15–12:20 & 13:20–14:25 (college)","Arrive home 17:15"],"exercise":["Conditioning / weights / cardio"],"nutrition":["Breakfast: Protein porridge","Lunch: Protein snack + Subway","Dinner: Choice meal"]},
  "Saturday": {"academic":["No college"],"exercise":["Deload + Mobility + Run"],"nutrition":["Breakfast: Eggs","Lunch: Wrap / rice / sushi / stir fry / jacket potato + cheese","Dinner: Choice meal"]},
  "Sunday": {"academic":["No college"],"exercise":["Rugby"],"nutrition":["Breakfast: Eggs","Lunch: Wrap / rice / sushi / stir fry / jacket potato + cheese (tortellini pre-match ok)","Dinner: Family meal (Cheat day)"]}
};

function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||{} }catch(e){ return {} } }
function save(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }
const store = load();

let weekAnchor = new Date();

const monthPicker = document.getElementById('monthPicker');
const dayPicker = document.getElementById('dayPicker');
const importFile = document.getElementById('importFile');
let deferredPrompt=null;

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt = e; document.getElementById('installBtn').style.display='inline-block'; });
document.getElementById('installBtn').addEventListener('click', async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;
  document.getElementById('installBtn').style.display='none';
});

// controls
document.getElementById('todayBtn').onclick = () => { weekAnchor = new Date(); sync(); renderAll(); };
document.getElementById('prevWeek').onclick = () => { weekAnchor.setDate(weekAnchor.getDate()-7); sync(); renderWeek(); };
document.getElementById('nextWeek').onclick = () => { weekAnchor.setDate(weekAnchor.getDate()+7); sync(); renderWeek(); };
document.getElementById('goDay').onclick = () => { const d = new Date(dayPicker.value); if(!isNaN(d)) weekAnchor = d; sync(); renderWeek(); };
document.getElementById('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(store, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hector-weekly-data.json'; a.click();
};
importFile.onchange = (e) => {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => { try{
    const data = JSON.parse(r.result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    Object.keys(store).forEach(k=>delete store[k]); Object.assign(store,data);
    renderAll(); alert('Imported!');
  }catch(err){ alert('Invalid JSON'); } };
  r.readAsText(f);
};

function ymd(d){ return d.toISOString().slice(0,10); }
function getWeekStart(d){ const dt=new Date(d); const js=dt.getDay(); const diff=(js===0?-6:1)-js; dt.setDate(dt.getDate()+diff); dt.setHours(0,0,0,0); return dt; }
function sync(){ monthPicker.value = weekAnchor.toISOString().slice(0,7); dayPicker.value = weekAnchor.toISOString().slice(0,10); }

function renderWeek(){
  const cont = document.getElementById('weekCards'); cont.innerHTML='';
  const start = getWeekStart(weekAnchor);
  for(let i=0;i<7;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key = ymd(d);
    const dayLabel = DAYS[i];
    const plan = PLAN[dayLabel];
    const entry = store[key] || {a:false,e:false,n:false};

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row">
        <div class="date">${dayLabel} <span class="muted">(${key})</span></div>
      </div>
      <div class="toggles">
        <button class="big a ${entry.a?'on':''}" data-type="a">Academic ✓</button>
        <button class="big e ${entry.e?'on':''}" data-type="e">Exercise ✓</button>
        <button class="big n ${entry.n?'on':''}" data-type="n">Nutrition ✓</button>
      </div>
      <div class="cols">
        <div class="pill blue"><strong>Academic</strong><ul>${plan.academic.map(x=>`<li>${x}</li>`).join('')}</ul></div>
        <div class="pill green"><strong>Exercise</strong><ul>${plan.exercise.map(x=>`<li>${x}</li>`).join('')}</ul></div>
        <div class="pill yellow"><strong>Nutrition</strong><ul>${plan.nutrition.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      </div>
    `;

    // Toggle handlers
    card.querySelectorAll('.big').forEach(btn => btn.onclick = () => {
      const t = btn.dataset.type;
      const cur = store[key] || {a:false,e:false,n:false};
      cur[t] = !cur[t];
      store[key] = cur; save(store);
      btn.classList.toggle('on');
      renderHeatmap();
    });

    cont.appendChild(card);
  }
}

function renderHeatmap(){
  const el = document.getElementById('heatmap'); el.innerHTML='';
  const [year, month] = monthPicker.value.split('-').map(Number);
  const first = new Date(year, month-1, 1);
  const last = new Date(year, month, 0);

  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(l=>{
    const h=document.createElement('div');h.textContent=l;h.className='head';el.appendChild(h);
  });
  const offset = (first.getDay()+6)%7;
  for(let i=0;i<offset;i++){ el.appendChild(document.createElement('div')); }

  for(let d=1; d<=last.getDate(); d++){
    const date = new Date(year, month-1, d);
    const k = ymd(date);
    const val = store[k] || {a:false,e:false,n:false};
    const score = (val.a?1:0)+(val.e?1:0)+(val.n?1:0);
    let cls=''; if(score===0) cls='h0'; else if(score===1) cls='h33'; else if(score===2) cls='h66'; else if(score===3) cls='h100';
    const cell = document.createElement('div');
    cell.className = `cell ${cls}`;
    cell.textContent = d;
    cell.title = `${k}: ${score}/3 goals — click to jump`;
    cell.onclick = () => { weekAnchor = date; sync(); renderWeek(); };
    el.appendChild(cell);
  }
}

function renderAll(){ renderWeek(); renderHeatmap(); }

// Initial
sync(); renderAll();

// Optional: service worker for offline (works when hosted via https or localhost)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
