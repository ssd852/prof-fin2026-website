import { useState } from 'react';
import { BarChart3, X, ChevronDown, ChevronLeft } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

export default function PLModal({ isOpen, onClose, store }) {
  const { fc } = useCurrency();
  const [expanded, setExpanded] = useState({});

  if (!isOpen) return null;

  const si = store.getAll('sales_invoices');
  const pi = store.getAll('purchase_invoices');
  const grossSales = si.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const grossPurchases = pi.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const vatCollected = si.reduce((s, i) => s + (Number(i.vat_tax) || 0), 0);
  const vatPaid = pi.reduce((s, i) => s + (Number(i.vat_tax) || 0), 0);
  const opex = 1255000;
  const grossProfit = grossSales - grossPurchases;
  const netProfit = grossProfit - opex;

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const Row = ({ label, val, bold, indent, expandKey, children }) => (
    <>
      <div
        onClick={expandKey ? () => toggle(expandKey) : undefined}
        className={`flex items-center justify-between py-2 px-3 rounded-lg ${bold ? 'bg-white/[0.03]' : ''} ${expandKey ? 'cursor-pointer hover:bg-white/[0.04]' : ''} ${indent ? 'pe-8' : ''}`}
      >
        <div className="flex items-center gap-2">
          {expandKey && (expanded[expandKey] ? <ChevronDown size={13} color="#64748b" /> : <ChevronLeft size={13} color="#64748b" />)}
          <span className={`text-[12.5px] ${bold ? 'font-bold text-white' : 'text-surface-300'}`}>{label}</span>
        </div>
        <span className={`text-[12.5px] font-mono ${val >= 0 ? (bold ? 'text-emerald-400' : 'text-surface-300') : 'text-red-400'} ${bold ? 'font-bold' : ''}`}>
          {fc(Math.abs(val))}{val < 0 ? ' -' : ''}
        </span>
      </div>
      {expandKey && expanded[expandKey] && <div className="mb-1">{children}</div>}
    </>
  );

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 600 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} color="#22d3ee" />
            <h3 className="text-[15px] font-bold text-white">قائمة الأرباح والخسائر</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={17} color="#94a3b8" />
          </button>
        </div>
        <div className="space-y-1">
          <Row label="إجمالي الإيرادات" val={grossSales} bold expandKey="rev">
            {si.slice(-5).map((i) => <Row key={i.id} label={i.description} val={i.subtotal} indent />)}
          </Row>
          <Row label="تكلفة المبيعات (المشتريات)" val={-grossPurchases} bold expandKey="cogs">
            {pi.slice(-5).map((i) => <Row key={i.id} label={i.description} val={i.subtotal} indent />)}
          </Row>
          <div className="border-t border-white/5 my-2" />
          <Row label="مجمل الربح" val={grossProfit} bold />
          <Row label="المصروفات التشغيلية" val={-opex} bold expandKey="opex">
            <Row label="رواتب وأجور" val={960000} indent />
            <Row label="إيجارات" val={145000} indent />
            <Row label="كهرباء ومرافق" val={50000} indent />
            <Row label="مصروفات أخرى" val={100000} indent />
          </Row>
          <div className="border-t border-white/5 my-2" />
          <Row label="صافي الربح قبل الضريبة" val={netProfit} bold />
          <Row label="ضريبة القيمة المضافة المحصّلة" val={vatCollected} />
          <Row label="ضريبة القيمة المضافة المدفوعة" val={-vatPaid} />
          <div className="border-t border-white/5 my-2" />
          <Row label="صافي الضريبة المستحقة" val={vatCollected - vatPaid} bold />
        </div>
      </div>
    </div>
  );
}
