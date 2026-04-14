import { useCurrency } from '../contexts/CurrencyContext';
import * as Icons from 'lucide-react';

const colorMap = {
  cyan: { bg: 'from-cyan-500/[0.08] to-cyan-500/[0.03]', border: 'border-cyan-500/[0.15]', text: 'text-cyan-400', iconBg: 'bg-cyan-500/[0.12]', iconColor: '#22d3ee' },
  violet: { bg: 'from-violet-500/[0.08] to-violet-500/[0.03]', border: 'border-violet-500/[0.15]', text: 'text-violet-400', iconBg: 'bg-violet-500/[0.12]', iconColor: '#a78bfa' },
  emerald: { bg: 'from-emerald-500/[0.08] to-emerald-500/[0.03]', border: 'border-emerald-500/[0.15]', text: 'text-emerald-400', iconBg: 'bg-emerald-500/[0.12]', iconColor: '#34d399' },
  amber: { bg: 'from-amber-500/[0.08] to-amber-500/[0.03]', border: 'border-amber-500/[0.15]', text: 'text-amber-400', iconBg: 'bg-amber-500/[0.12]', iconColor: '#fbbf24' },
  rose: { bg: 'from-rose-500/[0.08] to-rose-500/[0.03]', border: 'border-rose-500/[0.15]', text: 'text-rose-400', iconBg: 'bg-rose-500/[0.12]', iconColor: '#fb7185' },
};

export default function StatCard({ icon, label, value, color = 'cyan', trend, sub }) {
  const c = colorMap[color] || colorMap.cyan;
  const IconComponent = Icons[icon] || Icons.Activity;

  return (
    <div className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${c.bg} border ${c.border} relative overflow-hidden`}>
      <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full ${c.iconBg} blur-2xl opacity-40`} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11.5px] text-surface-400 mb-0.5 font-medium">{label}</p>
          <p className={`text-lg font-bold ${c.text} tracking-tight`}>{value}</p>
          {sub && <p className="text-[10px] text-surface-500 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-[10.5px] mt-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${c.iconBg}`}>
          <IconComponent size={18} color={c.iconColor} />
        </div>
      </div>
    </div>
  );
}
