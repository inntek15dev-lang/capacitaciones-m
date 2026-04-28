import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { ClipboardList, Users, CheckCircle2, XCircle, Eye, Calendar, Clock, ChevronRight, GraduationCap, ArrowRight, Plus, Monitor, MapPin } from 'lucide-react';
import { AeroButton, cn } from './ui/AeroUI';

const API_BASE = 'http://localhost:3001/api/v1';

export default function RequestsView({ requests, data, onRefresh, showToast }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationData, setEvaluationData] = useState([]); // { workerId, status }
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [showEvaluatedOnly, setShowEvaluatedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const coursesMap = useMemo(() => {
    const map = {};
    data.categories.forEach(cat => {
      cat.courses.forEach(c => {
        map[c.id] = c;
      });
    });
    return map;
  }, [data.categories]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // If toggle is ON, only show evaluated
      if (showEvaluatedOnly) {
        const slot = (data.schedules[r.courseId] || []).find(s => s.id === r.slotId);
        const isEval = r.status === 'approved' && slot?.enrolled.filter(e => r.workerIds.includes(e.id)).every(e => e.evaluation !== 'pending');
        if (!isEval) return false;
      }
      
      // Usual filter logic
      return filter === 'all' ? true : r.status === filter;
    });
  }, [requests, filter, showEvaluatedOnly, data.schedules]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/requests/${requestId}`, { status: newStatus });
      showToast(`Solicitud ${newStatus === 'approved' ? 'Aprobada' : 'Rechazada'}`);
      setSelectedRequest(null);
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al actualizar solicitud', 'error');
    }
  };

  const openEvaluation = (req) => {
    const slot = (data.schedules[req.courseId] || []).find(s => s.id === req.slotId);
    if (!slot) return showToast('No se encontró información de la sesión', 'error');
    
    // Initialize evaluation data from current enrollments if they have status
    const initialEval = req.workerIds.map(wid => {
       const enrollment = slot.enrolled.find(e => e.id === wid);
       return { workerId: wid, status: enrollment?.evaluation || 'pending' };
    });
    
    setEvaluationData(initialEval);
    setIsEvaluationModalOpen(true);
  };

  const handleSaveEvaluation = async () => {
    try {
      await axios.post(`${API_BASE}/enrollments/evaluation`, {
        slotId: selectedRequest.slotId,
        evaluations: evaluationData
      });
      showToast('Evaluaciones guardadas correctamente');
      setIsEvaluationModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast('Error al guardar evaluaciones', 'error');
    }
  };

  const toggleWorkerEvaluation = (workerId) => {
    setEvaluationData(prev => prev.map(item => {
        if (item.workerId === workerId) {
            return { ...item, status: item.status === 'passed' ? 'failed' : 'passed' };
        }
        return item;
    }));
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Solicitudes</h2>
            <p className="text-sm font-medium text-slate-400">Revisa y evalúa el cumplimiento de las capacitaciones</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white p-2 px-4 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solo Evaluadas</span>
              <button 
                onClick={() => { setShowEvaluatedOnly(!showEvaluatedOnly); setCurrentPage(1); }}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-all flex items-center",
                  showEvaluatedOnly ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                )}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="w-px h-6 bg-slate-100" />

            <div className="flex gap-1">
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setCurrentPage(1); }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : f === 'rejected' ? 'Rechazadas' : 'Todas'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
              <ClipboardList size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay solicitudes en esta categoría</p>
            </div>
          ) : (
            currentItems.map(req => {
              const course = coursesMap[req.courseId];
              const slot = (data.schedules[req.courseId] || []).find(s => s.id === req.slotId);
              const isPast = slot && new Date(slot.date) < new Date();
              const isEvaluated = req.status === 'approved' && slot?.enrolled.filter(e => req.workerIds.includes(e.id)).every(e => e.evaluation !== 'pending');

              return (
                <div key={req.id} className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      req.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">{req.contractorName}</span>
                        <span className="text-[10px] font-bold text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                        {isPast && req.status === 'approved' && (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full ml-2">Cursada</span>
                        )}
                        {isEvaluated && (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full ml-2">Evaluada</span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800">{course?.name || 'Curso Desconocido'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                          <p className="text-[11px] font-medium text-slate-400">Trabajadores: {req.workerIds.length} • Sesión: {slot ? `${slot.date}` : 'N/A'}</p>
                          {slot?.modality && (
                              <div className={cn(
                                  "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest",
                                  slot.modality === 'online' ? "text-blue-500" : "text-amber-500"
                              )}>
                                  {slot.modality === 'online' ? <Monitor size={10} /> : <MapPin size={10} />}
                                  {slot.modality}
                              </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                      req.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </div>
                    {isPast && req.status === 'approved' && !isEvaluated && (
                        <button 
                            onClick={() => { setSelectedRequest(req); openEvaluation(req); }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                        >
                            <GraduationCap size={16} /> Evaluar
                        </button>
                    )}
                    <button 
                       onClick={() => setSelectedRequest(req)}
                       className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                    >
                      <Eye size={20} />
                    </button>
                    <ChevronRight size={16} className="text-slate-200" />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (
          <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrar</span>
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                {[5, 10, 50, 500].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">por página</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 disabled:opacity-30 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Show limited pages if too many
                  if (totalPages > 7 && (p > 3 && p < totalPages - 2 && (p < currentPage - 1 || p > currentPage + 1))) {
                    if (p === 4 || p === totalPages - 2) return <span key={p} className="px-2 text-slate-300">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={cn(
                        "w-10 h-10 rounded-2xl text-xs font-black transition-all",
                        currentPage === p ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 disabled:opacity-30 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredRequests.length)}</span> de <span className="text-slate-800">{filteredRequests.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && !isEvaluationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden p-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
               <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Detalle de Solicitud</h3>
                <p className="text-xs font-medium text-slate-400">ID: {selectedRequest.id}</p>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50">
                <XCircle size={24} />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Empresa Contratista</label>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-800">{selectedRequest.contractorName}</div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Curso Solicitado</label>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-800">{coursesMap[selectedRequest.courseId]?.name}</div>
                    </div>
                </div>

                <div className="flex flex-col h-full">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Personal ({selectedRequest.workerIds.length})</label>
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3 overflow-y-auto max-h-48">
                        {selectedRequest.workerIds.map(wid => {
                            const worker = data.workers.find(w => w.id === wid);
                            const slot = (data.schedules[selectedRequest.courseId] || []).find(s => s.id === selectedRequest.slotId);
                            const enrollment = slot?.enrolled.find(e => e.id === wid);

                            return (
                                <div key={wid} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 truncate">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                            <Users size={14} />
                                        </div>
                                        <div className="truncate">
                                            <div className="text-[10px] font-black text-slate-800 truncate">{worker?.name || 'Desconocido'}</div>
                                            <div className="text-[8px] font-bold text-slate-400">{worker?.rut}</div>
                                        </div>
                                    </div>
                                    
                                    {selectedRequest.status === 'approved' && (
                                        <div className={cn(
                                            "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                            enrollment?.evaluation === 'passed' ? "bg-emerald-50 text-emerald-600" :
                                            enrollment?.evaluation === 'failed' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {enrollment?.evaluation === 'passed' ? 'Aprobado' : 
                                             enrollment?.evaluation === 'failed' ? 'Reprobado' : 'Pendiente'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedRequest.status === 'pending' ? (
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        Rechazar
                    </button>
                    <button 
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                    >
                        Aprobar e Inscribir
                    </button>
                </div>
            ) : (
                <div className="pt-4 border-t border-slate-100 text-center flex items-center justify-between">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest",
                        selectedRequest.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {selectedRequest.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        Solicitud {selectedRequest.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </div>

                    {selectedRequest.status === 'approved' && (
                        <AeroButton onClick={() => openEvaluation(selectedRequest)} className="px-8 flex items-center gap-2">
                             <GraduationCap size={16} /> Evaluar Trabajadores
                        </AeroButton>
                    )}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {isEvaluationModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Evaluación de Capacitación</h3>
                            <p className="text-sm font-medium text-slate-400">{coursesMap[selectedRequest.courseId]?.name} • {selectedRequest.contractorName}</p>
                        </div>
                        <button onClick={() => { setIsEvaluationModalOpen(false); setSelectedRequest(null); }} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Plus className="rotate-45" size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-10 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                        {evaluationData.map(item => {
                            const worker = data.workers.find(w => w.id === item.workerId);
                            return (
                                <div key={item.workerId} className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{worker?.name}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{worker?.rut}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            item.status === 'passed' ? "text-emerald-600" : 
                                            item.status === 'failed' ? "text-red-500" : "text-slate-400"
                                        )}>
                                            {item.status === 'passed' ? 'Aprobado' : 
                                             item.status === 'failed' ? 'Reprobado' : 'Pendiente'}
                                        </span>
                                        
                                        <button
                                            onClick={() => toggleWorkerEvaluation(item.workerId)}
                                            className={cn(
                                                "w-14 h-8 rounded-full p-1 transition-all flex items-center",
                                                item.status === 'passed' ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                                            )}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-10 border-t border-slate-100 flex justify-end gap-4">
                    <button 
                         onClick={() => setIsEvaluationModalOpen(false)}
                         className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                    >
                         Cancelar
                    </button>
                    <AeroButton onClick={handleSaveEvaluation} active className="px-12">
                         Guardar Evaluaciones
                    </AeroButton>
                </div>
            </div>
        </div>
      )}
    </main>
  );
}
