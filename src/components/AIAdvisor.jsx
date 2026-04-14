import { useMemo } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, Info, AlertCircle, ShieldCheck, Receipt } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

const iconMap = {
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle,
  'trending-up': TrendingUp,
  'info': Info,
  'alert-circle': AlertCircle,
  'shield-check': ShieldCheck,
  'receipt': Receipt,
};

export default function AIAdvisor({ store }) {
  const { fc } = useCurrency();
  const stats = store.getStats();

  const insights = useMemo(() => {
    const results = [];

    if (stats.weekChecks.length > 0) {
      const total = stats.weekChecks.reduce((s, c) => s + (Number(c.value) || 0), 0);
      results.push({ icon: 'alert-triangle', color: '#fbbf24', text: `تنبيه: ${stats.weekChecks.length} شيكات مستحقة خلال أسبوع بقيمة ${fc(total)}` });
    } else {
      results.push({ icon: 'check-circle', color: '#34d399', text: 'لا شيكات مستحقة هذا الأسبوع — الوضع مستقر' });
    }

    if (stats.totalLiquidity > 15000000) {
      results.push({ icon: 'trending-up', color: '#22d3ee', text: 'السيولة مرتفعة جداً — يُنصح بتوجيه الفائض للاستثمارات' });
    } else {
      results.push({ icon: 'info', color: '#a78bfa', text: 'السيولة معتدلة — راقب التدفقات النقدية بعناية' });
    }

    if (stats.overLimitCustomers > 0) {
      results.push({ icon: 'alert-circle', color: '#f87171', text: `${stats.overLimitCustomers} عملاء تجاوزوا الحد الائتماني — مراجعة فورية مطلوبة` });
    } else {
      results.push({ icon: 'shield-check', color: '#34d399', text: 'جميع العملاء ضمن الحدود الائتمانية المعتمدة' });
    }

    results.push({ icon: 'receipt', color: '#a78bfa', text: `إجمالي ضريبة القيمة المضافة المحصّلة: ${fc(stats.totalVAT)}` });

    return results;
  }, [stats, fc]);

  return (
    <div className="ai-glow rounded-2xl">
      <div className="glass rounded-2xl p-4" style={{ background: 'rgba(15,23,42,.88)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-white">المستشار المالي</h3>
            <p className="text-[10px] text-surface-500">تحليل آلي للبيانات المالية</p>
          </div>
        </div>
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const IconComp = iconMap[insight.icon] || Info;
            return (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                <IconComp size={14} color={insight.color} className="mt-0.5 shrink-0" />
                <p className="text-[12px] text-surface-300 leading-relaxed">{insight.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
