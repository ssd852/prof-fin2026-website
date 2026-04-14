import { Menu, Search, LogOut, Shield } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onToggle }) {
  const { cur, setCur } = useCurrency();
  const { role, signOut } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 glass border-b border-white/5 mb-3 rounded-xl mx-0.5 no-print" style={{ background: 'rgba(15,23,42,.45)' }}>
      <button className="btn-icon md:hidden" onClick={onToggle}>
        <Menu size={20} color="#94a3b8" />
      </button>
      <div className="flex items-center gap-3 mr-auto">
        {/* Currency Toggle */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/5">
          {['ILS', 'JOD'].map((c) => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                cur === c
                  ? 'bg-gradient-to-r from-primary-500/[0.15] to-accent-500/[0.15] text-primary-300 border border-primary-500/[0.12]'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              {c === 'ILS' ? '₪ شيكل' : '🇯🇴 دينار'}
            </button>
          ))}
        </div>

        {/* Role Badge */}
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          role === 'مدير' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/[0.15]' :
          role === 'محاسب' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/[0.15]' :
          'bg-violet-500/10 text-violet-400 border border-violet-500/[0.15]'
        }`}>
          <Shield size={11} className="inline-flex ml-1" />
          {role}
        </span>

        {/* Search */}
        <button className="btn-icon" onClick={() => document.dispatchEvent(new CustomEvent('openCmd'))} title="Ctrl+K">
          <Search size={15} color="#64748b" />
        </button>

        {/* Logout */}
        <button className="btn-icon hover:bg-red-500/10" onClick={signOut} title="تسجيل الخروج">
          <LogOut size={15} color="#f87171" />
        </button>
      </div>
    </div>
  );
}
