import React, { useState } from 'react';
import { ChevronRight, Zap, CheckCircle2, Settings, Globe, AlertCircle } from 'lucide-react';
import { cn } from './ui/AeroUI';

const CATEGORY_ICONS = {
  seg: <Zap className="w-4 h-4 text-emerald-500" />,
  cal: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  ope: <Settings className="w-4 h-4 text-slate-500" />,
  med: <Globe className="w-4 h-4 text-teal-500" />,
  eme: <AlertCircle className="w-4 h-4 text-amber-500" />,
};

export default function CourseSidebar({ categories, selectedCourse, onSelectCourse }) {
  const [openCats, setOpenCats] = useState({});

  const toggleCat = (id) => {
    setOpenCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="w-72 h-full glass-panel flex flex-col border-r border-slate-200/50">
      <div className="p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Catálogo de Cursos</h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-1">
            <button
              onClick={() => toggleCat(cat.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/50 transition-all group"
            >
              <ChevronRight 
                className={cn(
                  "w-3 h-3 text-slate-400 transition-transform duration-300",
                  openCats[cat.id] && "rotate-90"
                )} 
              />
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors uppercase">
                {CATEGORY_ICONS[cat.id]}
                {cat.label.replace(/^.*? /, '')}
              </span>
            </button>

            {openCats[cat.id] && (
              <div className="ml-6 space-y-1 border-l border-slate-200/50">
                {cat.courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm rounded-r-lg transition-all",
                      selectedCourse === course.id
                        ? "bg-blue-600/10 text-blue-700 font-medium border-l-2 border-blue-600 pl-[14px]"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border-l-2 border-transparent"
                    )}
                  >
                    <div className="leading-tight">{course.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">máx. {course.maxPerSlot} asis.</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
