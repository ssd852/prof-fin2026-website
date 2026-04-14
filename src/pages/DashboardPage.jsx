import { Receipt, FileCheck, QrCode } from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import CashflowChart from '../components/CashflowChart';
import DonutChart from '../components/DonutChart';
import PredictiveChart from '../components/PredictiveChart';
import AIAdvisor from '../components/AIAdvisor';
import PrintButton from '../components/PrintButton';
import PrintHeader, { PrintFooter } from '../components/PrintHeader';
import { useCurrency } from '../contexts/CurrencyContext';

export default function DashboardPage({ store, onToggle }) {
  const { fc } = useCurrency();
  const stats = store.getStats();

  return (
    <div className="space-y-4">
      <Header onToggle={onToggle} />
      <PrintHeader />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">لوحة التحكم</h2>
          <p className="text-[11px] text-surface-400 mt-0.5">نظرة شاملة على الأداء المالي لشركتك</p>
        </div>
        <PrintButton />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <StatCard icon="Banknote" label="إجمالي السيولة" value={fc(stats.totalLiquidity)} color="cyan" trend={12.5} />
        <StatCard icon="Users" label="العملاء" value={String(stats.activeCustomers)} color="violet" trend={8.3} />
        <StatCard icon="Clock" label="شيكات معلقة" value={`${stats.pendingChecks}`} color="amber" sub={fc(stats.pendingChecksValue)} />
        <StatCard icon="TrendingUp" label="صافي الربح" value={fc(stats.netProfit)} color="emerald" trend={15.7} />
        <StatCard icon="AlertTriangle" label="تجاوز الائتمان" value={`${stats.overLimitCustomers} عميل`} color="rose" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-white">التدفق النقدي</h3>
              <p className="text-[10px] text-surface-500 mt-0.5">مقارنة الإيرادات والمصروفات</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary-400" />
                <span className="text-[10px] text-surface-400">إيرادات</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
                <span className="text-[10px] text-surface-400">مصروفات</span>
              </div>
            </div>
          </div>
          <CashflowChart />
        </div>
        <AIAdvisor store={store} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/></svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-white">التنبؤ بالسيولة المستقبلية</h3>
              <p className="text-[10px] text-surface-500">تحليل تنبؤي مبني على الشيكات المستحقة</p>
            </div>
            <span className="ms-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/[0.15]">تنبؤي</span>
          </div>
          <PredictiveChart store={store} />
        </div>
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-[13px] font-bold text-white mb-1">توزيع الحسابات</h3>
          <p className="text-[10px] text-surface-500 mb-2">توزيع الأرصدة حسب الحساب</p>
          <DonutChart />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Sales */}
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-[13px] font-bold text-white mb-2">آخر فواتير المبيعات</h3>
          <div className="space-y-1.5">
            {store.getAll('sales_invoices').slice(-5).reverse().map((inv) => {
              const customer = store.getById('customers', inv.customer_id);
              return (
                <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary-500/10 flex items-center justify-center">
                      <Receipt size={13} color="#22d3ee" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-medium text-surface-200">{inv.description}</p>
                      <p className="text-[9.5px] text-surface-500">{customer ? customer.name : '—'}</p>
                    </div>
                  </div>
                  <div className="text-left flex items-center gap-2">
                    <div className="qr-icon" title={inv.qr_code_hash}>
                      <QrCode size={13} color="#a78bfa" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-bold text-emerald-400">+{fc(inv.total_value)}</p>
                      <p className="text-[9.5px] text-surface-500">{inv.date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Checks */}
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-[13px] font-bold text-white mb-2">الشيكات المعلقة</h3>
          <div className="space-y-1.5">
            {store.getAll('checks').filter((c) => c.status === 'معلق').slice(0, 5).map((check) => {
              const customer = store.getById('customers', check.customer_id);
              return (
                <div key={check.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <FileCheck size={13} color="#fbbf24" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-medium text-surface-200">{customer ? customer.name : '—'}</p>
                      <p className="text-[9.5px] text-surface-500">استحقاق: {check.due_date}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[11.5px] font-bold text-amber-400">{fc(check.value)}</p>
                    <span className="badge badge-pending text-[8.5px]">معلق</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PrintFooter />
    </div>
  );
}
