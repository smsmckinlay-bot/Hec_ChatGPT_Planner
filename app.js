
// v10: All 4 button & checks all rules for the day
const STORAGE_KEY = 'hector_weekly_tracker_v10';
const PLAN_KEY = 'hector_weekly_plan_v7';
const MEALS_KEY = 'hector_meal_ideas_v1';
const RULES_KEY = 'hector_rules_v1';
const SETTINGS_KEY = 'hector_settings_v1';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const DEFAULT_PLAN = {
  "Monday": {"academic":["Leave 08:30 → Arrive college 09:00","Classes 09:00–14:25","Arrive home 14:55","Home study 18:30–20:10 (home)"],"exercise":["Rest day"],"nutrition":["Breakfast: Protein porridge","Lunch: Protein snack + steak & veg (home)","Dinner: Mindful Chef"]},
  "Tuesday": {"academic":["Leave 10:50 → Arrive college 11:20","Classes 11:20–16:45","Study 13:20–14:20 (college)","Arrive home 17:15"],"exercise":["5km run"],"nutrition":["Breakfast: Overnight oats","Lunch: Protein snack + Subway","Dinner: Mindful Chef"]},
  "Wednesday": {"academic":["Leave 10:50 → Arrive college 11:20","Classes 11:20–15:35","Arrive home 16:05","Home study 16:20–17:20 (home)"],"exercise":["Rugby training 18:00"],"nutrition":["Breakfast: Overnight oats","Lunch: Protein snack + sandwich/wrap","Dinner: Mindful Chef"]},
  "Thursday": {"academic":["Leave 08:30 → Arrive college 09:00","Classes 09:00–14:25","Arrive home 14:55","Home study 18:30–19:30 (home)"],"exercise":["Hard gym 20:00"],"nutrition":["Breakfast: Protein porridge","Lunch: Protein snack + steak & veg (home)","Dinner: Choice meal"]},
  "Friday": {"academic":["Leave 08:30 → Arrive college 09:00","Classes 09:00–16:45","Study 11:15–12:20 & 13:20–14:25 (college)","Arrive home 17:15"],"exercise":["Conditioning / weights / cardio"],"nutrition":["Breakfast: Protein porridge","Lunch: Protein snack + Subway","Dinner: Choice meal"]},
  "Saturday": {"academic":["No college"],"exercise":["Deload + Mobility + Run"],"nutrition":["Breakfast: Eggs","Lunch: Wrap / rice / sushi / stir fry / jacket potato + cheese","Dinner: Choice meal"]},
  "Sunday": {"academic":["No college","Home study 17:00–18:00 (home)"],"exercise":["Rugby"],"nutrition":["Breakfast: Eggs","Lunch: Wrap / rice / sushi / stir fry / jacket potato + cheese (tortellini pre-match ok)","Dinner: Family meal (Cheat day)"]}
};

const DEFAULT_MEALS = [
  "Mindful Chef (Mon–Wed)",
  "Steak & veg (+ sweet potato)",
  "Steak wrap",
  "Stuffed pepper/aubergine with spicy mince",
  "Lettuce-wrap tacos (mince & veg)",
  "Chicken stir fry",
  "Baked chicken thighs with veg",
  "Spaghetti bolognese",
  "Family meal (Sun)",
  "Breakfast: Protein porridge / Eggs / Overnight oats",
  "Lunch: Protein snack + Subway / Wrap / Chicken & rice / Sushi / Stir fry / Jacket potato + cheese"
];

const DEFAULT_RULES = [
  "No sweets",
  "No chips or roast potatoes",
  "Cheese only as part of a meal (not as a snack)",
  "Max 1 piece of fruit per day"
];

function loadJSON(k,f){ try{ const v=JSON.parse(localStorage.getItem(k)); return v??f }catch{ return f } }
function saveJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)) }

const store = loadJSON(STORAGE_KEY, {});  // {'YYYY-MM-DD': {a,e,n,r,rules:{}}}
let PLAN = loadJSON(PLAN_KEY, DEFAULT_PLAN);
let MEALS = loadJSON(MEALS_KEY, DEFAULT_MEALS.slice());
let RULES = loadJSON(RULES_KEY, DEFAULT_RULES.slice());
let SETTINGS = loadJSON(SETTINGS_KEY, { showRulesBanner: true });

let weekAnchor = new Date();
const monthPicker=document.getElementById('monthPicker');
const dayPicker=document.getElementById('dayPicker');
const yearPicker=document.getElementById('yearPicker');

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; document.getElementById('installBtn').style.display='inline-block'; });
document.getElementById('installBtn').addEventListener('click', async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; document.getElementById('installBtn').style.display='none'; });

document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    btn.classList.add('active'); document.getElementById('panel-'+btn.dataset.tab).classList.remove('hidden');
    if(btn.dataset.tab==='month') renderMonth();
    if(btn.dataset.tab==='year') renderYear();
    if(btn.dataset.tab==='edit') renderEditor();
    if(btn.dataset.tab==='meals') renderMeals();
    if(btn.dataset.tab==='rules') renderRules();
  });
});

document.getElementById('todayBtn').onclick=()=>{ weekAnchor=new Date(); syncPickers(); renderWeek(); renderMonth(); };
document.getElementById('prevWeek').onclick=()=>{ weekAnchor.setDate(weekAnchor.getDate()-7); syncPickers(); renderWeek(); };
document.getElementById('nextWeek').onclick=()=>{ weekAnchor.setDate(weekAnchor.getDate()+7); syncPickers(); renderWeek(); };
document.getElementById('goDay').onclick=()=>{ const d=fromLocalYMD(dayPicker.value); if(!isNaN(d)) weekAnchor=d; syncPickers(); renderWeek(); };
document.getElementById('exportBtn').onclick=()=>{
  const data={ticks:store,plan:PLAN,meals:MEALS,rules:RULES,settings:SETTINGS};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='hector-weekly-data.json'; a.click();
};
document.getElementById('importFile').onchange=(e)=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{ try{
    const data=JSON.parse(r.result);
    if(data.ticks){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data.ticks)); Object.keys(store).forEach(k=>delete store[k]); Object.assign(store,data.ticks); }
    if(data.plan){ PLAN=data.plan; saveJSON('hector_weekly_plan_v7', PLAN); }
    if(data.meals){ MEALS=data.meals; saveJSON('hector_meal_ideas_v1', MEALS); }
    if(data.rules){ RULES=data.rules; saveJSON('hector_rules_v1', RULES); }
    if(data.settings){ SETTINGS=data.settings; saveJSON('hector_settings_v1', SETTINGS); }
    renderAll(); alert('Imported!');
  }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f);
};
document.getElementById('thisYearBtn').onclick=()=>{ const y=new Date().getFullYear(); yearPicker.value=y; renderYear(); };

function pad(n){ return n<10?'0'+n:''+n }
function localYMD(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()) }
function fromLocalYMD(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }
function getWeekStart(d){ const dt=new Date(d); const js=dt.getDay(); const diff=(js===0?-6:1)-js; dt.setDate(dt.getDate()+diff); dt.setHours(0,0,0,0); return dt }
function syncPickers(){ monthPicker.value=weekAnchor.getFullYear()+'-'+pad(weekAnchor.getMonth()+1); dayPicker.value=localYMD(weekAnchor); yearPicker.value=weekAnchor.getFullYear(); }

function renderWeek(){
  const banner=document.getElementById('rulesBanner');
  if(SETTINGS.showRulesBanner && RULES.length){
    banner.classList.remove('hidden');
    banner.innerHTML='<strong>Daily rules:</strong> '+RULES.map(r=>`<span class="rule-chip">${r}</span>`).join('');
  }else banner.classList.add('hidden');

  const cont=document.getElementById('weekCards'); cont.innerHTML='';
  const start=getWeekStart(weekAnchor);
  for(let i=0;i<7;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=localYMD(d); const dayLabel=DAYS[i]; const plan=PLAN[dayLabel];
    const entry=store[key]||{a:false,e:false,n:false,r:false,rules:{}};

    const card=document.createElement('div'); card.className='card';
    const rulesList=RULES.map((r,idx)=>{
      const on=entry.rules?.[idx]?'checked':'';
      return `<label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" data-rule="${idx}" ${on}> ${r}</label>`;
    }).join('');

    card.innerHTML=`
      <div class="row">
        <div class="date">${dayLabel} <span class="muted">(${key})</span></div>
      </div>
      <div class="toggles">
        <button class="big a ${entry.a?'on':''}" data-type="a">Academic ✓</button>
        <button class="big e ${entry.e?'on':''}" data-type="e">Exercise ✓</button>
        <button class="big n ${entry.n?'on':''}" data-type="n">Nutrition ✓</button>
        <button class="big r ${entry.r?'on':''}" data-type="r" title="Followed all nutrition rules">Rules ✓</button>
        <button class="big all4" data-type="all">✓✓✓✓ All 4</button>
      </div>
      <details style="margin-top:8px">
        <summary style="cursor:pointer;color:#334155">Daily rules checklist</summary>
        <div style="display:grid;gap:6px;margin-top:6px">${rulesList}</div>
      </details>
      <div class="cols" style="margin-top:10px">
        <div class="pill blue"><strong>Academic</strong><ul>${plan.academic.map(x=>`<li>${x}</li>`).join('')}</ul></div>
        <div class="pill green"><strong>Exercise</strong><ul>${plan.exercise.map(x=>`<li>${x}</li>`).join('')}</ul></div>
        <div class="pill yellow"><strong>Nutrition</strong><ul>${plan.nutrition.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      </div>`;

    card.querySelectorAll('.big').forEach(btn=>btn.onclick=()=>{
      const t=btn.dataset.type; const cur=store[key]||{a:false,e:false,n:false,r:false,rules:{}};
      if(t==='all'){
        cur.a=true; cur.e=true; cur.n=true; cur.r=true;
        // Mark all daily rules as checked for this date
        cur.rules = cur.rules || {};
        for(let idx=0; idx<RULES.length; idx++){ cur.rules[idx]=true; }
      } else {
        cur[t]=!cur[t];
        // Keep r synced with checkboxes
        const allChecked = RULES.length ? RULES.every((_,idx)=>cur.rules[idx]) : true;
        if(t!=='r') cur.r = allChecked;
      }
      store[key]=cur; saveJSON(STORAGE_KEY, store);
      renderWeek(); renderMonth();
    });

    card.querySelectorAll('input[type="checkbox"][data-rule]').forEach(chk=>{
      chk.addEventListener('change',()=>{
        const idx=parseInt(chk.dataset.rule,10);
        const cur=store[key]||{a:false,e:false,n:false,r:false,rules:{}};
        cur.rules=cur.rules||{}; cur.rules[idx]=chk.checked;
        cur.r = RULES.length ? RULES.every((_,i)=>!!cur.rules[i]) : true;
        store[key]=cur; saveJSON(STORAGE_KEY, store);
        renderWeek(); renderMonth();
      });
    });

    cont.appendChild(card);
  }
}

// Heatmap scoring: 0..4
function heatClass(score){ if(score<=0) return 'h0'; if(score===1) return 'h1'; if(score===2) return 'h2'; if(score===3) return 'h3'; return 'h4'; }

function renderMonth(){
  const el=document.getElementById('heatmap'); if(!el) return; el.innerHTML='';
  const parts=monthPicker.value.split('-'); if(parts.length<2) return;
  const y=parseInt(parts[0],10), m=parseInt(parts[1],10)-1;
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(l=>{ const h=document.createElement('div'); h.textContent=l; h.className='head'; el.appendChild(h); });
  const offset=(first.getDay()+6)%7; for(let i=0;i<offset;i++){ el.appendChild(document.createElement('div')); }
  for(let d=1; d<=last.getDate(); d++){
    const dt=new Date(y,m,d); const k=localYMD(dt);
    const v=store[k]||{a:false,e:false,n:false,r:false,rules:{}};
    const score=(v.a?1:0)+(v.e?1:0)+(v.n?1:0)+(v.r?1:0);
    const cell=document.createElement('div'); cell.className='cell '+heatClass(score); cell.textContent=d;
    cell.title=`${k}: ${score}/4 goals — click to jump`;
    cell.onclick=()=>{ weekAnchor=dt; syncPickers(); renderWeek(); };
    el.appendChild(cell);
  }
}

function renderYear(){
  const grid=document.getElementById('yearGrid'); grid.innerHTML='';
  const y=parseInt(yearPicker.value,10) || (new Date()).getFullYear();
  for(let m=0;m<12;m++){
    const box=document.createElement('div'); box.className='month-card';
    const title=document.createElement('div'); title.className='month-title'; title.textContent=new Date(y,m,1).toLocaleString(undefined,{month:'long'})+' '+y;
    const head=document.createElement('div'); head.className='month-grid';
    ['M','T','W','T','F','S','S'].forEach(l=>{ const h=document.createElement('div'); h.className='month-head'; h.textContent=l; head.appendChild(h); });
    const start=new Date(y,m,1), end=new Date(y,m+1,0);
    const offset=(start.getDay()+6)%7; for(let i=0;i<offset;i++){ head.appendChild(document.createElement('div')); }
    for(let d=1; d<=end.getDate(); d++){
      const dt=new Date(y,m,d); const k=localYMD(dt);
      const v=store[k]||{a:false,e:false,n:false,r:false,rules:{}};
      const score=(v.a?1:0)+(v.e?1:0)+(v.n?1:0)+(v.r?1:0);
      const cell=document.createElement('div'); cell.className='month-cell '+heatClass(score);
      cell.title=`${k}: ${score}/4`; cell.onclick=()=>{ weekAnchor=dt; syncPickers(); document.querySelector('.tab[data-tab="week"]').click(); renderWeek(); };
      head.appendChild(cell);
    }
    box.appendChild(title); box.appendChild(head); grid.appendChild(box);
  }
}

function renderEditor(){
  const ed=document.getElementById('editor'); ed.innerHTML='';
  DAYS.forEach(day=>{
    const sec=PLAN[day];
    const wrap=document.createElement('div'); wrap.className='editor-day';
    wrap.innerHTML=`<h3>${day}</h3>
      <div class="editor-col">
        <div><label>Academic (one per line)</label><textarea data-day="${day}" data-type="academic">${sec.academic.join('\\n')}</textarea></div>
        <div><label>Exercise (one per line)</label><textarea data-day="${day}" data-type="exercise">${sec.exercise.join('\\n')}</textarea></div>
        <div><label>Nutrition (one per line)</label><textarea data-day="${day}" data-type="nutrition">${sec.nutrition.join('\\n')}</textarea></div>
      </div>`;
    ed.appendChild(wrap);
  });
}
document.getElementById('savePlanBtn').onclick=()=>{
  const areas=document.querySelectorAll('#editor textarea');
  const newPlan=JSON.parse(JSON.stringify(PLAN));
  areas.forEach(a=>{ const d=a.dataset.day,t=a.dataset.type; newPlan[d][t]=a.value.split('\\n').map(s=>s.trim()).filter(Boolean); });
  PLAN=newPlan; saveJSON(PLAN_KEY, PLAN);
  alert('Plan saved.'); renderWeek(); renderMonth(); renderYear();
};
document.getElementById('resetPlanBtn').onclick=()=>{
  PLAN=JSON.parse(JSON.stringify(DEFAULT_PLAN)); saveJSON(PLAN_KEY, PLAN);
  renderEditor(); renderWeek(); renderMonth(); renderYear();
  alert('Plan reset to defaults.');
};

function renderMeals(){
  const list=document.getElementById('mealList'); list.innerHTML='';
  MEALS.forEach((m,i)=>{
    const item=document.createElement('div'); item.className='meal-item';
    item.innerHTML=`<span>${m}</span><button data-i="${i}">Delete</button>`;
    item.querySelector('button').onclick=()=>{ MEALS.splice(i,1); saveJSON(MEALS_KEY, MEALS); renderMeals(); };
    list.appendChild(item);
  });
}
document.getElementById('addMealBtn').onclick=()=>{
  const inp=document.getElementById('mealInput'); const val=inp.value.trim(); if(!val) return;
  MEALS.push(val); saveJSON(MEALS_KEY, MEALS); inp.value=''; renderMeals();
};
document.getElementById('exportMealsBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(MEALS,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='meal-ideas.json'; a.click();
};
document.getElementById('importMealsFile').onchange=(e)=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{ try{ const arr=JSON.parse(r.result); if(Array.isArray(arr)){ MEALS=arr; saveJSON(MEALS_KEY, MEALS); renderMeals(); alert('Meals imported!'); } else alert('Invalid meals file'); }catch{ alert('Invalid JSON'); } }; r.readAsText(f);
};

function renderRules(){
  document.getElementById('showRulesBanner').checked = !!SETTINGS.showRulesBanner;
  const list=document.getElementById('rulesList'); list.innerHTML='';
  RULES.forEach((rule,i)=>{
    const item=document.createElement('div'); item.className='rule-item';
    item.innerHTML=`<span>${rule}</span><button data-i="${i}">Delete</button>`;
    item.querySelector('button').onclick=()=>{ RULES.splice(i,1); saveJSON(RULES_KEY, RULES); renderRules(); };
    list.appendChild(item);
  });
}
document.getElementById('addRuleBtn').onclick=()=>{
  const inp=document.getElementById('ruleInput'); const val=inp.value.trim(); if(!val) return;
  RULES.push(val); saveJSON(RULES_KEY, RULES); inp.value=''; renderRules();
};
document.getElementById('resetRulesBtn').onclick=()=>{
  RULES = DEFAULT_RULES.slice(); saveJSON(RULES_KEY, RULES); renderRules();
};
document.getElementById('showRulesBanner').onchange=(e)=>{
  SETTINGS.showRulesBanner = e.target.checked; saveJSON(SETTINGS_KEY, SETTINGS);
  renderWeek();
};

function renderAll(){ renderWeek(); renderMonth(); }
function init(){
  const now=new Date();
  monthPicker.value = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0');
  dayPicker.value = localYMD(now);
  yearPicker.value = now.getFullYear();
  renderAll();
}
init();

if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }); }
