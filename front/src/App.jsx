import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LayoutGrid, Users, Calendar, Search, LogOut, ChevronRight, CheckCircle2, Presentation, ClipboardList, LayoutDashboard, AlertCircle, Zap } from 'lucide-react';
import CourseSidebar from './components/CourseSidebar';
import AgendaPanel from './components/AgendaPanel';
import WorkerTable from './components/WorkerTable';
import SchedulingView from './components/SchedulingView';
import CharlasView from './components/CharlasView';
import Login from './components/Login';
import ContractorView from './components/ContractorView';
import RequestsView from './components/RequestsView';
import Dashboard from './components/Dashboard';
import { AeroButton, cn } from './components/ui/AeroUI';
import config from './config';

const API_BASE = config.API_BASE;

import { decryptDataString } from './utils/crypto';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard'); // 'dashboard' | 'scheduling' | 'charlas' | 'requests'
  const [data, setData] = useState({ categories: [], workers: [], schedules: {}, users: [], requests: [] });
  const [user, setUser] = useState(() => {
    // Check URL parameters for automated login (Bypass Login)
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');
    if (encodedData) {
      try {
        // New Secure Decryption (AES-256-CBC + GZInflate)
        const userData = decryptDataString(encodedData);
        
        if (userData) {
          const mappedUser = {
            id: userData.usu_usuario,
            name: userData.usu_usuario,
            email: userData.usu_correo,
            role: userData.rol,
            plantas: userData.plantas || [],
            cot_id: userData.cot_id,
            cot_razon_social: userData.cot_razon_social,
            contractorName: userData.rol === 'Contratista' ? (userData.cot_razon_social || 'Empresa Contratista') : null
          };
          // Also save to localStorage to persist
          localStorage.setItem('capacitaUser', JSON.stringify(mappedUser));
          return mappedUser;
        }
      } catch (err) {
        console.error("Error decoding URL data:", err.message);
      }
    }
    
    // Fallback to localStorage
    const savedUser = localStorage.getItem('capacitaUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [bypassActive, setBypassActive] = useState(false);

  useEffect(() => {
    fetchData();

    // Clean URL if we came from a bypass
    const params = new URLSearchParams(window.location.search);
    if (params.get('data')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setBypassActive(true);
    }
  }, []);

  useEffect(() => {
    if (bypassActive && user) {
      showToast(`Acceso automático: Bienvenido ${user.name}`);
      setBypassActive(false);
    }
  }, [bypassActive, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/data`);
      setData(res.data);
    } catch (err) {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Logic Helpers
  const courses = data.categories.flatMap(c => c.courses);
  const currentCourse = courses.find(c => c.id === selectedCourseId);
  const currentSchedules = data.schedules[selectedCourseId] || [];
  
  const filteredWorkers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.workers.filter(w => 
      w.name.toLowerCase().includes(q) || 
      w.rut.includes(q) || 
      w.contractor.toLowerCase().includes(q)
    );
  }, [data.workers, searchQuery]);

  // Map of workerId -> schedule that they are enrolled in for the current course
  const enrollmentMap = useMemo(() => {
    const map = {};
    currentSchedules.forEach(s => {
      s.enrolled?.forEach(wid => {
        map[wid] = s;
      });
    });
    return map;
  }, [currentSchedules]);

  // Actions
  const handleEnroll = async () => {
    if (!selectedSlot || selectedWorkers.length === 0) return;
    try {
      await axios.post(`${API_BASE}/enroll`, {
        courseId: selectedCourseId,
        slotId: selectedSlot.id,
        workerIds: selectedWorkers
      });
      showToast(`${selectedWorkers.length} trabajador(es) inscritos ✓`);
      setSelectedWorkers([]);
      setSelectedSlot(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al inscribir', 'error');
    }
  };

  const handleAddSlot = async (slotData) => {
    try {
      const newSlot = { ...slotData, id: `s${Date.now()}`, enrolled: [] };
      await axios.post(`${API_BASE}/schedules`, {
        courseId: selectedCourseId,
        slot: newSlot
      });
      showToast('Sesión programada correctamente');
      fetchData();
    } catch (err) {
      showToast('Error al guardar sesión', 'error');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axios.delete(`${API_BASE}/schedules/${selectedCourseId}/${slotId}`);
      showToast('Sesión eliminada');
      fetchData();
    } catch (err) {
      showToast('Error al eliminar', 'error');
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('capacitaUser', JSON.stringify(userData));
    showToast(`Bienvenido, ${userData.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('capacitaUser');
    setUser(null);
    showToast('Sesión cerrada');
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        <div className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Cargando</div>
      </div>
    </div>
  );

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // If contractor role, show the contractor console
  if (user.role === 'Contratista') {
    return <ContractorView user={user} data={data} onLogout={handleLogout} onRefresh={fetchData} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl border-b border-white/60 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">Capacitaciones Molycop</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Console / Admin</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-200/40 p-1 rounded-2xl border border-white/40">
          <button 
            onClick={() => setActiveModule('dashboard')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeModule === 'dashboard' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveModule('scheduling')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeModule === 'scheduling' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Calendar className="w-4 h-4" /> Programación
          </button>
          <button 
            onClick={() => setActiveModule('charlas')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeModule === 'charlas' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Presentation className="w-4 h-4" /> Charlas
          </button>
          <button 
            onClick={() => setActiveModule('requests')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
              activeModule === 'requests' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <ClipboardList className="w-4 h-4" /> Solicitudes
          </button>
        </nav>

        <div className="flex items-center gap-4">
           <div className="text-right">
             <div className="text-xs font-bold text-slate-800">{user.name}</div>
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{user.role}</div>
           </div>
           <button 
             onClick={handleLogout}
             className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
           >
             <LogOut size={18} />
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Module Sidebar */}
        {(activeModule === 'scheduling') && (
          <CourseSidebar 
            categories={data.categories} 
            selectedCourse={selectedCourseId}
            onSelectCourse={(id) => { setSelectedCourseId(id); setSelectedSlot(null); setSelectedWorkers([]); }} 
          />
        )}

        {/* Main Content Area */}
        {activeModule === 'dashboard' ? (
          <Dashboard data={data} />
        ) : activeModule === 'scheduling' ? (
          <SchedulingView 
            course={currentCourse}
            schedules={currentSchedules}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        ) : activeModule === 'charlas' ? (
          <CharlasView 
            categories={data.categories}
            user={user}
            onRefresh={fetchData}
          />
        ) : (
          <RequestsView 
            requests={data.requests}
            data={data}
            onRefresh={fetchData}
            showToast={showToast}
          />
        )}
      </div>

      {toast && (
        <div className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300",
          toast.type === 'success' ? "bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20" : "bg-red-600 text-white border-red-400 shadow-red-500/20"
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

