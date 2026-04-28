import React, { useState } from 'react';
import { Calendar as CalendarIcon, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard, cn } from './ui/AeroUI';

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DMINI = ["D","L","M","X","J","V","S"];
const TODAY = "2026-04-02";

// Helper for date formatting
const fmtD = s => s ? s.split("-").reverse().join("/") : "—";
const tds = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

function SlotCard({ slot, isActive, onSelect, compact = false }) {
  const available = slot.max - (slot.enrolled?.length || 0);
  const isFull = available === 0;

  return (
    <button
      onClick={() => !isFull && onSelect(slot)}
      disabled={isFull}
      className={cn(
        "w-full text-left p-3 rounded-2xl border transition-all active:scale-[0.98]",
        isActive 
          ? "bg-blue-600/10 border-blue-400 shadow-md shadow-blue-500/5 scale-[1.02]" 
          : "bg-white/40 border-white/60 hover:bg-white/70 hover:shadow-sm hover:scale-[1.01]",
        isFull && "opacity-50 cursor-not-allowed grayscale-[0.5] shadow-none hover:scale-100"
      )}
    >
      <div className={cn(
        "text-xs font-bold leading-none",
        isActive ? "text-blue-700" : "text-slate-800"
      )}>
        {slot.start} – {slot.end}
      </div>
      <div className="flex justify-between items-end mt-2">
        <span className={cn(
          "text-[10px] font-semibold",
          isFull ? "text-red-500" : "text-emerald-600"
        )}>
          {isFull ? "Saturado" : `${available} cupos`}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {slot.enrolled?.length || 0}/{slot.max}
        </span>
      </div>
    </button>
  );
}

// Sub-component: Monthly View
function MonthPicker({ slots, selectedSlot, onSelectSlot }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3); // April
  const [pickedDay, setPickedDay] = useState(null);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y, m) => new Date(y, m, 1).getDay();

  const byDate = {};
  slots.forEach(s => { (byDate[s.date] ??= []).push(s); });

  const days = daysInMonth(year, month);
  const fd = firstDay(year, month);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setMonth(p => p - 1)} className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
        <span className="text-sm font-bold text-slate-700 uppercase tracking-tighter">{MONTHS[month]} {year}</span>
        <button onClick={() => setMonth(p => p + 1)} className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {DMINI.map(d => <div key={d} className="text-[9px] font-black text-slate-400 text-center py-1">{d}</div>)}
        {Array.from({ length: fd }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const date = tds(year, month, d);
          const hasSlots = (byDate[date] || []).length > 0;
          const isToday = date === TODAY;
          const isSelected = pickedDay === date;

          return (
            <button
              key={d}
              onClick={() => hasSlots && setPickedDay(isSelected ? null : date)}
              disabled={!hasSlots}
              className={cn(
                "h-9 rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden active:scale-90",
                isSelected
                  ? "bg-blue-600/10 border border-blue-400 shadow-sm"
                  : isToday
                    ? "bg-slate-200/50 border border-slate-300"
                    : "border border-transparent",
                !hasSlots && "opacity-20 grayscale",
                hasSlots && !isSelected && "hover:bg-white/80 cursor-pointer"
              )}
            >
              <span className={cn(
                "text-xs font-semibold",
                isSelected ? "text-blue-700 font-bold" : "text-slate-600"
              )}>{d}</span>
              {hasSlots && (
                <span className={cn(
                  "w-1 h-1 rounded-full mt-0.5",
                  isSelected ? "bg-blue-600" : "bg-emerald-500"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {pickedDay && (
        <div className="space-y-2 pt-2 border-t border-slate-200/50">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-1">{fmtD(pickedDay)}</div>
          {(byDate[pickedDay] || []).map(slot => (
            <SlotCard key={slot.id} slot={slot} isActive={selectedSlot?.id === slot.id} onSelect={onSelectSlot} compact />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgendaPanel({ slots, selectedSlot, onSelectSlot }) {
  const [view, setView] = useState('list'); // 'list' | 'month'

  return (
    <aside className="w-80 h-full glass-panel flex flex-col border-l border-slate-200/50">
      <div className="p-6 border-bottom border-slate-200/50">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Agenda</h2>
        <div className="grid grid-cols-2 gap-2 bg-slate-200/30 p-1 rounded-2xl">
          <button 
            onClick={() => setView('list')}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
              view === 'list' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <List className="w-3 h-3" /> Lista
          </button>
          <button 
            onClick={() => setView('month')}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
              view === 'month' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <CalendarIcon className="w-3 h-3" /> Mes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-smooth">
        {slots.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center opacity-30 space-y-2">
            <LayoutGrid className="w-10 h-10" />
            <p className="text-xs font-medium px-4">Selecciona un curso para ver horarios disponibles</p>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-3">
             {/* Simple chronological list */}
             {slots.map(slot => (
               <div key={slot.id}>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">{fmtD(slot.date)}</div>
                 <SlotCard slot={slot} isActive={selectedSlot?.id === slot.id} onSelect={onSelectSlot}/>
               </div>
             ))}
          </div>
        ) : (
          <MonthPicker slots={slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
        )}
      </div>
    </aside>
  );
}
