const WORKS = [
  {id:1027, cat:'portrait', title:'Unposed, Copenhagen', meta:'Leica M6 — 50mm ƒ/2 — Portra 400', size:'big'},
  {id:1011, cat:'documentary', title:'Fish Market, Lisbon', meta:'Leica M6 — 35mm ƒ/2 — Tri-X 400', size:'wide'},
  {id:1043, cat:'wedding', title:'First Look, Sintra', meta:'Sony A7S III — 85mm ƒ/1.4', size:'tall'},
  {id:1062, cat:'motion', title:'Coastal Wedding Film', meta:'ARRI Alexa Mini — 32mm — 24fps — 3:14', size:'', motion:true},
  {id:1005, cat:'portrait', title:'Studio Light, No. 2', meta:'Fujifilm GFX100S — 110mm ƒ/2.8', size:''},
  {id:1035, cat:'documentary', title:'Balkan Roads', meta:'Sony A7 IV — 35mm ƒ/1.8', size:'wide'},
  {id:1050, cat:'wedding', title:'The Toast', meta:'Leica M6 — 50mm ƒ/1.4 — Portra 800', size:''},
  {id:1084, cat:'motion', title:'Between Seasons, doc.', meta:'Sony FX3 — 24mm — 24fps — 6:02', size:'tall', motion:true},
  {id:64, cat:'portrait', title:'Kaia, Backstage', meta:'Contax T2 — 38mm ƒ/2.8', size:''},
  {id:342, cat:'documentary', title:'Night Bus, Tirana', meta:'Ricoh GR III — 28mm ƒ/2.8', size:''},
  {id:519, cat:'wedding', title:'Golden Hour, Douro', meta:'Fujifilm GFX100S — 110mm ƒ/2', size:'wide'},
  {id:91, cat:'motion', title:'Studio Reel, 2025', meta:'RED Komodo — 50mm — 24fps — 1:47', size:'', motion:true},
  {id:177, cat:'portrait', title:'Morning, Windowlight', meta:'Hasselblad 500C — 80mm ƒ/4', size:'tall'},
  {id:823, cat:'documentary', title:'Harvest, Alentejo', meta:'Fujifilm GFX100S — 63mm ƒ/2.8', size:''},
  {id:588, cat:'wedding', title:'Quiet Before', meta:'Contax T2 — 38mm ƒ/2.8', size:''},
  {id:433, cat:'motion', title:'Ceremony, Super 8', meta:'Super 8 Film — 2:33', size:'wide', motion:true},
];

const grid = document.getElementById('grid');
const catLabel = {portrait:'Portrait', documentary:'Documentary', wedding:'Wedding', motion:'Motion'};

WORKS.forEach((w, i) => {
  const tile = document.createElement('div');
  tile.className = 'tile' + (w.size ? ' tile--' + w.size : '');
  tile.dataset.cat = w.cat;
  tile.dataset.index = i;
  tile.innerHTML = `
    <img src="https://picsum.photos/id/${w.id}/900/1100" alt="${w.title}" loading="lazy">
    <span class="tile__frame">N&deg; ${String(i+1).padStart(3,'0')}</span>
    <span class="tile__bracket"><i></i><i></i><i></i><i></i></span>
    ${w.motion ? `<span class="tile__play"><svg viewBox="0 0 24 24"><path d="M5 3l16 9-16 9V3z"/></svg></span>` : ''}
    <div class="tile__caption">
      <div class="cat">${catLabel[w.cat]}</div>
      <div class="ti">${w.title}</div>
      <div class="meta">${w.meta}</div>
    </div>
  `;
  tile.addEventListener('click', () => openLightbox(i));
  grid.appendChild(tile);
});

// scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); } });
}, {threshold:.12});
document.querySelectorAll('.tile').forEach(t => io.observe(t));

// filters
document.getElementById('filters').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if(!btn) return;
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.filter;
  document.querySelectorAll('.tile').forEach(t => {
    const match = f === 'all' || t.dataset.cat === f;
    t.classList.toggle('hide', !match);
    if(match) t.classList.add('in-view');
  });
});

// nav solid on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('solid', window.scrollY > window.innerHeight * .7);
}, {passive:true});

document.getElementById('toTop').addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

// lightbox
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
let currentIndex = 0;

function openLightbox(i){
  currentIndex = i;
  renderLightbox();
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(){
  lb.classList.remove('open');
  document.body.style.overflow = '';
}
function renderLightbox(){
  const w = WORKS[currentIndex];
  lbImg.classList.remove('show');
  const src = `https://picsum.photos/id/${w.id}/1400/1000`;
  const img = new Image();
  img.onload = () => { lbImg.src = src; requestAnimationFrame(()=>lbImg.classList.add('show')); };
  img.src = src;
  document.getElementById('lcTitle').textContent = w.title;
  document.getElementById('lcCat').textContent = catLabel[w.cat];
  document.getElementById('lcMeta').textContent = w.meta + '  ·  N° ' + String(currentIndex+1).padStart(3,'0');
}
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => { currentIndex = (currentIndex - 1 + WORKS.length) % WORKS.length; renderLightbox(); });
document.getElementById('lbNext').addEventListener('click', () => { currentIndex = (currentIndex + 1) % WORKS.length; renderLightbox(); });
lb.addEventListener('click', e => { if(e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if(!lb.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') document.getElementById('lbNext').click();
  if(e.key === 'ArrowLeft') document.getElementById('lbPrev').click();
});
