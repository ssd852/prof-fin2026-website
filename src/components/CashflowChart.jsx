import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCurrency } from '../contexts/CurrencyContext';
import { CASHFLOW } from '../data/chartData';

function CustomTooltip({ active, payload, label }) {
  const { fc } = useCurrency();
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: 'rgba(15,23,42,.92)',
      border: '1px solid rgba(148,163,184,.1)',
      borderRadius: 8,
      padding: '10px 14px',
      direction: 'rtl',
    }}>
      <p style={{ color: 'white', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: 10, marginBottom: 2 }}>
          {entry.name}: {fc(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function CashflowChart() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={CASHFLOW} barGap={2}>
        <defs>
          <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.45} />
          </linearGradient>
          <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.04)" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'IBM Plex Sans Arabic' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000)}K`}
          orientation="right"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="inflow" name="إيرادات" fill="url(#inflowGrad)" radius={[3, 3, 0, 0]} barSize={14} />
        <Bar dataKey="outflow" name="مصروفات" fill="url(#outflowGrad)" radius={[3, 3, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
