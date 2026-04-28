import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Users, Monitor, MapPin } from 'lucide-react';
import { GlassCard, AeroButton, cn } from './ui/AeroUI';

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DSHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const TODAY = "2026-04-02";

const fmtD = s => s ? s.split("-").reverse().join("/") : "—";
const tds = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

function SlotModal({ date, maxCap, onAdd, onClose }) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [max, setMax] = useState(maxCap);
  const [modality, setModality] = useState("presencial"); // "online" | "presencial"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <GlassCard className="w-full max-w-sm p-8 space-y-6 scale-in-center">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Nueva Sesión</h3>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{fmtD(date)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inicio</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Término</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidad Máxima</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="number" 
              value={max} 
              min={1} 
              max={maxCap}
              onChange={e => setMax(Math.min(maxCap, Math.max(1, +e.target.value)))} 
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
            />
          </div>
          <p className="text-[9px] text-slate-400 mt-1 ml-1 font-medium">Límite establecido por el curso: {maxCap}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad de Charla</label>
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setModality('presencial')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                modality === 'presencial' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <MapPin size={12} /> Presencial
            </button>
            <button 
              onClick={() => setModality('online')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                modality === 'online' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Monitor size={12} /> Online
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
          <AeroButton onClick={() => onAdd({ date, start, end, max: +max, modality })} active className="flex-1 py-3 shadow-blue-500/30">Crear Horario</AeroButton>
        </div>
      </GlassCard>
    </div>
  );
}

export default function SchedulingView({ course, schedules, onAddSlot, onDeleteSlot }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [modal, setModal] = useState(null);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y, m) => new Date(y, m, 1).getDay();

  const days = daysInMonth(year, month);
  const fsDay = firstDay(year, month);

  const changeMonth = (delta) => {
    const d = new Date(year, month + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="p-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Programación</h2>
          <p className="text-sm font-medium text-slate-400">{course?.name || "Selecciona un curso"}</p>
        </div>

        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-white/60 shadow-aero-sm">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl transition-all active:scale-90"><ChevronLeft size={18} className="text-slate-600" /></button>
          <span className="text-xs font-black text-slate-800 uppercase tracking-widest min-w-[12rem] text-center">{MONTHS[month]} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl transition-all active:scale-90"><ChevronRight size={18} className="text-slate-600" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 pt-4">
        {!course ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
             <Plus size={48} className="mb-4 text-slate-200" />
             <p className="text-lg font-bold">Selecciona un curso a la izquierda</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-7 gap-4">
              {DSHORT.map(d => (
                <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">{d}</div>
              ))}
              
              {Array.from({ length: fsDay }).map((_, i) => <div key={`e-${i}`} />)}
              
              {Array.from({ length: days }).map((_, i) => {
                const d = i + 1;
                const date = tds(year, month, d);
                const daySlots = schedules.filter(s => s.date === date);
                const isToday = date === TODAY;
                const past = date < TODAY;

                return (
                  <div 
                    key={d}
                    onClick={() => !past && setModal({ date })}
                    className={cn(
                      "min-h-[120px] p-3 rounded-2xl border transition-all relative overflow-hidden group",
                      isToday ? "bg-blue-600/5 border-blue-400" : "bg-white/40 border-white/60",
                      past ? "opacity-30 cursor-default" : "hover:border-white hover:bg-white/80 cursor-pointer shadow-sm hover:shadow-aero-md active:scale-[0.98]"
                    )}
                  >
                    <span className={cn(
                      "absolute top-3 right-4 text-sm font-bold",
                      isToday ? "text-blue-600" : "text-slate-400 group-hover:text-slate-800"
                    )}>{d}</span>

                    <div className="mt-6 space-y-1.5">
                      {daySlots.map(slot => {
                        const isFull = slot.enrolled?.length >= slot.max;
                        return (
                          <div 
                            key={slot.id} 
                            className={cn(
                              "flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-bold group/slot",
                              isFull ? "bg-red-100 text-red-600" : "bg-blue-100/50 text-blue-700"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                               {slot.modality === 'online' ? <Monitor size={10} className="opacity-60" /> : <MapPin size={10} className="opacity-60" />}
                               <span>{slot.start}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot.id); }}
                              className="opacity-0 group-hover/slot:opacity-100 hover:text-red-500 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                      {!past && daySlots.length === 0 && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center">
                          <Plus size={24} className="text-blue-500/30" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-6 pt-4 border-t border-slate-200/50">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="w-3 h-3 rounded-full bg-blue-100/50 border border-blue-200" /> Cupos Disponibles
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200" /> Completo
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="w-3 h-3 rounded-full bg-blue-600/5 border border-blue-400" /> Hoy
               </div>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <SlotModal 
          date={modal.date} 
          maxCap={course.maxPerSlot} 
          onAdd={onAddSlot} 
          onClose={() => setModal(null)} 
        />
      )}
    </div>
  );
}
