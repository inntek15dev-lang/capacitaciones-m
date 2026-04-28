import React from 'react';
import { User, Building2, Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import { cn } from './ui/AeroUI';

const fmtD = s => s ? s.split("-").reverse().join("/") : "—";

export default function WorkerTable({ workers, selectedWorkers, onToggleWorker, currentEnrollments, selectedCourseId }) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200/50 bg-white/30 backdrop-blur-sm shadow-aero-md">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-100/50">
          <tr>
            <th className="w-12 p-4"></th>
            <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
            <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">RUT</th>
            <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
            {selectedCourseId && <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/50">
          {workers.map((worker) => {
            const isSelected = selectedWorkers.includes(worker.id);
            const enrollment = currentEnrollments[worker.id];
            const isDisabled = !!enrollment;

            return (
              <tr 
                key={worker.id}
                onClick={() => !isDisabled && onToggleWorker(worker.id)}
                className={cn(
                  "group transition-all hover:bg-white/60 cursor-pointer",
                  isSelected ? "bg-blue-600/5" : "bg-transparent",
                  isDisabled && "opacity-50 grayscale cursor-default"
                )}
              >
                <td className="p-4">
                  <div className={cn(
                    "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                    isSelected 
                      ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30" 
                      : "border-slate-300 group-hover:border-slate-400"
                  )}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 leading-none">{worker.name}</div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                        <CalendarIcon size={10} /> Ingreso: {fmtD(worker.hireDate)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs font-mono font-medium text-slate-500">{worker.rut}</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    <Building2 size={12} className="text-slate-300" />
                    {worker.contractor}
                  </div>
                </td>
                {selectedCourseId && (
                  <td className="py-3 px-2">
                    {enrollment ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-tight">
                        <CheckCircle size={10} /> Inscrito ({fmtD(enrollment.date)})
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                        <Clock size={10} /> Pendiente
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
