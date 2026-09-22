/* IIPA Registrations Map — indianahspickleball.org
   Draws a hollow Indiana outline and puts a gold dot on every school that has registered.
   Data sources: map-config.json (outline + 15 Regional Home Clubs), schools.json (412 schools with
   coordinates, mascot, team name, region), and the registration sheet published as CSV (REG_CSV_URL).
   Hover/tap a school: shows "Team · Home Club" and lights up its Home Club. Click a Home Club: highlights its schools. */
(function(){
  const NAVY='#1F3A5F', GOLD='#B8912A';
  const el=document.getElementById('iipa-reg-map'); if(!el) return;
  const REG_CSV_URL=el.dataset.regCsv||'';           // published-to-web CSV link of the responses sheet
  const SCHOOL_COL=el.dataset.schoolCol||'School';   // header of the school column in that sheet
  const base=el.dataset.base||'';                     // folder holding map-config.json and schools.json
  const demo=el.dataset.demo==='true';
  Promise.all([fetch(base+'map-config.json').then(r=>r.json()),fetch(base+'schools.json').then(r=>r.json())]).then(([cfg,schools])=>{
    const [W,H]=cfg.viewBox; const P=(lon,lat)=>[(lon-cfg.lon0)/(cfg.lon1-cfg.lon0)*W,(cfg.lat1-lat)/(cfg.lat1-cfg.lat0)*H];
    const key=s=>s.toLowerCase().replace(/h\.s\.|high school/g,'').replace(/[^a-z0-9]/g,'');
    const byKey={}; schools.forEach(s=>{byKey[key(s.db_name)]=s; byKey[key(s.school)]=s;});
    const clubByRegion={}; cfg.clubs.forEach(c=>clubByRegion[c.region]=c);
    const svgNS='http://www.w3.org/2000/svg'; const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.style.width='100%'; svg.style.height='auto'; svg.style.fontFamily='"Source Sans 3",Arial,sans-serif';
    const mk=(t,a)=>{const e=document.createElementNS(svgNS,t); for(const k in a) e.setAttribute(k,a[k]); return e;};
    svg.appendChild(mk('path',{d:cfg.oh_path,fill:'none',stroke:NAVY,'stroke-width':1.6,'stroke-opacity':0.45}));
    svg.appendChild(mk('path',{d:cfg.in_path,fill:'none',stroke:NAVY,'stroke-width':2.6,'stroke-linejoin':'round'}));
    const clubDots={};
    cfg.clubs.forEach(c=>{const [x,y]=P(c.lon,c.lat); const g=mk('g',{class:'club',style:'cursor:pointer'});
      g.appendChild(mk('circle',{cx:x,cy:y,r:9,fill:'#fff',stroke:NAVY,'stroke-width':2.5}));
      g.appendChild(mk('circle',{cx:x,cy:y,r:3.5,fill:NAVY}));
      g.addEventListener('click',()=>toggleRegion(c.region)); clubDots[c.region]=g; svg.appendChild(g);});
    const tip=document.createElement('div'); tip.style.cssText='position:absolute;pointer-events:none;background:'+NAVY+';color:#fff;padding:6px 10px;border-radius:5px;font:600 14px/1.2 "Source Sans 3",Arial,sans-serif;display:none;white-space:nowrap;z-index:5';
    el.style.position='relative'; el.appendChild(svg); el.appendChild(tip);
    const count=document.createElement('div'); count.style.cssText='margin-top:6px;color:#6B7280;font:15px "Source Sans 3",Arial,sans-serif'; el.appendChild(count);
    let activeRegion=null; const schoolDots=[];
    function toggleRegion(r){activeRegion=(activeRegion===r)?null:r; schoolDots.forEach(d=>d.el.setAttribute('opacity',(activeRegion===null||d.s.region===activeRegion)?1:0.2)); Object.keys(clubDots).forEach(k=>clubDots[k].setAttribute('opacity',(activeRegion===null||+k===activeRegion)?1:0.3));}
    function draw(registered){
      registered.forEach(name=>{const s=byKey[key(name)]; if(!s) return; if(schoolDots.some(d=>d.s.db_name===s.db_name)) return;
        const [x,y]=P(s.lon,s.lat); const c=mk('circle',{cx:x,cy:y,r:6.5,fill:GOLD,stroke:'#fff','stroke-width':2,style:'cursor:pointer'});
        const club=clubByRegion[s.region];
        const show=ev=>{tip.textContent=s.team+' · '+(club?club.name:''); tip.style.display='block'; const b=el.getBoundingClientRect(); tip.style.left=(ev.clientX-b.left+12)+'px'; tip.style.top=(ev.clientY-b.top-34)+'px'; c.setAttribute('r',9); if(club) clubDots[club.region].firstChild.setAttribute('fill',GOLD);};
        const hide=()=>{tip.style.display='none'; c.setAttribute('r',6.5); if(club) clubDots[club.region].firstChild.setAttribute('fill','#fff');};
        c.addEventListener('mousemove',show); c.addEventListener('mouseleave',hide); c.addEventListener('click',ev=>{show(ev); setTimeout(hide,2500);});
        svg.appendChild(c); schoolDots.push({el:c,s});});
      count.textContent=schoolDots.length+' school'+(schoolDots.length===1?'':'s')+' registered · '+cfg.clubs.length+' Regional Home Clubs';
    }
    function parseCSV(t){const rows=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'&&t[i+1]==='"'){f+='"';i++;}else if(ch==='"')q=false;else f+=ch;}else if(ch==='"')q=true;else if(ch===','){row.push(f);f='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f='';}else f+=ch;}if(f||row.length){row.push(f);rows.push(row);}return rows;}
    if(demo){draw(['Rushville H.S.','Avon H.S.','Carmel H.S.','Penn H.S.','Castle H.S.','Floyd Central H.S.','Warsaw Community H.S.']); return;}
    if(!REG_CSV_URL){draw([]); return;}
    fetch(REG_CSV_URL).then(r=>r.text()).then(t=>{const rows=parseCSV(t); const hdr=rows[0]; const i=hdr.findIndex(h=>h.trim().toLowerCase().startsWith(SCHOOL_COL.toLowerCase())); draw(i<0?[]:rows.slice(1).map(r=>r[i]).filter(Boolean));}).catch(()=>draw([]));
  });
})();