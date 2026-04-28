import React, { useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  TrendingUp, 
  Activity, 
  ClipboardList,
  GraduationCap
} from 'lucide-react';
import { cn } from './ui/AeroUI';

export default function Dashboard({ data, filterContractor }) {
  const stats = useMemo(() => {
    const allSlots = Object.values(data.schedules).flat();
    const allRequests = data.requests || [];
    
    // 1. Filter data based on contractor if provided
    const filteredRequests = filterContractor 
      ? allRequests.filter(r => r.contractorName === filterContractor)
      : allRequests;

    const filteredWorkers = filterContractor
      ? data.workers.filter(w => w.contractor === filterContractor)
      : data.workers;

    const workerIdsOfContractor = new Set(filteredWorkers.map(w => w.id));

    // 2. Calculate Evaluation Stats
    let passed = 0;
    let failed = 0;
    let pending = 0;

    allSlots.forEach(slot => {
        slot.enrolled.forEach(e => {
            // If filtering, only count if worker belongs to contractor
            if (!filterContractor || workerIdsOfContractor.has(e.id)) {
                if (e.evaluation === 'passed') passed++;
                else if (e.evaluation === 'failed') failed++;
                else pending++;
            }
        });
    });

    const totalEvaluated = passed + failed;
    const approvalRate = totalEvaluated > 0 ? Math.round((passed / totalEvaluated) * 100) : 0;
    const failRate = totalEvaluated > 0 ? Math.round((failed / totalEvaluated) * 100) : 0;

    // 3. Request Stats
    const totalReqs = filteredRequests.length;
    const pendingReqs = filteredRequests.filter(r => r.status === 'pending').length;
    const approvedReqs = filteredRequests.filter(r => r.status === 'approved').length;

    // 4. Session Realization (Updated: Approved Requests that are fully evaluated)
    const realizedReqsCount = filteredRequests.filter(r => {
        if (r.status !== 'approved') return false;
        const slot = allSlots.find(s => s.id === r.slotId);
        if (!slot) return false;
        const requestEnrolled = slot.enrolled.filter(e => r.workerIds.includes(e.id));
        return requestEnrolled.length > 0 && requestEnrolled.every(e => e.evaluation !== 'pending');
    }).length;

    return {
      totalWorkers: filteredWorkers.length,
      passed,
      failed,
      pending,
      approvalRate,
      failRate,
      totalReqs,
      pendingReqs,
      approvedReqs,
      pastSlotsCount: realizedReqsCount
    };
  }, [data, filterContractor]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard de Gestión</h2>
          <p className="text-sm font-medium text-slate-400">
            {filterContractor ? `Estadísticas para ${filterContractor}` : 'Vista Global de Operaciones'}
          </p>
        </header>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Trabajadores" 
            value={stats.totalWorkers} 
            icon={<Users className="w-6 h-6" />}
            gradient="from-blue-500 to-indigo-600"
            label="En Nómina"
          />
          <StatCard 
            title="Tasa de Aprobación" 
            value={`${stats.approvalRate}%`} 
            icon={<CheckCircle2 className="w-6 h-6" />}
            gradient="from-emerald-500 to-teal-600"
            label={`${stats.passed} aprobados`}
          />
          <StatCard 
            title="Tasa de Reprobación" 
            value={`${stats.failRate}%`} 
            icon={<XCircle className="w-6 h-6" />}
            gradient="from-rose-500 to-red-600"
            label={`${stats.failed} reprobados`}
          />
          <StatCard 
            title="Sesiones Realizadas" 
            value={stats.pastSlotsCount} 
            icon={<Calendar className="w-6 h-6" />}
            gradient="from-amber-500 to-orange-600"
            label="Solicitudes ejecutadas"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests Status Card */}
          <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Estado de Solicitudes</h3>
                    <p className="text-xs font-medium text-slate-400">Gestión de flujo administrativo</p>
                </div>
                <ClipboardList className="text-slate-200 w-8 h-8" />
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                    <div className="text-2xl font-black text-slate-800 mb-1">{stats.totalReqs}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totales</div>
                </div>
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col items-center text-center">
                    <div className="text-2xl font-black text-amber-600 mb-1">{stats.pendingReqs}</div>
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pendientes</div>
                </div>
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                    <div className="text-2xl font-black text-emerald-600 mb-1">{stats.approvedReqs}</div>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Aprobadas</div>
                </div>
            </div>

            <div className="mt-10 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Progreso Administrativo</span>
                    <span className="text-slate-800">{Math.round((stats.approvedReqs / stats.totalReqs) * 100 || 0)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-md shadow-emerald-500/20" 
                        style={{ width: `${(stats.approvedReqs / stats.totalReqs) * 100 || 0}%` }}
                    />
                </div>
            </div>
          </div>

          {/* Education Quality Card */}
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
            <div className="mb-8">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Calidad Educativa</h3>
                <p className="text-xs font-medium text-slate-400">Distribución de resultados</p>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8 text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                    {/* Simplified Circular Chart Placeholder */}
                    <div className="w-32 h-32 rounded-full border-[12px] border-emerald-500 flex items-center justify-center relative">
                        <div className="text-2xl font-black text-emerald-600">{stats.approvalRate}%</div>
                        <div className="absolute -inset-2 rounded-full border-[2px] border-emerald-100 animate-pulse" />
                    </div>
                </div>
                <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Aprobación General</div>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-3">
                <QualityIndicator label="Aprobados" count={stats.passed} color="bg-emerald-500" />
                <QualityIndicator label="Reprobados" count={stats.failed} color="bg-red-500" />
                <QualityIndicator label="Pendientes" count={stats.pending} color="bg-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, label }) {
  return (
    <div className="group relative overflow-hidden bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:scale-[1.02] transition-all">
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br opacity-[0.03] rounded-full group-hover:scale-110 transition-transform",
        gradient
      )} />
      
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white shadow-xl",
        "bg-gradient-to-br",
        gradient
      )}>
        {icon}
      </div>

      <div className="text-3xl font-black text-slate-800 mb-1">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
      <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400 italic">
        {label}
      </div>
    </div>
  );
}

function QualityIndicator({ label, count, color }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-xs font-black text-slate-800">{count}</span>
        </div>
    )
}
