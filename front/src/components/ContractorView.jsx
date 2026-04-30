import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Users, ClipboardList, LogOut, Zap, Search, Plus, CheckCircle, Calendar, Clock, Eye, XCircle, LayoutDashboard, ChevronRight, Download, Monitor, MapPin } from 'lucide-react';
import { AeroButton, cn } from './ui/AeroUI';
import Dashboard from './Dashboard';
import config from '../config';

const API_BASE = config.API_BASE;

export default function ContractorView({ user, data, onLogout, onRefresh }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'workers' | 'requests'
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    courseId: '',
    slotId: '',
    workerIds: [],
    justification: ''
  });

  // Pagination states
  const [workersPage, setWorkersPage] = useState(1);
  const [workersLimit, setWorkersLimit] = useState(5);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsLimit, setRequestsLimit] = useState(5);
  const [showEvaluatedOnly, setShowEvaluatedOnly] = useState(false);
  const [plantWorkers, setPlantWorkers] = useState([]);
  const [fetchingWorkers, setFetchingWorkers] = useState(false);

  // Fetch workers from external API via internal proxy (ListadoTrabajadores)
  React.useEffect(() => {
    const fetchWorkers = async () => {
      if (!user.plantas || user.plantas.length === 0) return;
      
      setFetchingWorkers(true);
      try {
        const allFetchedWorkers = [];
        // Iteramos por cada planta del contratista y llamamos a la API interna
        for (const planta of user.plantas) {
          const res = await axios.get(`${API_BASE}/external/workers`, {
            params: { 
              id_cot: user.cot_id, 
              niv_id: planta.niv_id
            }
          });
          
          if (Array.isArray(res.data)) {
            allFetchedWorkers.push(...res.data);
          }
        }
        setPlantWorkers(allFetchedWorkers);
      } catch (err) {
        console.error("Error fetching workers from plants:", err);
      } finally {
        setFetchingWorkers(false);
      }
    };

    fetchWorkers();
  }, [user.plantas, user.cot_id, user.cot_razon_social]);

  const myWorkers = plantWorkers;

  const courses = useMemo(() => {
    const allCourses = data.categories.flatMap(c => c.courses);
    const userPlantIds = user.plantas?.map(p => p.niv_id) || [];
    // Only show courses that belong to one of the user's plants (by ID)
    return allCourses.filter(course => userPlantIds.includes(parseInt(course.niv_id, 10)));
  }, [data.categories, user.plantas]);

  const availableSlots = useMemo(() => {
    if (!requestForm.courseId) return [];
    return data.schedules[requestForm.courseId] || [];
  }, [data.schedules, requestForm.courseId]);

  const selectedSlotData = useMemo(() => {
    return availableSlots.find(s => s.id === requestForm.slotId);
  }, [availableSlots, requestForm.slotId]);

  const myRequests = useMemo(() => {
    return (data.requests || []).filter(r => r.contractorId === user.id);
  }, [data.requests, user.id]);

  // Paginated Data
  const paginatedWorkers = useMemo(() => {
    const start = (workersPage - 1) * workersLimit;
    return myWorkers.slice(start, start + workersLimit);
  }, [myWorkers, workersPage, workersLimit]);

  const totalWorkersPages = Math.ceil(myWorkers.length / workersLimit);

  const totalRequestsPages = Math.ceil(myRequests.length / requestsLimit);

  const filteredRequests = useMemo(() => {
    return myRequests.filter(r => {
      if (showEvaluatedOnly) {
        const slot = (data.schedules[r.courseId] || []).find(s => s.id === r.slotId);
        const isEval = r.status === 'approved' && slot?.enrolled.filter(e => r.workerIds.includes(e.id)).every(e => e.evaluation !== 'pending');
        if (!isEval) return false;
      }
      return true;
    });
  }, [myRequests, showEvaluatedOnly, data.schedules]);

  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * requestsLimit;
    return filteredRequests.slice(start, start + requestsLimit);
  }, [filteredRequests, requestsPage, requestsLimit]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (requestForm.workerIds.length === 0) return alert('Seleccione al menos un trabajador');
    
    try {
      await axios.post(`${API_BASE}/requests`, {
        ...requestForm,
        contractorId: user.id,
        contractorName: user.contractorName
      });
      setIsRequestModalOpen(false);
      setRequestForm({ courseId: '', slotId: '', workerIds: [], justification: '' });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear solicitud');
    }
  };

  const toggleWorkerSelection = (workerId) => {
    setRequestForm(prev => {
        const isSelected = prev.workerIds.includes(workerId);
        if (isSelected) {
            return { ...prev, workerIds: prev.workerIds.filter(id => id !== workerId) };
        } else {
            // Check capacity limit
            if (selectedSlotData && prev.workerIds.length >= (selectedSlotData.max - selectedSlotData.enrolled.length)) {
                alert('No hay más cupos disponibles en este horario');
                return prev;
            }
            return { ...prev, workerIds: [...prev.workerIds, workerId] };
        }
    });
  };

  const handleDownloadCertificate = (worker, req) => {
    const course = courses.find(c => c.id === req.courseId);
    const slot = (data.schedules[req.courseId] || []).find(s => s.id === req.slotId);
    const dateStr = slot ? slot.date : new Date().toLocaleDateString();
    const verificationCode = `CF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const certHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificado - ${worker.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .certificate { 
            width: 800px; 
            padding: 80px; 
            background: white; 
            border-radius: 40px; 
            box-shadow: 0 40px 100px rgba(0,0,0,0.05); 
            position: relative; 
            overflow: hidden; 
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .decor-1 { position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%); opacity: 0.1; filter: blur(40px); border-radius: 50%; }
          .decor-2 { position: absolute; bottom: -50px; left: -50px; width: 200px; height: 200px; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); opacity: 0.1; filter: blur(40px); border-radius: 50%; }
          
          .header { text-transform: uppercase; letter-spacing: 0.2em; font-weight: 900; color: #64748b; font-size: 14px; margin-bottom: 20px; }
          .title { font-size: 48px; font-weight: 900; color: #1e293b; margin-bottom: 40px; line-height: 1.1; }
          .subtitle { color: #94a3b8; font-size: 18px; margin-bottom: 60px; }
          
          .worker-info { margin-bottom: 60px; }
          .worker-name { font-size: 32px; font-weight: 900; color: #3b82f6; margin-bottom: 10px; }
          .worker-rut { font-size: 16px; font-weight: 700; color: #64748b; }
          
          .course-info { padding: 40px; background: #f1f5f9; border-radius: 32px; margin-bottom: 60px; }
          .course-name { font-size: 24px; font-weight: 900; color: #1e293b; margin-bottom: 10px; }
          .course-date { font-size: 14px; font-weight: 700; color: #64748b; }
          
          .footer { display: flex; justify-content: space-between; align-items: flex-end; }
          .verification { text-align: left; }
          .v-code { font-family: monospace; font-size: 12px; color: #94a3b8; }
          .v-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
          
          .signature { text-align: right; }
          .sig-line { width: 200px; height: 2px; background: #e2e8f0; margin-bottom: 10px; }
          .sig-text { font-size: 12px; font-weight: 700; color: #64748b; }

          @media print {
            body { background: white; }
            .certificate { box-shadow: none; border: none; }
            .no-print { display: none; }
          }
          
          .print-btn {
            position: fixed; top: 20px; right: 20px;
            padding: 15px 30px; background: #3b82f6; color: white;
            border: none; border-radius: 15px; font-weight: 900;
            cursor: pointer; box-shadow: 0 10px 20px rgba(59,130,246,0.3);
            text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
        <div class="certificate">
          <div class="decor-1"></div>
          <div class="decor-2"></div>
          
          <div class="header">Certificado de Capacitación</div>
          <div class="title">Otorgado a:</div>
          
          <div class="worker-info">
            <div class="worker-name">${worker.name}</div>
            <div class="worker-rut">RUT: ${worker.rut}</div>
          </div>
          
          <div class="subtitle">Por haber aprobado satisfactoriamente la charla de inducción:</div>
          
          <div class="course-info">
            <div class="course-name">${course?.name || 'Capacitación General'}</div>
            <div class="course-date">Realizada el ${dateStr}</div>
          </div>
          
          <div class="footer">
            <div class="verification">
              <div class="v-label">CÓDIGO VERIFICACIÓN</div>
              <div class="v-code">${verificationCode}</div>
            </div>
            <div class="signature">
              <div class="sig-line"></div>
              <div class="sig-text">Firma y Timbre Administrador</div>
              <div class="sig-text" style="font-size: 10px; font-weight: 400;">CapacitaFlow System</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(certHtml);
    win.document.close();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl border-b border-white/60 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">{user.cot_razon_social || 'Contratista Portal'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Portal de Gestión</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-200/40 p-1 rounded-2xl border border-white/40">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'dashboard' ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('workers')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'workers' ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Users className="w-4 h-4" /> Mis Trabajadores
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'requests' ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <ClipboardList className="w-4 h-4" /> Solicitudes
          </button>
        </nav>

        <div className="flex items-center gap-4">
           <div className="text-right">
             <div className="text-xs font-bold text-slate-800">{user.name}</div>
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Gestor Externo</div>
           </div>
           <button 
             onClick={onLogout}
             className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
           >
             <LogOut size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' ? (
          <Dashboard data={data} filterContractor={user.contractorName} />
        ) : activeTab === 'workers' ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nómina de Personal</h2>
                <p className="text-sm font-medium text-slate-400">Listado de colaboradores registrados bajo {user.contractorName}</p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
                <Users size={16} className="text-emerald-500" />
                {myWorkers.length} Trabajadores
              </div>
            </div>

            {fetchingWorkers && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando nómina por planta...</p>
              </div>
            )}

            {!fetchingWorkers && user.plantas?.map(planta => (
              <div key={planta.niv_id} className="mb-10">
                <div className="flex items-center gap-3 mb-4 ml-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <h3 className="text-lg font-black text-slate-700 tracking-tight">Planta: {planta.nombre}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                    ID: {planta.niv_id}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {myWorkers.filter(w => w.niv_id === planta.niv_id).length === 0 ? (
                    <div className="bg-white/40 p-6 rounded-[32px] border border-dashed border-slate-200 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                      No hay trabajadores registrados en esta planta
                    </div>
                  ) : (
                    myWorkers.filter(w => w.niv_id === planta.niv_id).map(w => (
                      <div key={`${planta.niv_id}-${w.id}`} className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Users size={28} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Activo</span>
                              <span className="text-xs font-bold text-slate-800">{w.rut}</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{w.nombre_completo}</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{w.cargo}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-12">
                          <div className="text-right">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Ingreso</div>
                              <div className="text-sm font-bold text-slate-600">{w.hireDate}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Planta</div>
                              <div className="text-sm font-bold text-slate-600">{planta.nombre}</div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => toggleWorkerSelection(w.id)}
                            className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                              requestForm.workerIds.includes(w.id) 
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                                : "bg-slate-50 text-slate-200 group-hover:text-emerald-500"
                            )}
                          >
                            <Plus size={20} className={requestForm.workerIds.includes(w.id) ? "rotate-45" : ""} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Workers Pagination */}
            {myWorkers.length > 0 && (
              <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrar</span>
                  <select 
                    value={workersLimit} 
                    onChange={(e) => { setWorkersLimit(parseInt(e.target.value)); setWorkersPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {[5, 10, 50, 500].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    disabled={workersPage === 1}
                    onClick={() => setWorkersPage(workersPage - 1)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 disabled:opacity-30"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  {[...Array(totalWorkersPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setWorkersPage(i + 1)}
                      className={cn(
                        "w-10 h-10 rounded-2xl text-xs font-black transition-all",
                        workersPage === i + 1 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={workersPage === totalWorkersPages}
                    onClick={() => setWorkersPage(workersPage + 1)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Solicitudes de Cupo</h2>
                <p className="text-sm font-medium text-slate-400">Gestiona las peticiones de capacitación para tu personal</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solo Evaluadas</span>
                  <button 
                    onClick={() => { setShowEvaluatedOnly(!showEvaluatedOnly); setRequestsPage(1); }}
                    className={cn(
                      "w-10 h-5 rounded-full p-0.5 transition-all flex items-center",
                      showEvaluatedOnly ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                    )}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <AeroButton onClick={() => setIsRequestModalOpen(true)} active className="px-6 flex items-center gap-2">
                  <Plus size={16} /> Nueva Solicitud
                </AeroButton>
              </div>
            </div>

            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                    <ClipboardList size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay solicitudes registradas</p>
                </div>
              ) : (
                paginatedRequests.map(req => {
                  const course = courses.find(c => c.id === req.courseId);
                  const slot = (data.schedules[req.courseId] || []).find(s => s.id === req.slotId);
                  return (
                    <div key={req.id} className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                req.status === 'pending' ? "bg-amber-50 text-amber-600" : 
                                req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                <CheckCircle size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h3 className="font-bold text-slate-800 leading-none">{course?.name || 'Curso Desconocido'}</h3>
                                 {slot && new Date(slot.date) < new Date() && req.status === 'approved' && (
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-full">Cursada</span>
                                 )}
                                 {req.status === 'approved' && slot?.enrolled.filter(e => req.workerIds.includes(e.id)).every(e => e.evaluation !== 'pending') && (
                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-full">Evaluada</span>
                                 )}
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-xs font-medium text-slate-400">
                                   {req.workerIds.length} Trabajadores • Sesión: {slot ? `${slot.date}` : 'N/A'}
                                </p>
                                {slot?.modality && (
                                   <div className={cn(
                                       "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest",
                                       slot.modality === 'online' ? "text-blue-500" : "text-amber-500"
                                   )}>
                                       {slot.modality === 'online' ? <Monitor size={8} /> : <MapPin size={8} />}
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
                        <button 
                            onClick={() => setSelectedRequest(req)}
                            className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
                        >
                            <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Requests Pagination */}
            {myRequests.length > 0 && (
              <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrar</span>
                  <select 
                    value={requestsLimit} 
                    onChange={(e) => { setRequestsLimit(parseInt(e.target.value)); setRequestsPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {[5, 10, 50, 500].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    disabled={requestsPage === 1}
                    onClick={() => setRequestsPage(requestsPage - 1)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 disabled:opacity-30"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  {[...Array(totalRequestsPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRequestsPage(i + 1)}
                      className={cn(
                        "w-10 h-10 rounded-2xl text-xs font-black transition-all",
                        requestsPage === i + 1 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={requestsPage === totalRequestsPages}
                    onClick={() => setRequestsPage(requestsPage + 1)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Detalle Solicitud (Contractor View) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden p-10 animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-8">
                <div>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Detalle de Solicitud</h3>
                 <p className="text-xs font-medium text-slate-400">Información enviada al Administrador</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50">
                 <XCircle size={24} />
                </button>
             </div>

             <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Curso / Charla</label>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-800">
                            {courses.find(c => c.id === selectedRequest.courseId)?.name}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Horario de Sesión</label>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-800">
                            {(() => {
                                const slot = (data.schedules[selectedRequest.courseId] || []).find(s => s.id === selectedRequest.slotId);
                                return (
                                    <div className="flex items-center gap-3">
                                        <span>{slot ? `${slot.date} (${slot.start} - ${slot.end})` : 'N/A'}</span>
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
                                );
                            })()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col h-full">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Personal en Solicitud ({selectedRequest.workerIds.length})</label>
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3 overflow-y-auto max-h-48">
                        {selectedRequest.workerIds.map(wid => {
                            const worker = data.workers.find(w => w.id === wid);
                            const slot = (data.schedules[selectedRequest.courseId] || []).find(s => s.id === selectedRequest.slotId);
                            const enrollment = slot?.enrolled.find(e => e.id === wid);

                            return (
                                <div key={wid} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                            <Users size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-800 truncate max-w-[120px]">{worker?.nombre_completo || 'Desconocido'}</div>
                                            <div className="text-[8px] font-bold text-slate-400">{worker?.rut} • {worker?.cargo}</div>
                                        </div>
                                    </div>
                                    
                                    {selectedRequest.status === 'approved' && (
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                                enrollment?.evaluation === 'passed' ? "bg-emerald-50 text-emerald-600" :
                                                enrollment?.evaluation === 'failed' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {enrollment?.evaluation === 'passed' ? 'Aprobado' : 
                                                enrollment?.evaluation === 'failed' ? 'Reprobado' : 'Pendiente'}
                                            </div>
                                            {enrollment?.evaluation === 'passed' && (
                                                <button 
                                                    onClick={() => handleDownloadCertificate(worker, selectedRequest)}
                                                    className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    title="Descargar Certificado"
                                                >
                                                    <Download size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>

             <div className="pt-4 border-t border-slate-100 text-center">
                <div className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest",
                    selectedRequest.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                    selectedRequest.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                )}>
                    {selectedRequest.status === 'approved' ? <CheckCircle size={16} /> : 
                     selectedRequest.status === 'pending' ? <Clock size={16} /> : <XCircle size={16} />}
                    Solicitud {selectedRequest.status === 'approved' ? 'Aprobada' : 
                               selectedRequest.status === 'pending' ? 'En Revisión (Pendiente)' : 'Rechazada'}
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Modal Nueva Solicitud */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 pb-0">
                <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Nueva Solicitud de Cupo</h3>
                <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <Plus className="rotate-45" size={24} />
                </button>
                </div>
            </div>

            <form onSubmit={handleCreateRequest} className="p-10 pt-0 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Curso / Charla</label>
                    <select 
                    required
                    value={requestForm.courseId}
                    onChange={e => setRequestForm({...requestForm, courseId: e.target.value, slotId: '', workerIds: []})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all appearance-none"
                    >
                    <option value="" disabled>Seleccione curso...</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Horario Disponible</label>
                    <select 
                    required
                    disabled={!requestForm.courseId}
                    value={requestForm.slotId}
                    onChange={e => setRequestForm({...requestForm, slotId: e.target.value, workerIds: []})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all appearance-none disabled:opacity-50"
                    >
                    <option value="" disabled>Seleccione horario...</option>
                    {availableSlots.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.date} ({s.start} - {s.end}) • {s.modality?.toUpperCase() || 'PRESENCIAL'} • Cupos: {s.max - s.enrolled.length}
                        </option>
                    ))}
                    </select>
                  </div>
              </div>

              {requestForm.slotId && (
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Seleccionar Trabajadores ({requestForm.workerIds.length} seleccionados)
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-slate-100">
                        {myWorkers.map(w => (
                            <button
                                type="button"
                                key={w.id}
                                onClick={() => toggleWorkerSelection(w.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                                    requestForm.workerIds.includes(w.id) 
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center",
                                    requestForm.workerIds.includes(w.id) ? "bg-white/20" : "bg-slate-100"
                                )}>
                                    <Users size={14} />
                                </div>
                                <div className="truncate">
                                    <div className="text-[10px] font-black leading-tight">{w.nombre_completo}</div>
                                    <div className="text-[8px] font-bold opacity-60 leading-tight">{w.rut}</div>
                                    <div className="text-[7px] font-black uppercase tracking-widest opacity-40 leading-none mt-1">{w.cargo}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Justificación / Motivo</label>
                <textarea 
                  value={requestForm.justification}
                  onChange={e => setRequestForm({...requestForm, justification: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all min-h-[80px]"
                  placeholder="Ej: Nuevos ingresos para el proyecto X..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!requestForm.slotId || requestForm.workerIds.length === 0}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/30 disabled:opacity-50"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
