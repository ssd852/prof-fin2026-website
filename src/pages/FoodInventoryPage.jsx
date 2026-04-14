import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Search, Pencil, Trash2, Lock, Printer, FileText, Table,
  FileSpreadsheet, UtensilsCrossed, AlertTriangle, Inbox, X, Loader,
  Package, TrendingUp, Clock, DollarSign, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Header from '../components/Header';
import PrintHeader, { PrintFooter } from '../components/PrintHeader';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const CATEGORIES = [
  'الكل', 'حلويات', 'وجبات رئيسية', 'مشروبات', 'مقبلات',
  'زيوت ومعلبات', 'خضار وفواكه', 'لحوم ودواجن', 'منتجات ألبان',
  'بهارات وتوابل', 'حبوب وبقوليات',
];
const UNITS = ['كيلو', 'حبة', 'لتر', 'علبة', 'كرتونة', 'كيس', 'صندوق'];
const CAT_COLORS = {
  'حلويات': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/15' },
  'وجبات رئيسية': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15' },
  'مشروبات': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/15' },
  'مقبلات': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/15' },
  'زيوت ومعلبات': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/15' },
  'خضار وفواكه': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15' },
  'لحوم ودواجن': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15' },
  'منتجات ألبان': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/15' },
  'بهارات وتوابل': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/15' },
  'حبوب وبقوليات': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/15' },
};

const PP = 8; // items per page

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
const calcTotal = (qty, cost) => (Number(qty) || 0) * (Number(cost) || 0);
const calcMargin = (cost, sell) => {
  const c = Number(cost) || 0;
  const s = Number(sell) || 0;
  if (c <= 0) return 0;
  return ((s - c) / c) * 100;
};
const daysUntilExpiry = (dateStr) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp - now) / 86400000);
};
const isExpiringSoon = (dateStr) => {
  const days = daysUntilExpiry(dateStr);
  return days >= 0 && days <= 30;
};
const isExpired = (dateStr) => daysUntilExpiry(dateStr) < 0;

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function FoodInventoryPage({ store, onToggle }) {
  const items = store.getAll('food_inventory');
  const { fc, cur } = useCurrency();
  const { canAdd, canEdit, canDelete } = useAuth();
  const { show } = useToast();
  const printRef = useRef(null);

  /* ── State ── */
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* ── Filtered data ── */
  const filtered = useMemo(() => {
    let list = [...items];
    if (catFilter !== 'الكل') list = list.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.item_name?.toLowerCase().includes(q) ||
        i.supplier_name?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, catFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PP));
  useEffect(() => { setPage(1); }, [search, catFilter]);
  const paged = filtered.slice((page - 1) * PP, page * PP);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + calcTotal(i.quantity, i.cost_price), 0);
    const totalSellValue = items.reduce((s, i) => s + calcTotal(i.quantity, i.sell_price), 0);
    const avgMargin = items.length > 0
      ? items.reduce((s, i) => s + calcMargin(i.cost_price, i.sell_price), 0) / items.length
      : 0;
    const expiringSoon = items.filter((i) => isExpiringSoon(i.expiry_date)).length;
    const expired = items.filter((i) => isExpired(i.expiry_date)).length;
    return { totalValue, totalSellValue, avgMargin, expiringSoon, expired };
  }, [items]);

  /* ═══ CRUD ═══ */
  const handleSubmit = (formData) => {
    const processed = { ...formData };
    processed.quantity = Number(processed.quantity) || 0;
    processed.cost_price = Number(processed.cost_price) || 0;
    processed.sell_price = Number(processed.sell_price) || 0;

    if (editItem) {
      store.update('food_inventory', editItem.id, processed);
      show('تم تحديث الصنف بنجاح ✓');
    } else {
      store.add('food_inventory', processed);
      show('تمت إضافة الصنف بنجاح ✓');
    }
    setModalOpen(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    store.remove('food_inventory', id);
    show('تم حذف الصنف بنجاح ✓');
    setDeleteConfirm(null);
  };

  /* ═══ EXPORT: CSV with BOM ═══ */
  const exportCSV = () => {
    const headers = ['#', 'اسم الصنف', 'التصنيف', 'الكمية', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'إجمالي القيمة', 'هامش الربح %', 'المورد', 'تاريخ الانتهاء'];
    const rows = filtered.map((i) => [
      i.id,
      i.item_name,
      i.category,
      i.quantity,
      i.unit,
      i.cost_price,
      i.sell_price,
      calcTotal(i.quantity, i.cost_price),
      calcMargin(i.cost_price, i.sell_price).toFixed(1) + '%',
      i.supplier_name,
      i.expiry_date,
    ]);
    const csvContent = [headers, ...rows].map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'جرد-الأصناف-الغذائية.csv';
    a.click();
    URL.revokeObjectURL(url);
    show('تم تصدير CSV بنجاح ✓', 'info');
  };

  /* ═══ EXPORT: Excel ═══ */
  const exportExcel = () => {
    const data = [
      ['#', 'اسم الصنف', 'التصنيف', 'الكمية', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'إجمالي القيمة', 'هامش الربح %', 'المورد', 'تاريخ الانتهاء'],
      ...filtered.map((i) => [
        i.id, i.item_name, i.category, i.quantity, i.unit,
        i.cost_price, i.sell_price, calcTotal(i.quantity, i.cost_price),
        parseFloat(calcMargin(i.cost_price, i.sell_price).toFixed(1)),
        i.supplier_name, i.expiry_date,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 4 }, { wch: 24 }, { wch: 14 }, { wch: 8 }, { wch: 8 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'جرد الأصناف');
    XLSX.writeFile(wb, 'جرد-الأصناف-الغذائية.xlsx');
    show('تم تصدير Excel بنجاح ✓', 'info');
  };

  /* ═══ EXPORT: PDF via html2canvas ═══ */
  const exportPDF = async () => {
    setPdfLoading(true);
    try {
      const el = printRef.current;
      if (!el) { setPdfLoading(false); return; }
      el.style.display = 'block';
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '-9999px';
      el.style.width = '1100px';
      el.style.zIndex = '-1';
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      el.style.display = 'none';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      if (pdfH <= pdf.internal.pageSize.getHeight()) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      } else {
        let yOffset = 0;
        const pageH = pdf.internal.pageSize.getHeight();
        while (yOffset < pdfH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH);
          yOffset += pageH;
        }
      }
      pdf.save('تقرير-جرد-الأصناف-الغذائية.pdf');
      show('تم تصدير PDF بنجاح ✓', 'info');
    } catch (err) {
      show('خطأ في تصدير PDF', 'error');
    }
    setPdfLoading(false);
  };

  /* ═══ PRINT ═══ */
  const handlePrint = () => window.print();

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="food-inv-page">
      <Header onToggle={onToggle} />
      <PrintHeader />

      {/* ── Title Bar ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/15 flex items-center justify-center">
            <UtensilsCrossed size={18} color="#fbbf24" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">جرد الأصناف الغذائية</h2>
            <p className="text-[11px] text-surface-400 mt-0.5">إدارة وتتبع المخزون الغذائي — {items.length} صنف</p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          {canAdd && (
            <button
              className="btn-primary flex items-center gap-1.5"
              onClick={() => { setEditItem(null); setModalOpen(true); }}
            >
              <Plus size={14} />
              <span>إضافة صنف</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        <div className="glass-card rounded-2xl p-3.5 bg-gradient-to-br from-cyan-500/[0.06] to-cyan-500/[0.02] border border-cyan-500/[0.12]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10.5px] text-surface-400 font-medium mb-0.5">عدد الأصناف</p>
              <p className="text-lg font-bold text-cyan-400">{items.length}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-cyan-500/10"><Package size={16} color="#22d3ee" /></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-3.5 bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.02] border border-emerald-500/[0.12]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10.5px] text-surface-400 font-medium mb-0.5">إجمالي قيمة المخزون</p>
              <p className="text-lg font-bold text-emerald-400">{fc(stats.totalValue)}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10"><DollarSign size={16} color="#34d399" /></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-3.5 bg-gradient-to-br from-violet-500/[0.06] to-violet-500/[0.02] border border-violet-500/[0.12]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10.5px] text-surface-400 font-medium mb-0.5">متوسط هامش الربح</p>
              <p className="text-lg font-bold text-violet-400">{stats.avgMargin.toFixed(1)}%</p>
            </div>
            <div className="p-1.5 rounded-lg bg-violet-500/10"><TrendingUp size={16} color="#a78bfa" /></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-3.5 bg-gradient-to-br from-amber-500/[0.06] to-amber-500/[0.02] border border-amber-500/[0.12]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10.5px] text-surface-400 font-medium mb-0.5">قريبة الانتهاء</p>
              <p className="text-lg font-bold text-amber-400">{stats.expiringSoon}
                {stats.expired > 0 && <span className="text-[10px] text-red-400 ms-1.5">({stats.expired} منتهية)</span>}
              </p>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-500/10"><Clock size={16} color="#fbbf24" /></div>
          </div>
        </div>
      </div>

      {/* ── Search + Category Filter + Export ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5 no-print">
        <div className="relative flex-1">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search size={13} color="#475569" />
          </div>
          <input
            className="form-input"
            style={{ paddingRight: '34px', fontSize: '12.5px' }}
            placeholder="بحث بالاسم أو المورد أو التصنيف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter size={12} color="#475569" />
          </div>
          <select
            className="form-select"
            style={{ paddingRight: '34px', minWidth: 150 }}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="export-btn export-csv" onClick={exportCSV}>
            <FileSpreadsheet size={12} />CSV
          </button>
          <button className="export-btn export-excel" onClick={exportExcel}>
            <Table size={12} />Excel
          </button>
          <button className="export-btn export-pdf" onClick={exportPDF} disabled={pdfLoading}>
            {pdfLoading
              ? <Loader size={12} className="animate-spin" />
              : <FileText size={12} />}
            PDF
          </button>
          <button className="print-btn" onClick={handlePrint} style={{ padding: '6px 12px' }}>
            <Printer size={13} />
            <span className="text-[11px]">طباعة</span>
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="overflow-auto rounded-2xl glass" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        <table className="data-table" id="food-table">
          <thead>
            <tr>
              <th style={{ width: 38 }}>#</th>
              <th>اسم الصنف</th>
              <th>التصنيف</th>
              <th>الكمية</th>
              <th>الوحدة</th>
              <th>سعر التكلفة</th>
              <th>سعر البيع</th>
              <th>إجمالي القيمة</th>
              <th>هامش الربح</th>
              <th>المورد</th>
              <th>تاريخ الانتهاء</th>
              <th style={{ width: 75 }} className="no-print">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-10 text-surface-500">
                  <Inbox size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[13px]">لا توجد أصناف مطابقة</p>
                </td>
              </tr>
            ) : (
              paged.map((item) => {
                const total = calcTotal(item.quantity, item.cost_price);
                const margin = calcMargin(item.cost_price, item.sell_price);
                const expired = isExpired(item.expiry_date);
                const expSoon = isExpiringSoon(item.expiry_date);
                const days = daysUntilExpiry(item.expiry_date);
                const catStyle = CAT_COLORS[item.category] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/15' };

                return (
                  <tr key={item.id} className={expired ? 'row-warning' : expSoon ? '!bg-amber-500/[0.03]' : ''}>
                    <td className="text-surface-500 font-mono text-[11px]">{item.id}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-surface-200 text-[12.5px]">{item.item_name}</span>
                        {expired && <AlertTriangle size={12} color="#f87171" />}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="font-mono text-[12.5px] text-surface-300">{item.quantity}</td>
                    <td className="text-[12px] text-surface-400">{item.unit}</td>
                    <td className="font-mono text-[12.5px] text-surface-300">{fc(item.cost_price)}</td>
                    <td className="font-mono text-[12.5px] text-emerald-400">{fc(item.sell_price)}</td>
                    <td className="font-mono text-[12.5px] font-semibold text-primary-400">{fc(total)}</td>
                    <td>
                      <span className={`font-mono text-[12.5px] font-bold ${
                        margin >= 50 ? 'text-emerald-400'
                        : margin >= 25 ? 'text-amber-400'
                        : 'text-red-400'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-[11.5px] text-surface-400 truncate max-w-[140px]">{item.supplier_name}</td>
                    <td>
                      <span className={`text-[11.5px] font-medium ${
                        expired ? 'text-red-400'
                        : expSoon ? 'text-amber-400'
                        : 'text-surface-400'
                      }`}>
                        {item.expiry_date}
                        {expired && <span className="text-[9px] text-red-400 block">منتهي!</span>}
                        {expSoon && !expired && <span className="text-[9px] text-amber-400 block">{days} يوم</span>}
                      </span>
                    </td>
                    <td className="no-print">
                      <div className="flex gap-0.5">
                        {canEdit && (
                          <button className="btn-icon" onClick={() => { setEditItem(item); setModalOpen(true); }} title="تعديل">
                            <Pencil size={13} color="#22d3ee" />
                          </button>
                        )}
                        {canDelete ? (
                          <button className="btn-icon" onClick={() => setDeleteConfirm(item)} title="حذف">
                            <Trash2 size={13} color="#f87171" />
                          </button>
                        ) : (
                          <button className="btn-icon" disabled style={{ opacity: .25, cursor: 'not-allowed' }} title="غير مصرح">
                            <Lock size={13} color="#94a3b8" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2.5 no-print">
          <button className="pag-btn flex items-center gap-1" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronRight size={12} />السابق
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pag-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pag-btn flex items-center gap-1" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            التالي<ChevronLeft size={12} />
          </button>
        </div>
      )}

      {/* ═══ ADD/EDIT MODAL ═══ */}
      {modalOpen && (
        <FoodFormModal
          item={editItem}
          onSubmit={handleSubmit}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          fc={fc}
        />
      )}

      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      {deleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 70 }} onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="modal-content" style={{ maxWidth: 380 }}>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                <Trash2 size={24} color="#f87171" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1.5">تأكيد الحذف</h3>
              <p className="text-[12.5px] text-surface-400 mb-4 leading-relaxed">
                هل أنت متأكد من حذف <strong className="text-white">{deleteConfirm.item_name}</strong>؟
                <br />لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-2.5">
                <button className="flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-[12.5px] font-bold hover:bg-red-500/25 transition-colors" onClick={() => handleDelete(deleteConfirm.id)}>
                  نعم، احذف
                </button>
                <button className="flex-1 btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HIDDEN PDF RENDER TARGET ═══ */}
      <div ref={printRef} style={{ display: 'none' }}>
        <PDFRenderTarget items={filtered} fc={fc} stats={stats} />
      </div>

      <PrintFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOD FORM MODAL
   ═══════════════════════════════════════════════════════ */
function FoodFormModal({ item, onSubmit, onClose, fc }) {
  const [form, setForm] = useState(() => {
    if (item) return { ...item };
    return {
      item_name: '',
      category: CATEGORIES[1],
      quantity: '',
      unit: UNITS[0],
      cost_price: '',
      sell_price: '',
      supplier_name: '',
      expiry_date: new Date().toISOString().split('T')[0],
    };
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const totalVal = calcTotal(form.quantity, form.cost_price);
  const margin = calcMargin(form.cost_price, form.sell_price);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 60 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={16} color="#fbbf24" />
            <h3 className="text-[14px] font-bold text-white">
              {item ? 'تعديل صنف' : 'إضافة صنف جديد'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={17} color="#94a3b8" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="form-label">اسم الصنف</label>
            <input className="form-input" type="text" value={form.item_name} onChange={(e) => set('item_name', e.target.value)} required placeholder="مثال: كنافة نابلسية فاخرة" />
          </div>

          {/* Category + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">التصنيف</label>
              <select className="form-select" value={form.category} onChange={(e) => set('category', e.target.value)} required>
                {CATEGORIES.filter((c) => c !== 'الكل').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">الوحدة</label>
              <select className="form-select" value={form.unit} onChange={(e) => set('unit', e.target.value)} required>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="form-label">الكمية</label>
            <input className="form-input" type="number" min="0" step="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required placeholder="0" />
          </div>

          {/* Cost + Sell Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">سعر التكلفة</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} required placeholder="0.00" />
            </div>
            <div>
              <label className="form-label">سعر البيع</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.sell_price} onChange={(e) => set('sell_price', e.target.value)} required placeholder="0.00" />
            </div>
          </div>

          {/* Auto-calculated preview */}
          {(Number(form.cost_price) > 0 || Number(form.sell_price) > 0) && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-surface-400">إجمالي قيمة المخزون</span>
                <span className="text-primary-400 font-bold">{fc(totalVal)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-surface-400">هامش الربح</span>
                <span className={`font-bold ${margin >= 25 ? 'text-emerald-400' : margin > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-surface-400">الربح المتوقع للقطعة</span>
                <span className="text-emerald-400 font-bold">
                  {fc((Number(form.sell_price) || 0) - (Number(form.cost_price) || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Supplier */}
          <div>
            <label className="form-label">المورد</label>
            <input className="form-input" type="text" value={form.supplier_name} onChange={(e) => set('supplier_name', e.target.value)} required placeholder="مثال: شركة الكرمل للتوريدات" />
          </div>

          {/* Expiry */}
          <div>
            <label className="form-label">تاريخ الانتهاء</label>
            <input className="form-input" type="date" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} required />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary flex-1">
              {item ? 'تحديث الصنف' : 'إضافة الصنف'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PDF RENDER TARGET (Hidden, white bg, corporate style)
   ═══════════════════════════════════════════════════════ */
function PDFRenderTarget({ items, fc, stats }) {
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      direction: 'rtl',
      background: '#fff',
      color: '#1a1a1a',
      padding: '28px 36px',
      minWidth: 1060,
    }}>
      {/* Corporate Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, marginBottom: 20, borderBottom: '3px solid #0891b2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 12, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 26,
            fontWeight: 900, color: '#fff',
            background: 'linear-gradient(135deg, #0891b2, #7c3aed)',
          }}>م</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>المحاسب الذكي</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>تقرير جرد الأصناف الغذائية</div>
          </div>
        </div>
        <div style={{ textAlign: 'left', fontSize: 10, color: '#64748b' }}>
          <div>{today}</div>
          <div>رام الله — فلسطين</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'عدد الأصناف', value: items.length },
          { label: 'إجمالي القيمة', value: fc(stats.totalValue) },
          { label: 'متوسط هامش الربح', value: stats.avgMargin.toFixed(1) + '%' },
          { label: 'قريبة الانتهاء', value: stats.expiringSoon },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr>
            {['#', 'اسم الصنف', 'التصنيف', 'الكمية', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'إجمالي القيمة', 'هامش الربح %', 'المورد', 'تاريخ الانتهاء'].map((h, i) => (
              <th key={i} style={{ padding: '8px 6px', background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'right', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const total = calcTotal(item.quantity, item.cost_price);
            const margin = calcMargin(item.cost_price, item.sell_price);
            const expired = isExpired(item.expiry_date);

            return (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{item.id}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: expired ? '#dc2626' : '#0f172a' }}>
                  {item.item_name}{expired ? ' ⚠' : ''}
                </td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{item.category}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{item.quantity}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{item.unit}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{fc(item.cost_price)}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#059669' }}>{fc(item.sell_price)}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 700, color: '#0891b2' }}>{fc(total)}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 700, color: margin >= 50 ? '#059669' : margin >= 25 ? '#d97706' : '#dc2626' }}>{margin.toFixed(1)}%</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.supplier_name}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #e2e8f0', color: expired ? '#dc2626' : '#475569', fontWeight: expired ? 700 : 400 }}>{item.expiry_date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 28, paddingTop: 10, borderTop: '2px solid #0891b2', textAlign: 'center', fontSize: 8, color: '#94a3b8' }}>
        المحاسب الذكي © {new Date().getFullYear()} — جميع الحقوق محفوظة | تقرير جرد تم إنشاؤه آلياً
      </div>
    </div>
  );
}
