import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ACCT_DIST } from '../data/chartData';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const total = ACCT_DIST.reduce((s, d) => s + d.value, 0);
  const pct = ((data.value / total) * 100).toFixed(1);

  return (
    <div style={{
      background: 'rgba(15,23,42,.92)',
      border: '1px solid rgba(148,163,184,.1)',
      borderRadius: 8,
      padding: '8px 14px',
      direction: 'rtl',
    }}>
      <p style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{data.name}</p>
      <p style={{ color: '#94a3b8', fontSize: 10 }}>{pct}% — {(data.value / 1e6).toFixed(1)}M</p>
    </div>
  );
}

export default function DonutChart() {
  const total = ACCT_DIST.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div className="flex justify-center">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={ACCT_DIST}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {ACCT_DIST.map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={0.8} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <text x="50%" y="48%" textAnchor="middle" fill="white" fontSize={12} fontWeight={700} fontFamily="IBM Plex Sans Arabic">
              الإجمالي
            </text>
            <text x="50%" y="60%" textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="IBM Plex Sans Arabic">
              {(total / 1e6).toFixed(1)}M
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-2.5">
        {ACCT_DIST.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[9.5px] text-surface-400 truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
