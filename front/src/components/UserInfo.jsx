import React from 'react';
import { Mail } from 'lucide-react';

export default function UserInfo({ user }) {
  if (!user) return null;

  const roleDisplay = user.role === 'Contratista' ? 'Gestor Externo' : user.role;

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-xs font-bold text-slate-800 tracking-tight leading-tight">
        {user.name}
      </div>
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
        {roleDisplay}
      </div>
      {user.email && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium font-sans lowercase leading-none select-all transition-all duration-200 hover:text-blue-500">
          <Mail size={10} className="text-slate-300" />
          <span>{user.email}</span>
        </div>
      )}
    </div>
  );
}
