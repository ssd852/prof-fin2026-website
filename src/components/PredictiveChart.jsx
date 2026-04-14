import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

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
      <p style={{ color: 'white', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#10b981', fontSize: 10 }}>سيولة متوقعة: {fc(payload[0]?.value || 0)}</p>
    </div>
  );
}

export default function PredictiveChart({ store }) {
  const data = useMemo(() => {
    const checks = store.getAll('checks').filter((c) => c.status === 'معلق');
    const stats = store.getStats();
    const months = ['أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر'];
    let liquidity = stats.totalLiquidity;

    return months.map((month, i) => {
      const due = checks
        .filter((c) => {
          const d = new Date(c.due_date);
          return d.getMonth() === 3 + i;
        })
        .reduce((s, c) => s + (Number(c.value) || 0), 0);
      const projected = liquidity + Math.round(2200000 * (1 + i * 0.05)) - Math.round(1600000 * (1 + i * 0.03)) - due;
      liquidity = projected;
      return { month, value: projected };
    });
  }, [store]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
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
          tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
          orientation="right"
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#predGrad)"
          dot={{ fill: '#0f172a', stroke: '#10b981', strokeWidth: 2, r: 3.5 }}
          activeDot={{ r: 5, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
