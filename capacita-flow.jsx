import { useState, useMemo } from "react";

// ─── DATA ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "seg", label: "⚡ Seguridad", courses: [
    { id: "c1", name: "Uso de EPP", maxPerSlot: 15 },
    { id: "c2", name: "Trabajo en Altura", maxPerSlot: 10 },
    { id: "c3", name: "Espacios Confinados", maxPerSlot: 8 },
    { id: "c4", name: "Bloqueo y Etiquetado (LOTO)", maxPerSlot: 12 },
  ]},
  { id: "cal", label: "✓ Calidad", courses: [
    { id: "c5", name: "ISO 9001 Básico", maxPerSlot: 20 },
    { id: "c6", name: "Control de Documentos", maxPerSlot: 20 },
    { id: "c7", name: "Auditorías Internas", maxPerSlot: 15 },
  ]},
  { id: "ope", label: "⚙ Operaciones", courses: [
    { id: "c8", name: "Manejo Manual de Cargas", maxPerSlot: 12 },
    { id: "c9", name: "Operación de Maquinaria Pesada", maxPerSlot: 6 },
  ]},
  { id: "med", label: "◈ Medioambiente", courses: [
    { id: "c10", name: "Gestión de Residuos", maxPerSlot: 18 },
    { id: "c11", name: "Manejo de Derrames Químicos", maxPerSlot: 10 },
  ]},
  { id: "eme", label: "✦ Emergencias", courses: [
    { id: "c12", name: "Primeros Auxilios", maxPerSlot: 16 },
    { id: "c13", name: "Uso de Extintor", maxPerSlot: 20 },
    { id: "c14", name: "Procedimiento de Evacuación", maxPerSlot: 30 },
  ]},
];

const ALL_COURSES = CATEGORIES.flatMap(c => c.courses);

const WORKERS = [
  { id:"w1",  name:"Carlos Muñoz Vega",       rut:"12.345.678-9", hireDate:"2021-03-15", contractor:"Constructora Sur S.A." },
  { id:"w2",  name:"Ana Rodríguez Silva",      rut:"15.678.901-2", hireDate:"2022-07-01", contractor:"Servicios Norte Ltda." },
  { id:"w3",  name:"Pedro Castillo Ríos",      rut:"10.234.567-8", hireDate:"2020-01-20", contractor:"Mantención Andina SpA" },
  { id:"w4",  name:"Valentina Parra Gómez",    rut:"17.890.123-4", hireDate:"2023-02-14", contractor:"Constructora Sur S.A." },
  { id:"w5",  name:"Felipe Herrera Torres",    rut:"13.456.789-0", hireDate:"2021-09-05", contractor:"TechOps Chile Ltda." },
  { id:"w6",  name:"Camila Lagos Sepúlveda",   rut:"16.789.012-3", hireDate:"2022-11-30", contractor:"Servicios Norte Ltda." },
  { id:"w7",  name:"Andrés Morales Fuentes",   rut:"11.234.567-K", hireDate:"2019-06-17", contractor:"Mantención Andina SpA" },
  { id:"w8",  name:"Daniela Soto Reyes",       rut:"14.567.890-1", hireDate:"2023-08-22", contractor:"TechOps Chile Ltda." },
  { id:"w9",  name:"Rodrigo Díaz Sandoval",    rut:"18.901.234-5", hireDate:"2024-01-10", contractor:"Constructora Sur S.A." },
  { id:"w10", name:"Javiera Flores Medina",    rut:"12.890.345-6", hireDate:"2022-04-03", contractor:"Servicios Norte Ltda." },
  { id:"w11", name:"Ignacio Vargas Acosta",    rut:"19.234.567-7", hireDate:"2023-11-15", contractor:"TechOps Chile Ltda." },
  { id:"w12", name:"Sofía Contreras Bravo",    rut:"13.678.901-8", hireDate:"2020-08-28", contractor:"Mantención Andina SpA" },
];

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DSHORT  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const TODAY   = "2026-04-02";

// ─── HELPERS ───────────────────────────────────────────────────────────────

let _uid = 20;
const uid  = () => `s${_uid++}`;
const gc   = id => ALL_COURSES.find(c => c.id === id);
const dim  = (y,m) => new Date(y, m+1, 0).getDate();
const fdm  = (y,m) => new Date(y, m, 1).getDay();
const tds  = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const fmtD = s => s ? s.split("-").reverse().join("/") : "—";
const past  = d => d < TODAY;

// ─── PALETTE / BASE STYLES ─────────────────────────────────────────────────

const C = {
  bg:"#07090d", sf:"#0d1117", sf2:"#111827", bd:"#181f2d", bd2:"#252f40",
  am:"#f59e0b", amD:"rgba(245,158,11,.11)", amB:"rgba(245,158,11,.18)",
  tx:"#dde4f0", ts:"#6b7a96", tm:"#3a4560",
  gr:"#10b981", rd:"#ef4444",
};

const I = { // base input style
  background:C.sf2, border:`1px solid ${C.bd2}`, borderRadius:4,
  color:C.tx, padding:"5px 9px", fontSize:12, outline:"none",
  width:"100%", boxSizing:"border-box", fontFamily:"inherit",
};

const Btn = (active) => ({
  background: active ? C.amD : "transparent",
  border:`1px solid ${active ? C.am : C.bd2}`,
  color: active ? C.am : C.ts,
  padding:"5px 16px", borderRadius:4, cursor:"pointer",
  fontSize:11, fontWeight: active ? 700 : 400,
  fontFamily:"inherit", letterSpacing:"0.04em", transition:"all .15s",
});

// ─── COURSE TREE ───────────────────────────────────────────────────────────

function CourseTree({ sel, onSel }) {
  const [open, setOpen] = useState({});
  const tog = id => setOpen(p => ({...p, [id]: !p[id]}));

  return (
    <nav style={{padding:"6px 0"}}>
      {CATEGORIES.map(cat => (
        <div key={cat.id}>
          <div onClick={() => tog(cat.id)} style={{
            display:"flex", alignItems:"center", gap:7, padding:"7px 14px",
            cursor:"pointer", userSelect:"none", color:C.ts,
            fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase",
          }}>
            <span style={{
              fontSize:7, color:C.tm, display:"inline-block", transition:"transform .2s",
              transform: open[cat.id] ? "rotate(90deg)" : "none"
            }}>▶</span>
            {cat.label}
          </div>
          {open[cat.id] && cat.courses.map(c => (
            <div key={c.id} onClick={() => onSel(c.id)} style={{
              padding:"7px 14px 7px 28px", cursor:"pointer", fontSize:12,
              color: sel===c.id ? C.am : C.tx,
              background: sel===c.id ? C.amD : "transparent",
              borderLeft:`2px solid ${sel===c.id ? C.am : "transparent"}`,
              transition:"all .15s",
            }}>
              <div style={{lineHeight:1.3}}>{c.name}</div>
              <div style={{fontSize:10, color:C.tm, marginTop:2}}>máx {c.maxPerSlot} participantes</div>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

// ─── AGENDA WIDGET ─────────────────────────────────────────────────────────

const DMINI = ["D","L","M","X","J","V","S"];

// Shared slot card used by all views
function SlotCard({ slot, isSel, onSelSlot, compact=false }) {
  const avail = slot.max - slot.enrolled.length;
  const full  = avail === 0;
  return (
    <div onClick={() => !full && onSelSlot(slot)} style={{
      padding: compact ? "4px 7px" : "8px 10px",
      borderRadius: compact ? 3 : 5,
      border:`1px solid ${isSel ? C.am : C.bd}`,
      background: isSel ? C.amD : full ? "rgba(15,20,30,.4)" : C.sf2,
      cursor: full ? "not-allowed" : "pointer",
      opacity: full ? .55 : 1,
      transition:"all .15s",
      marginBottom: compact ? 2 : 0,
    }}>
      <div style={{fontSize: compact ? 10 : 11, color: isSel ? C.am : C.tx, fontWeight:600, lineHeight:1.3}}>
        {slot.start}–{slot.end}
      </div>
      <div style={{display:"flex", justifyContent:"space-between", marginTop:2}}>
        <span style={{fontSize:9, color: full ? C.rd : C.gr}}>
          {full ? "lleno" : `${avail} libre${avail!==1?"s":""}`}
        </span>
        <span style={{fontSize:9, color:C.tm}}>{slot.enrolled.length}/{slot.max}</span>
      </div>
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────
function AgendaList({ slots, selSlot, onSelSlot }) {
  const byDate = {};
  slots.forEach(s => { (byDate[s.date]??=[]).push(s); });
  return (
    <div>
      {Object.keys(byDate).sort().map(date => (
        <div key={date} style={{marginBottom:6}}>
          <div style={{padding:"5px 12px 3px", fontSize:10, color:C.am, fontWeight:700, letterSpacing:"0.06em"}}>
            {fmtD(date)}
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:3, padding:"0 8px"}}>
            {byDate[date].map(slot => (
              <SlotCard key={slot.id} slot={slot} isSel={selSlot?.id===slot.id} onSelSlot={onSelSlot}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Monthly mini-calendar ──────────────────────────────────────────────────
function AgendaMonth({ slots, selSlot, onSelSlot }) {
  const [year,  setYear]  = useState(+TODAY.slice(0,4));
  const [month, setMonth] = useState(+TODAY.slice(5,7)-1);
  const [dayPk, setDayPk] = useState(null);

  const prevM = () => { const d=new Date(year,month-1); setYear(d.getFullYear()); setMonth(d.getMonth()); setDayPk(null); };
  const nextM = () => { const d=new Date(year,month+1); setYear(d.getFullYear()); setMonth(d.getMonth()); setDayPk(null); };

  const byDate = {};
  slots.forEach(s => { (byDate[s.date]??=[]).push(s); });

  const days = dim(year,month);
  const fd   = fdm(year,month);
  const pickedSlots = dayPk ? (byDate[dayPk]||[]) : [];

  return (
    <div>
      {/* nav */}
      <div style={{display:"flex", alignItems:"center", padding:"6px 10px 4px", gap:4}}>
        <button onClick={prevM} style={{
          background:"none", border:`1px solid ${C.bd}`, color:C.ts,
          padding:"1px 6px", cursor:"pointer", borderRadius:2, fontSize:13, fontFamily:"inherit", lineHeight:1.4
        }}>‹</button>
        <span style={{flex:1, textAlign:"center", fontSize:10, color:C.tx, fontWeight:600, letterSpacing:"0.05em"}}>
          {MONTHS[month].slice(0,3)} {year}
        </span>
        <button onClick={nextM} style={{
          background:"none", border:`1px solid ${C.bd}`, color:C.ts,
          padding:"1px 6px", cursor:"pointer", borderRadius:2, fontSize:13, fontFamily:"inherit", lineHeight:1.4
        }}>›</button>
      </div>

      {/* day headers */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 6px", gap:1}}>
        {DMINI.map(d => (
          <div key={d} style={{textAlign:"center", fontSize:8, color:C.tm, fontWeight:700, padding:"2px 0"}}>{d}</div>
        ))}
      </div>

      {/* grid */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 6px 6px", gap:2}}>
        {Array.from({length:fd}).map((_,i) => <div key={`e${i}`}/>)}
        {Array.from({length:days}).map((_,i) => {
          const d    = i+1;
          const date = tds(year,month,d);
          const ds   = byDate[date]||[];
          const isT  = date===TODAY;
          const isPk = dayPk===date;
          const hasFree = ds.some(s => s.enrolled.length < s.max);
          const allFull = ds.length > 0 && ds.every(s => s.enrolled.length >= s.max);
          return (
            <div key={d}
              onClick={() => ds.length && setDayPk(isPk ? null : date)}
              style={{
                height:24, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center",
                flexDirection:"column", cursor: ds.length ? "pointer" : "default",
                background: isPk ? C.amD : isT ? "rgba(245,158,11,.07)" : "transparent",
                border:`1px solid ${isPk ? C.am : isT ? C.am+"55" : C.bd}`,
                transition:"all .12s", position:"relative",
              }}
            >
              <span style={{
                fontSize:9, color: isT ? C.am : ds.length ? C.tx : C.ts,
                fontWeight: isT ? 700 : 400, lineHeight:1
              }}>{d}</span>
              {ds.length > 0 && (
                <span style={{
                  width:4, height:4, borderRadius:"50%", marginTop:1,
                  background: allFull ? C.rd : hasFree ? C.gr : C.tm,
                  display:"block",
                }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* slots for picked day */}
      {dayPk && (
        <div style={{borderTop:`1px solid ${C.bd}`, padding:"8px 8px 4px"}}>
          <div style={{fontSize:9, color:C.am, fontWeight:700, letterSpacing:"0.08em", marginBottom:5, paddingLeft:2}}>
            {fmtD(dayPk)}
          </div>
          {pickedSlots.length === 0 ? (
            <div style={{fontSize:10, color:C.tm, padding:"4px 2px"}}>Sin sesiones este día.</div>
          ) : pickedSlots.map(slot => (
            <SlotCard key={slot.id} slot={slot} isSel={selSlot?.id===slot.id} onSelSlot={onSelSlot} compact/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Weekly view ────────────────────────────────────────────────────────────
function AgendaWeek({ slots, selSlot, onSelSlot }) {
  // Anchor to Monday of current week
  const todayDate = new Date(TODAY);
  const mondayBase = new Date(todayDate);
  mondayBase.setDate(todayDate.getDate() - ((todayDate.getDay()+6)%7));

  const [weekOffset, setWeekOffset] = useState(0);

  const monday = new Date(mondayBase);
  monday.setDate(mondayBase.getDate() + weekOffset*7);

  const weekDays = Array.from({length:7}, (_,i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    return d;
  });

  const byDate = {};
  slots.forEach(s => { (byDate[s.date]??=[]).push(s); });

  const fmtWD = d => `${DMINI[(d.getDay())]} ${d.getDate()}`;
  const toStr = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const rangeLabel = () => {
    const s = weekDays[0], e = weekDays[6];
    const sm = MONTHS[s.getMonth()].slice(0,3), em = MONTHS[e.getMonth()].slice(0,3);
    return sm===em ? `${s.getDate()}–${e.getDate()} ${sm}` : `${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
  };

  return (
    <div>
      {/* nav */}
      <div style={{display:"flex", alignItems:"center", padding:"6px 10px 6px", gap:4}}>
        <button onClick={()=>setWeekOffset(p=>p-1)} style={{
          background:"none", border:`1px solid ${C.bd}`, color:C.ts,
          padding:"1px 6px", cursor:"pointer", borderRadius:2, fontSize:13, fontFamily:"inherit", lineHeight:1.4
        }}>‹</button>
        <span style={{flex:1, textAlign:"center", fontSize:9, color:C.tx, fontWeight:600, letterSpacing:"0.04em"}}>
          {rangeLabel()}
        </span>
        <button onClick={()=>setWeekOffset(p=>p+1)} style={{
          background:"none", border:`1px solid ${C.bd}`, color:C.ts,
          padding:"1px 6px", cursor:"pointer", borderRadius:2, fontSize:13, fontFamily:"inherit", lineHeight:1.4
        }}>›</button>
      </div>

      {/* days */}
      <div style={{padding:"0 6px 6px"}}>
        {weekDays.map(wd => {
          const key   = toStr(wd);
          const ds    = byDate[key]||[];
          const isT   = key===TODAY;
          if (!ds.length) return (
            <div key={key} style={{
              display:"flex", gap:6, alignItems:"flex-start", padding:"4px 4px",
              borderBottom:`1px solid ${C.bd}`, opacity:.45
            }}>
              <div style={{
                width:30, minWidth:30, fontSize:9, color: isT ? C.am : C.ts,
                fontWeight: isT ? 700 : 400, paddingTop:2, lineHeight:1.2, textAlign:"center",
              }}>{fmtWD(wd)}</div>
              <div style={{fontSize:9, color:C.tm, paddingTop:3}}>—</div>
            </div>
          );
          return (
            <div key={key} style={{
              padding:"4px 4px 6px", borderBottom:`1px solid ${C.bd}`,
              background: isT ? "rgba(245,158,11,.04)" : "transparent"
            }}>
              <div style={{
                fontSize:9, color: isT ? C.am : C.ts, fontWeight: isT ? 700 : 400,
                marginBottom:3, letterSpacing:"0.04em"
              }}>{fmtWD(wd)}</div>
              <div style={{display:"flex", flexDirection:"column", gap:2}}>
                {ds.map(slot => (
                  <SlotCard key={slot.id} slot={slot} isSel={selSlot?.id===slot.id} onSelSlot={onSelSlot} compact/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AgendaWidget shell with view switcher ──────────────────────────────────
function AgendaWidget({ courseId, schedules, selSlot, onSelSlot }) {
  const [view, setView] = useState("list"); // "list" | "month" | "week"

  const slots = (schedules[courseId]||[]).slice().sort((a,b)=>
    a.date.localeCompare(b.date)||a.start.localeCompare(b.start));

  const ViewBtn = (v, label) => (
    <button key={v} onClick={() => setView(v)} style={{
      flex:1, background: view===v ? C.amD : "transparent",
      border:"none", borderBottom:`2px solid ${view===v ? C.am : "transparent"}`,
      color: view===v ? C.am : C.tm,
      padding:"5px 0", cursor:"pointer", fontSize:9, fontWeight:700,
      letterSpacing:"0.07em", fontFamily:"inherit", textTransform:"uppercase",
      transition:"all .15s",
    }}>{label}</button>
  );

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
      {/* view switcher */}
      <div style={{
        display:"flex", borderBottom:`1px solid ${C.bd}`,
        flexShrink:0,
      }}>
        {ViewBtn("list","Lista")}
        {ViewBtn("month","Mes")}
        {ViewBtn("week","Semana")}
      </div>

      {/* body */}
      <div style={{flex:1, overflowY:"auto"}}>
        {!courseId ? (
          <div style={{padding:"24px 12px", textAlign:"center", color:C.tm, fontSize:11, lineHeight:1.7}}>
            Selecciona un curso para ver los horarios
          </div>
        ) : !slots.length ? (
          <div style={{padding:"20px 12px", textAlign:"center", color:C.tm, fontSize:11, lineHeight:1.6}}>
            Sin horarios programados.<br/>
            <span style={{color:C.ts}}>Usa Programación</span><br/>para agregar sesiones.
          </div>
        ) : view==="list" ? (
          <AgendaList slots={slots} selSlot={selSlot} onSelSlot={onSelSlot}/>
        ) : view==="month" ? (
          <AgendaMonth slots={slots} selSlot={selSlot} onSelSlot={onSelSlot}/>
        ) : (
          <AgendaWeek slots={slots} selSlot={selSlot} onSelSlot={onSelSlot}/>
        )}
      </div>
    </div>
  );
}

// ─── SLOT MODAL ────────────────────────────────────────────────────────────

function SlotModal({ date, maxCap, onAdd, onClose }) {
  const [start, setStart] = useState("09:00");
  const [end,   setEnd]   = useState("11:00");
  const [max,   setMax]   = useState(maxCap);

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.sf, border:`1px solid ${C.bd2}`, borderRadius:8,
        padding:24, width:300, boxShadow:"0 24px 80px rgba(0,0,0,.85)"
      }}>
        <div style={{fontSize:13, color:C.tx, fontWeight:700, marginBottom:2}}>Nueva sesión</div>
        <div style={{fontSize:11, color:C.tm, marginBottom:18}}>{fmtD(date)}</div>
        <div style={{display:"flex", gap:10, marginBottom:12}}>
          <label style={{flex:1}}>
            <div style={{fontSize:10, color:C.ts, marginBottom:3, letterSpacing:"0.06em"}}>INICIO</div>
            <input type="time" value={start} onChange={e=>setStart(e.target.value)} style={I} />
          </label>
          <label style={{flex:1}}>
            <div style={{fontSize:10, color:C.ts, marginBottom:3, letterSpacing:"0.06em"}}>FIN</div>
            <input type="time" value={end} onChange={e=>setEnd(e.target.value)} style={I} />
          </label>
        </div>
        <label style={{display:"block", marginBottom:20}}>
          <div style={{fontSize:10, color:C.ts, marginBottom:3, letterSpacing:"0.06em"}}>
            MÁX. ASISTENTES <span style={{color:C.tm}}>(límite del curso: {maxCap})</span>
          </div>
          <input type="number" value={max} min={1} max={maxCap}
            onChange={e => setMax(Math.min(maxCap, Math.max(1, +e.target.value)))} style={I} />
        </label>
        <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{
            background:"none", border:`1px solid ${C.bd2}`, color:C.ts,
            padding:"6px 14px", borderRadius:4, cursor:"pointer", fontSize:11, fontFamily:"inherit"
          }}>Cancelar</button>
          <button onClick={()=>onAdd({date,start,end,max})} style={{
            background:C.am, border:"none", color:"#000",
            padding:"6px 18px", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit"
          }}>Agregar sesión</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN MODULE ───────────────────────────────────────────────────────────

function MainModule({ schedules, setSchedules }) {
  const [courseId, setCourseId] = useState(null);
  const [selSlot,  setSelSlot]  = useState(null);
  const [selW,     setSelW]     = useState([]);
  const [search,   setSearch]   = useState("");
  const [toast,    setToast]    = useState(null);

  const course = gc(courseId);

  const liveSlot = useMemo(() =>
    selSlot ? (schedules[courseId]||[]).find(s=>s.id===selSlot.id)||null : null,
  [selSlot, schedules, courseId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return WORKERS.filter(w =>
      w.name.toLowerCase().includes(q)||w.rut.includes(q)||w.contractor.toLowerCase().includes(q));
  }, [search]);

  const togW = id => setSelW(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const getEnrolled = wid => {
    if (!courseId) return null;
    return (schedules[courseId]||[]).find(s=>s.enrolled.includes(wid))||null;
  };

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3200);
  };

  const assign = () => {
    if (!liveSlot || !selW.length) return;
    const fresh = selW.filter(w => !liveSlot.enrolled.includes(w));
    if (!fresh.length) return showToast("Todos ya están inscritos en este horario","warn");
    const avail = liveSlot.max - liveSlot.enrolled.length;
    if (fresh.length > avail) return showToast(`Solo hay ${avail} cupo(s) disponible(s)`,"error");
    setSchedules(p => ({
      ...p,
      [courseId]: p[courseId].map(s =>
        s.id===liveSlot.id ? {...s, enrolled:[...s.enrolled,...fresh]} : s)
    }));
    showToast(`${fresh.length} trabajador(es) inscrito(s) exitosamente ✓`);
    setSelW([]); setSelSlot(null);
  };

  const handleCourseSelect = id => { setCourseId(id); setSelSlot(null); setSelW([]); };

  const thStyle = {
    padding:"8px 12px", color:C.tm, textAlign:"left",
    fontSize:9, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase",
    borderBottom:`1px solid ${C.bd}`, whiteSpace:"nowrap",
  };

  return (
    <div style={{display:"flex", height:"100%"}}>
      {/* ── Left sidebar ── */}
      <aside style={{width:220, minWidth:220, background:C.sf, borderRight:`1px solid ${C.bd}`, overflowY:"auto", flexShrink:0}}>
        <div style={{padding:"10px 14px", fontSize:10, color:C.am, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", borderBottom:`1px solid ${C.bd}`}}>
          Cursos
        </div>
        <CourseTree sel={courseId} onSel={handleCourseSelect} />
      </aside>

      {/* ── Center: Workers ── */}
      <main style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <div style={{
          padding:"8px 14px", borderBottom:`1px solid ${C.bd}`,
          display:"flex", alignItems:"center", gap:10, flexShrink:0, background:C.sf
        }}>
          <span style={{fontSize:10, color:C.ts, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase"}}>
            Nómina de Trabajadores
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar nombre, RUT, empresa…"
            style={{...I, width:200, marginLeft:"auto", padding:"4px 9px"}} />
          {selW.length > 0 && !liveSlot && (
            <span style={{fontSize:10, color:C.am, whiteSpace:"nowrap"}}>
              ↗ Selecciona un horario en la agenda ({selW.length} sel.)
            </span>
          )}
          {selW.length > 0 && liveSlot && (
            <button onClick={assign} style={{
              background:C.am, border:"none", color:"#000",
              padding:"5px 14px", borderRadius:4, cursor:"pointer",
              fontSize:11, fontWeight:700, fontFamily:"inherit", whiteSpace:"nowrap"
            }}>
              Inscribir {selW.length} al horario
            </button>
          )}
        </div>

        <div style={{flex:1, overflowY:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
            <thead style={{position:"sticky", top:0, zIndex:1}}>
              <tr style={{background:C.sf}}>
                <th style={{...thStyle, width:28}}></th>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>RUT</th>
                <th style={thStyle}>F. Ingreso</th>
                <th style={thStyle}>Razón Social Contratista</th>
                {courseId && <th style={thStyle}>Estado Curso</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => {
                const enrolled = getEnrolled(w.id);
                const isSel    = selW.includes(w.id);
                return (
                  <tr key={w.id} onClick={()=>!enrolled && togW(w.id)} style={{
                    background: isSel ? C.amD : i%2===0 ? C.bg : C.sf,
                    cursor: enrolled ? "default" : "pointer",
                    borderBottom:`1px solid ${C.bd}`,
                    opacity: enrolled ? .62 : 1,
                    transition:"background .1s",
                  }}>
                    <td style={{padding:"8px 12px"}}>
                      <div style={{
                        width:13, height:13, borderRadius:3,
                        border:`1px solid ${isSel ? C.am : C.bd2}`,
                        background: isSel ? C.am : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        {isSel && <span style={{fontSize:8, color:"#000", fontWeight:900}}>✓</span>}
                      </div>
                    </td>
                    <td style={{padding:"8px 12px", color:C.tx, fontWeight:500}}>{w.name}</td>
                    <td style={{padding:"8px 12px", color:C.ts, fontFamily:"monospace", fontSize:11}}>{w.rut}</td>
                    <td style={{padding:"8px 12px", color:C.tm}}>{fmtD(w.hireDate)}</td>
                    <td style={{padding:"8px 12px", color:C.tm, fontSize:11}}>{w.contractor}</td>
                    {courseId && (
                      <td style={{padding:"8px 12px"}}>
                        {enrolled
                          ? <span style={{fontSize:10, color:C.gr, background:"rgba(16,185,129,.1)", padding:"2px 8px", borderRadius:3}}>
                              Inscrito · {fmtD(enrolled.date)} {enrolled.start}
                            </span>
                          : <span style={{fontSize:10, color:C.tm}}>Pendiente</span>
                        }
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Right: Agenda ── */}
      <aside style={{
        width:230, minWidth:230, background:C.sf, borderLeft:`1px solid ${C.bd}`,
        flexShrink:0, display:"flex", flexDirection:"column", overflow:"hidden"
      }}>
        <div style={{padding:"10px 12px", fontSize:10, color:C.am, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", borderBottom:`1px solid ${C.bd}`, flexShrink:0}}>
          Horarios Disponibles
        </div>
        {course && (
          <div style={{padding:"5px 12px", fontSize:10, color:C.ts, borderBottom:`1px solid ${C.bd}`, flexShrink:0, lineHeight:1.3}}>
            {course.name}
          </div>
        )}
        <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
          <AgendaWidget
            courseId={courseId} schedules={schedules}
            selSlot={selSlot}
            onSelSlot={s => setSelSlot(p => p?.id===s.id ? null : s)}
          />
        </div>
        {liveSlot && (
          <div style={{
            margin:8, padding:"10px 12px", borderRadius:5,
            background:C.amD, border:`1px solid ${C.am}`, flexShrink:0
          }}>
            <div style={{fontSize:9, color:C.am, fontWeight:700, letterSpacing:"0.1em", marginBottom:5}}>HORARIO ACTIVO</div>
            <div style={{fontSize:11, color:C.ts, marginBottom:1}}>{fmtD(liveSlot.date)}</div>
            <div style={{fontSize:13, color:C.tx, fontWeight:600}}>{liveSlot.start} – {liveSlot.end}</div>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:6, fontSize:10, color:C.tm}}>
              <span style={{color: liveSlot.max-liveSlot.enrolled.length===0 ? C.rd : C.gr}}>
                {liveSlot.max-liveSlot.enrolled.length} cupos libres
              </span>
              <span>{liveSlot.enrolled.length}/{liveSlot.max}</span>
            </div>
            <button onClick={()=>setSelSlot(null)} style={{
              marginTop:8, background:"none", border:`1px solid ${C.bd2}`,
              color:C.tm, padding:"3px 8px", borderRadius:3, cursor:"pointer",
              fontSize:10, fontFamily:"inherit"
            }}>Deseleccionar</button>
          </div>
        )}
      </aside>

      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background: toast.type==="success" ? "#064e3b" : toast.type==="error" ? "#7f1d1d" : "#78350f",
          color:"#fff", padding:"10px 22px", borderRadius:6, fontSize:12,
          border:`1px solid ${toast.type==="success" ? C.gr : toast.type==="error" ? C.rd : C.am}`,
          zIndex:300, boxShadow:"0 8px 40px rgba(0,0,0,.6)", whiteSpace:"nowrap",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── CRUD MODULE ───────────────────────────────────────────────────────────

function CRUDModule({ schedules, setSchedules }) {
  const [courseId, setCourseId] = useState(null);
  const [year,     setYear]     = useState(2026);
  const [month,    setMonth]    = useState(3);
  const [modal,    setModal]    = useState(null);

  const course     = gc(courseId);
  const allSlots   = schedules[courseId]||[];

  const prevM = () => { const d=new Date(year,month-1); setYear(d.getFullYear()); setMonth(d.getMonth()); };
  const nextM = () => { const d=new Date(year,month+1); setYear(d.getFullYear()); setMonth(d.getMonth()); };

  const addSlot = ({date,start,end,max}) => {
    setSchedules(p => ({
      ...p,
      [courseId]: [...(p[courseId]||[]), {id:uid(), date, start, end, max:+max, enrolled:[]}]
    }));
    setModal(null);
  };

  const delSlot = id => {
    setSchedules(p => ({...p, [courseId]: p[courseId].filter(s=>s.id!==id)}));
  };

  const days = dim(year,month);
  const fd   = fdm(year,month);

  return (
    <div style={{display:"flex", height:"100%"}}>
      {/* ── Left sidebar ── */}
      <aside style={{width:220, minWidth:220, background:C.sf, borderRight:`1px solid ${C.bd}`, overflowY:"auto", flexShrink:0}}>
        <div style={{padding:"10px 14px", fontSize:10, color:C.am, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", borderBottom:`1px solid ${C.bd}`}}>
          Cursos
        </div>
        <CourseTree sel={courseId} onSel={setCourseId} />
      </aside>

      {/* ── Calendar ── */}
      <main style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <div style={{
          padding:"8px 16px", borderBottom:`1px solid ${C.bd}`,
          display:"flex", alignItems:"center", gap:10, flexShrink:0, background:C.sf
        }}>
          <span style={{fontSize:10, color:C.ts, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase"}}>
            Programación de Sesiones
          </span>
          {course && <span style={{fontSize:11, color:C.am}}>· {course.name}</span>}
          <div style={{flex:1}}/>
          <button onClick={prevM} style={{
            background:"none", border:`1px solid ${C.bd2}`, color:C.ts,
            padding:"3px 10px", cursor:"pointer", borderRadius:3, fontSize:14, fontFamily:"inherit"
          }}>‹</button>
          <span style={{fontSize:12, color:C.tx, minWidth:140, textAlign:"center", fontWeight:500}}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextM} style={{
            background:"none", border:`1px solid ${C.bd2}`, color:C.ts,
            padding:"3px 10px", cursor:"pointer", borderRadius:3, fontSize:14, fontFamily:"inherit"
          }}>›</button>
          {courseId && (
            <span style={{fontSize:10, color:C.tm}}>
              Haz click en un día para agregar sesión
            </span>
          )}
        </div>

        {!courseId ? (
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8}}>
            <div style={{fontSize:28, opacity:.15}}>⚡</div>
            <div style={{fontSize:13, color:C.tm}}>Selecciona un curso para programar sus horarios</div>
          </div>
        ) : (
          <div style={{flex:1, overflowY:"auto", padding:12}}>
            {/* Day headers */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4}}>
              {DSHORT.map(d => (
                <div key={d} style={{
                  textAlign:"center", fontSize:9, color:C.tm,
                  fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", padding:"4px 0"
                }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4}}>
              {Array.from({length:fd}).map((_,i) => (
                <div key={`e${i}`} style={{minHeight:96}}/>
              ))}
              {Array.from({length:days}).map((_,i) => {
                const d    = i+1;
                const date = tds(year,month,d);
                const dSlots = allSlots.filter(s=>s.date===date);
                const isPastDay = past(date);
                const isToday  = date===TODAY;
                return (
                  <div key={d}
                    onClick={() => !isPastDay && setModal({date})}
                    onMouseEnter={e => { if (!isPastDay) e.currentTarget.style.borderColor=C.bd2; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isToday ? C.am : C.bd; }}
                    style={{
                      minHeight:96, background:C.sf, borderRadius:5,
                      border:`1px solid ${isToday ? C.am : C.bd}`,
                      padding:"6px 5px", cursor: isPastDay ? "default" : "pointer",
                      opacity: isPastDay ? .38 : 1, transition:"border-color .15s",
                      position:"relative", overflow:"hidden",
                    }}
                  >
                    <div style={{
                      fontSize:12, color: isToday ? C.am : C.ts,
                      fontWeight: isToday ? 700 : 400,
                      marginBottom:4, textAlign:"right", lineHeight:1
                    }}>{d}</div>

                    {dSlots.map(slot => {
                      const full = slot.enrolled.length >= slot.max;
                      return (
                        <div key={slot.id} style={{
                          fontSize:9, lineHeight:1.4, marginBottom:2, padding:"2px 5px", borderRadius:3,
                          background: full ? "rgba(239,68,68,.12)" : C.amD,
                          color: full ? C.rd : C.am,
                          display:"flex", justifyContent:"space-between", alignItems:"center", gap:2,
                        }}>
                          <span style={{fontWeight:600}}>{slot.start}</span>
                          <span style={{color:C.tm, fontSize:8}}>{slot.enrolled.length}/{slot.max}</span>
                          <span
                            onClick={e=>{e.stopPropagation(); delSlot(slot.id);}}
                            style={{color:C.rd, cursor:"pointer", fontWeight:700, fontSize:11, lineHeight:1}}
                          >×</span>
                        </div>
                      );
                    })}

                    {!isPastDay && dSlots.length===0 && (
                      <div style={{
                        position:"absolute", bottom:4, right:6,
                        fontSize:18, color:C.bd2, lineHeight:1
                      }}>+</div>
                    )}
                    {!isPastDay && dSlots.length>0 && (
                      <div style={{
                        position:"absolute", bottom:4, right:6,
                        fontSize:11, color:C.am, opacity:.4, lineHeight:1
                      }}>+</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{display:"flex", gap:16, marginTop:14, paddingLeft:2}}>
              {[
                [C.am, "Sesión con cupos"],
                [C.rd, "Sesión completa"],
                [C.am, "Hoy", true],
              ].map(([color,label,border]) => (
                <div key={label} style={{display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.tm}}>
                  <div style={{
                    width:10, height:10, borderRadius:2,
                    background: border ? "transparent" : color+"22",
                    border: border ? `1px solid ${color}` : `1px solid ${color}55`
                  }}/>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal && course && (
        <SlotModal date={modal.date} maxCap={course.maxPerSlot} onAdd={addSlot} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────

export default function App() {
  const [mod, setMod] = useState("main");

  const [schedules, setSchedules] = useState({
    c1: [
      {id:"s1", date:"2026-04-05", start:"09:00", end:"11:00", max:15, enrolled:["w1","w3"]},
      {id:"s2", date:"2026-04-08", start:"14:00", end:"16:00", max:15, enrolled:[]},
      {id:"s3", date:"2026-04-15", start:"09:00", end:"11:00", max:15, enrolled:[]},
    ],
    c2: [
      {id:"s4", date:"2026-04-10", start:"08:00", end:"12:00", max:10, enrolled:["w2"]},
      {id:"s5", date:"2026-04-22", start:"13:00", end:"17:00", max:10, enrolled:[]},
    ],
    c12: [
      {id:"s6", date:"2026-04-07", start:"10:00", end:"13:00", max:16, enrolled:["w4","w5","w6"]},
      {id:"s7", date:"2026-04-14", start:"10:00", end:"13:00", max:16, enrolled:[]},
    ],
  });

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      background:C.bg, color:C.tx,
      fontFamily:'"IBM Plex Mono","Courier New",monospace', fontSize:12,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#252f40;border-radius:3px}
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(.35)}
        input[type=number]{-moz-appearance:textfield}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{opacity:.4}
      `}</style>

      {/* Header */}
      <header style={{
        display:"flex", alignItems:"center", padding:"0 20px",
        height:46, background:C.sf, borderBottom:`1px solid ${C.bd}`,
        flexShrink:0, gap:16,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <div style={{
            width:7, height:7, background:C.am, borderRadius:1,
            transform:"rotate(45deg)", flexShrink:0
          }}/>
          <span style={{fontSize:14, fontWeight:700, color:C.tx, letterSpacing:"0.01em"}}>
            CapacitaFlow
          </span>
          <span style={{fontSize:9, color:C.tm, letterSpacing:"0.08em", textTransform:"uppercase"}}>
            / Gestión de Capacitaciones
          </span>
        </div>

        <div style={{flex:1}}/>

        <div style={{display:"flex", gap:4}}>
          {[["main","Asignación"],["crud","Programación"]].map(([key,label]) => (
            <button key={key} onClick={()=>setMod(key)} style={Btn(mod===key)}>
              {label}
            </button>
          ))}
        </div>

        <div style={{
          marginLeft:12, fontSize:10, color:C.tm, padding:"3px 10px",
          border:`1px solid ${C.bd}`, borderRadius:3
        }}>
          {new Date(TODAY).toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
        </div>
      </header>

      <div style={{flex:1, overflow:"hidden"}}>
        {mod==="main"
          ? <MainModule schedules={schedules} setSchedules={setSchedules}/>
          : <CRUDModule schedules={schedules} setSchedules={setSchedules}/>
        }
      </div>
    </div>
  );
}
