import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { AeroButton, cn } from './ui/AeroUI';

const API_BASE = 'http://localhost:3001/api/v1';

export default function CharlasView({ categories, user, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    maxPerSlot: 15,
    niv_id: '',
    plantaNombre: ''
  });

  const openNewModal = () => {
    setEditingCourse(null);
    setFormData({ 
      name: '', 
      categoryId: categories[0]?.id || '', 
      maxPerSlot: 15,
      niv_id: user?.plantas?.[0]?.niv_id || '',
      plantaNombre: user?.plantas?.[0]?.nombre || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course, categoryId) => {
    setEditingCourse(course);
    setFormData({ 
      name: course.name, 
      categoryId, 
      maxPerSlot: course.maxPerSlot,
      niv_id: course.niv_id || '',
      plantaNombre: course.plantaNombre || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`${API_BASE}/courses/${editingCourse.id}`, formData);
      } else {
        await axios.post(`${API_BASE}/courses`, formData);
      }
      onRefresh();
      closeModal();
    } catch (err) {
      alert("Error al guardar la charla");
    }
  };

  const handleDelete = async (courseId, courseName) => {
    if (window.confirm(`¿Estás seguro de eliminar la charla "${courseName}"? Esto también eliminará todas las sesiones programadas para esta charla.`)) {
      try {
        await axios.delete(`${API_BASE}/courses/${courseId}`);
        onRefresh();
      } catch (err) {
        alert("Error al eliminar la charla");
      }
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
      <div className="p-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Catálogo de Charlas</h2>
          <p className="text-sm font-medium text-slate-400">Gestiona los cursos y capacitaciones disponibles</p>
        </div>
        <AeroButton onClick={openNewModal} active className="px-6 flex items-center gap-2 shadow-blue-500/20">
          <Plus size={16} /> Nueva Charla
        </AeroButton>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white/60 p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/50 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {cat.label.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{cat.label}</h3>
                <div className="ml-auto bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">
                  {cat.courses.length} charlas
                </div>
              </div>

              <div className="space-y-3">
                {cat.courses.map((course) => (
                  <div key={course.id} className="group flex items-center justify-between p-4 bg-white/80 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                    <div>
                      <div className="font-bold text-slate-800 text-sm mb-1">{course.name}</div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {course.plantaNombre || 'Sin Planta'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">ID: {course.id} • Capacidad: {course.maxPerSlot} personas/sesión</div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(course, cat.id)}
                        className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        title="Editar Charla"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id, course.name)}
                        className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Eliminar Charla"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {cat.courses.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-2xl">
                    No hay charlas en esta categoría
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCourse ? 'Editar Charla' : 'Nueva Charla'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Nombre de la Charla</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Ej. Uso de Extintores"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Categoría</label>
                <select 
                  required
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="" disabled>Seleccione una categoría...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Capacidad por sesión</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.maxPerSlot}
                  onChange={e => setFormData({...formData, maxPerSlot: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {user?.plantas && user.plantas.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Planta Asignada</label>
                  <select 
                    required
                    value={formData.niv_id}
                    onChange={e => {
                      const selectedPlant = user.plantas.find(p => p.niv_id.toString() === e.target.value);
                      setFormData({...formData, niv_id: e.target.value, plantaNombre: selectedPlant?.nombre || ''});
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Seleccione una planta...</option>
                    {user.plantas.map(p => (
                      <option key={p.niv_id} value={p.niv_id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
