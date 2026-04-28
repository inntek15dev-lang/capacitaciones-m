import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function GlassCard({ children, className, ...props }) {
  return (
    <div 
      className={cn(
        "glass-card p-4",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function AeroButton({ children, active, className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
        active 
          ? "bg-blue-600/90 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
          : "bg-white/40 text-slate-600 hover:bg-white/70 border border-white/50 hover:shadow-md hover:scale-[1.01]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
