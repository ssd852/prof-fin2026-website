import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Search, Pencil, Trash2, Lock, Printer, FileText, Table,
  FileSpreadsheet, UtensilsCrossed, AlertTriangle, Inbox, X, Loader,
  Package, TrendingUp, Clock, DollarSign, Filter, ChevronLeft, ChevronRight, Hash, User, MapPin
} from 'lucide-react';
import Header from '../components/Header';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const CATEGORIES = [
  'الكل', 'حلويات', 'وجبات رئيسية', 'مشروبات', 'مقبلات',
  'زيوت ومعلبات', 'خضار وفواكه', 'لحوم ودواجن', 'منتجات ألبان',
  'بهارات وتوابل', 'حبوب وبقوليات',
];
const UNITS = ['كيلو', 'حبة', 'لتر', 'علبة', 'كرتونة', 'كيس', 'صندوق'];

const calcTotal = (qty, cost) => (Number(qty) || 0) * (Number(cost) || 0);
const calcMargin = (cost, sell) => {
  const c = Number(cost) || 0;
  const s = Number(sell) || 0;
  if (c <= 0) return 0;
  return ((s - c) / c) * 100;
};
const daysUntilExpiry = (dateStr) => {
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(dateStr); exp.setHours(0,0,0,0);
  return Math.ceil((exp - now) / 86400000);
};
const isExpiringSoon = (dateStr) => {
  const days = daysUntilExpiry(dateStr);
  return days >= 0 && days <= 30;
};
const isExpired = (dateStr) => daysUntilExpiry(dateStr) < 0;

export default function FoodInventoryPage({ store, onToggle }) {
  const items = store.getAll('food_inventory');
  const { fc } = useCurrency();
  const { canAdd, canEdit, canDelete } = useAuth();
  const { show } = useToast();
  const printRef = useRef(null);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const PP = 10;

  const filtered = useMemo(() => {
    let list = [...items];
    if (catFilter !== 'الكل') list = list.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.item_name?.toLowerCase().includes(q) || i.supplier_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, catFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PP));
  useEffect(() => { setPage(1); }, [search, catFilter]);
  const paged = filtered.slice((page - 1) * PP, page * PP);

  const stats = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + calcTotal(i.quantity, i.cost_price), 0);
    const avgMargin = items.length > 0 ? items.reduce((s, i) => s + calcMargin(i.cost_price, i.sell_price), 0) / items.length : 0;
    const expiringSoon = items.filter((i) => isExpiringSoon(i.expiry_date)).length;
    const expired = items.filter((i) => isExpired(i.expiry_date)).length;
    return { totalValue, avgMargin, expiringSoon, expired };
  }, [items]);

  const handleSubmit = (formData) => {
    const processed = { ...formData, quantity: Number(formData.quantity)||0, cost_price: Number(formData.cost_price)||0, sell_price: Number(formData.sell_price)||0 };
    if (editItem) { store.update('food_inventory', editItem.id, processed); show('تم تحديث الصنف بنجاح ✓'); }
    else { store.add('food_inventory', processed); show('تمت إضافة الصنف بنجاح ✓'); }
    setModalOpen(false); setEditItem(null);
  };

  const handleDelete = (id) => {
    store.remove('food_inventory', id); show('تم حذف الصنف بنجاح ✓'); setDeleteConfirm(null);
  };

  // Exporters
  const exportCSV = () => {
    const headers = ['#', 'اسم الصنف', 'التصنيف', 'الكمية', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'إجمالي القيمة', 'هامش الربح %', 'المورد', 'تاريخ الانتهاء'];
    const rows = filtered.map((i) => [i.id, i.item_name, i.category, i.quantity, i.unit, i.cost_price, i.sell_price, calcTotal(i.quantity, i.cost_price), calcMargin(i.cost_price, i.sell_price).toFixed(1)+'%', i.supplier_name, i.expiry_date]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'جرد-الأصناف-الغذائية.csv'; a.click(); URL.revokeObjectURL(url);
    show('تم تصدير CSV بنجاح ✓', 'info');
  };

  const exportExcel = () => {
    const data = [['#', 'اسم الصنف', 'التصنيف', 'الكمية', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'إجمالي القيمة', 'هامش الربح %', 'المورد', 'تاريخ الانتهاء'], ...filtered.map((i) => [i.id, i.item_name, i.category, i.quantity, i.unit, i.cost_price, i.sell_price, calcTotal(i.quantity, i.cost_price), parseFloat(calcMargin(i.cost_price, i.sell_price).toFixed(1)), i.supplier_name, i.expiry_date])];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'جرد الأصناف'); XLSX.writeFile(wb, 'جرد-الأصناف.xlsx');
    show('تم تصدير Excel بنجاح ✓', 'info');
  };

  const exportPDF = async () => {
    setPdfLoading(true);
    try {
      const el = printRef.current; if (!el) return;
      el.style.display = 'block'; el.style.position = 'absolute'; el.style.top = '0'; el.style.left = '-9999px'; el.style.width = '1100px'; el.style.zIndex = '-1';
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      el.style.display = 'none';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth(); const pdfH = (canvas.height * pdfW) / canvas.width;
      if (pdfH <= pdf.internal.pageSize.getHeight()) pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      else { let yOffset = 0; const pageH = pdf.internal.pageSize.getHeight(); while (yOffset < pdfH) { if (yOffset > 0) pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH); yOffset += pageH; } }
      pdf.save('تقرير-الجرد-الرسمي.pdf'); show('تم تصدير PDF بنجاح ✓', 'info');
    } catch (err) { show('خطأ في التصدير', 'error'); }
    setPdfLoading(false);
  };

  return (
    <div className="pb-10">
      <Header onToggle={onToggle} />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"> جرد الأصناف الغذائية </h2>
          <p className="text-xs text-slate-400 mt-1">نظام تتبع وإدارة المخزون — {items.length} صنف مسجل</p>
        </div>
        {canAdd && (
          <button className="btn-primary flex items-center gap-2" onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus size={16} /> <span>إضافة صنف</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 no-print">
        <div className="glass-table-container p-4 flex flex-col justify-center border-l-4 border-l-cyan-500">
          <p className="text-xs text-slate-400 mb-1">عدد الأصناف الكلي</p>
          <p className="text-xl font-bold text-white">{items.length}</p>
        </div>
        <div className="glass-table-container p-4 flex flex-col justify-center border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400 mb-1">إجمالي قيمة التكلفة</p>
          <p className="text-xl font-bold text-emerald-400">{fc(stats.totalValue)}</p>
        </div>
        <div className="glass-table-container p-4 flex flex-col justify-center border-l-4 border-l-violet-500">
          <p className="text-xs text-slate-400 mb-1">متوسط هامش الربح</p>
          <p className="text-xl font-bold text-violet-400">{stats.avgMargin.toFixed(1)}%</p>
        </div>
        <div className="glass-table-container p-4 flex flex-col justify-center border-l-4 border-l-amber-500 relative overflow-hidden">
          <p className="text-xs text-slate-400 mb-1">أصناف حرجة (صلاحية)</p>
          <p className="text-xl font-bold text-amber-400">{stats.expiringSoon} <span className="text-xs text-red-500 mr-1 opacity-80">({stats.expired} منتهية)</span></p>
          {(stats.expired>0 || stats.expiringSoon>0) && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-red-500/20 to-transparent blur-xl"></div>}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-4 no-print">
        <div className="relative w-full md:w-80">
          <Search size={16} color="#64748b" className="absolute right-3 top-1/2 -translate-y-1/2" />
          <input className="form-input !py-2.5 !ps-4 !pe-10" placeholder="ابحث عن صنف أو اسم المورد..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select w-full md:w-56 !py-2.5" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="export-btn export-pdf flex-1 md:flex-none justify-center" onClick={exportPDF} disabled={pdfLoading}>{pdfLoading ? <Loader size={12} className="animate-spin"/> : <FileText size={14}/>} PDF</button>
          <button className="export-btn export-excel flex-1 md:flex-none justify-center" onClick={exportExcel}><Table size={14}/> Excel</button>
          <button className="export-btn export-csv flex-1 md:flex-none justify-center" onClick={exportCSV}><FileSpreadsheet size={14}/> CSV</button>
          <button className="print-btn flex-1 md:flex-none justify-center" onClick={() => window.print()}><Printer size={14}/> طباعة</button>
        </div>
      </div>

      {/* Luxury Table */}
      <div className="glass-table-container overflow-x-auto w-full">
        <table className="data-table min-w-full">
          <thead>
            <tr>
              <th className="w-12"><Hash size={13} className="inline opacity-50 mr-1"/>#</th>
              <th>الصنف</th>
              <th>التصنيف</th>
              <th>المخزون</th>
              <th>سعر الوحدة</th>
              <th>إجمالي القيمة</th>
              <th>هامش الربح</th>
              <th>المورد</th>
              <th>تاريخ الصلاحية</th>
              <th className="no-print text-center w-20">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-slate-500 font-medium">لا توجد أصناف مطابقة</td></tr>
            ) : (
              paged.map((item) => {
                const total = calcTotal(item.quantity, item.cost_price);
                const margin = calcMargin(item.cost_price, item.sell_price);
                const expired = isExpired(item.expiry_date);
                const expSoon = isExpiringSoon(item.expiry_date);
                const firstDigit = item.item_name.charAt(0);

                return (
                  <tr key={item.id} className={expired ? 'bg-red-500/5 hover:bg-red-500/10' : expSoon ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''}>
                    <td className="font-mono text-slate-400">#{item.id}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar-round shrink-0">{firstDigit}</div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{item.item_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-80">{item.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-active !bg-slate-700/50 !text-slate-300 !border-slate-600/50 shadow-none">{item.category}</span></td>
                    <td><div className="font-mono text-slate-300 font-semibold">{item.quantity} {item.unit}</div></td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-emerald-400 text-xs font-bold" title="سعر البيع">ب: {fc(item.sell_price)}</span>
                        <span className="font-mono text-slate-400 text-[10px]" title="سعر التكلفة">ت: {fc(item.cost_price)}</span>
                      </div>
                    </td>
                    <td className="font-mono text-cyan-400 font-bold block mt-1">{fc(total)}</td>
                    <td><span className={`badge ${margin >= 40 ? 'badge-active' : margin >= 20 ? 'badge-warning' : 'badge-error'}`}>{margin.toFixed(1)}%</span></td>
                    <td className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{item.supplier_name}</td>
                    <td>
                      <span className={`font-medium text-xs whitespace-nowrap ${expired ? 'text-red-400 font-bold' : expSoon ? 'text-amber-400' : 'text-slate-400'}`}>
                        {item.expiry_date}
                        {expired && <span className="block text-[9px] text-red-500 uppercase mt-0.5">منتهي الصلاحية</span>}
                      </span>
                    </td>
                    <td className="no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && <button className="btn-icon bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" onClick={() => { setEditItem(item); setModalOpen(true); }}><Pencil size={14}/></button>}
                        {canDelete ? <button className="btn-icon bg-red-500/10 text-red-400 hover:bg-red-500/20" onClick={() => setDeleteConfirm(item)}><Trash2 size={14}/></button>
                                  : <button className="btn-icon bg-slate-500/10 text-slate-500 cursor-not-allowed"><Lock size={14}/></button>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 no-print gap-3">
          <p className="text-xs text-slate-400 font-medium">عرض {Math.min((page - 1) * PP + 1, filtered.length)} - {Math.min(page * PP, filtered.length)} من {filtered.length}</p>
          <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
            <button className="p-1 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronRight size={16}/></button>
            {Array.from({length: totalPages}, (_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,idx,arr) => (
              <div key={p} className="flex flex-row items-center">
                {idx>0 && arr[idx-1]!==p-1 && <span className="px-1 text-slate-500">...</span>}
                <button className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${page===p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={()=>setPage(p)}>{p}</button>
              </div>
            ))}
            <button className="p-1 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronLeft size={16}/></button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && <FoodFormModal item={editItem} onSubmit={handleSubmit} onClose={() => { setModalOpen(false); setEditItem(null); }} fc={fc} />}
      {deleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 70 }} onClick={(e) => { if(e.target===e.currentTarget) setDeleteConfirm(null); }}>
          <div className="modal-content text-center" style={{ maxWidth: 350 }}>
            <Trash2 size={32} color="#f87171" className="mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-slate-400 mb-5">موافق على حذف <strong className="text-white">{deleteConfirm.item_name}</strong> بشكل نهائي؟</p>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/20" onClick={() => handleDelete(deleteConfirm.id)}>تأكيد الحذف</button>
              <button className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition" onClick={() => setDeleteConfirm(null)}>تراجع</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Export */}
      <div ref={printRef} style={{ display: 'none' }}><PDFRenderTarget items={filtered} fc={fc} stats={stats} /></div>
    </div>
  );
}

function FoodFormModal({ item, onSubmit, onClose, fc }) {
  const [form, setForm] = useState(item ? { ...item } : { item_name: '', category: CATEGORIES[1], quantity: '', unit: UNITS[0], cost_price: '', sell_price: '', supplier_name: '', expiry_date: new Date().toISOString().split('T')[0] });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const totalVal = calcTotal(form.quantity, form.cost_price);
  const margin = calcMargin(form.cost_price, form.sell_price);

  return (
    <div className="modal-overlay" onClick={(e) => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><UtensilsCrossed size={18} className="text-cyan-400" /> {item ? 'تعديل الصنف' : 'تسجيل صنف جديد'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div>
            <label className="form-label">اسم الصنف</label>
            <input className="form-input" required value={form.item_name} onChange={e => set('item_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">القسم</label><select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.filter(c=>c!=='الكل').map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="form-label">الوحدة</label><select className="form-select" value={form.unit} onChange={e => set('unit', e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div><label className="form-label">الكمية بالمخزن</label><input type="number" required min="0" className="form-input" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">سعر الشراء (التكلفة)</label><input type="number" required min="0" step="0.01" className="form-input" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} /></div>
            <div><label className="form-label">سعر البيع للجمهور</label><input type="number" required min="0" step="0.01" className="form-input" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} /></div>
          </div>
          {(Number(form.cost_price)>0 || Number(form.sell_price)>0) && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 flex items-center justify-around text-xs">
              <div className="text-center">الربح <span className="block font-bold text-emerald-400 mt-1">{margin.toFixed(1)}%</span></div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div className="text-center">إجمالي التكلفة <span className="block font-bold text-cyan-400 mt-1">{fc(totalVal)}</span></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">حساب المورد</label><input className="form-input" required value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} /></div>
            <div><label className="form-label">تاريخ الصلاحية</label><input type="date" required className="form-input" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20">{item ? 'حفظ التعديلات' : 'اعتماد الصنف وإضافته'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PDFRenderTarget({ items, fc, stats }) {
  const date = new Date().toLocaleDateString('ar-SA');
  return (
    <div style={{ fontFamily: "'Tajawal', sans-serif", direction: 'rtl', padding: '30px', background: '#fff', color: '#1a1a1a', minWidth: 1000 }}>
      <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: 15, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10 }}><div style={{ width: 50, height: 50, background: '#1e293b', color: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>م</div><div><h1 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>المحاسب الذكي</h1><p style={{ margin: 0, color: '#64748b' }}>تقرير رسمي — جرد الأصناف الغذائية</p></div></div>
        <div style={{ textAlign: 'left', fontSize: 12, color: '#64748b' }}><p style={{ margin: 0 }}>تاريخ التقرير: {date}</p><strong style={{ color: '#0f172a' }}>موثق آليًا</strong></div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
        <thead><tr style={{ background: '#f1f5f9' }}>{['الصنف', 'التصنيف', 'الكمية', 'التكلفة', 'المورد', 'انتهاء الصلاحية'].map(h => <th key={h} style={{ padding: 10, textAlign: 'right', borderBottom: '2px solid #cbd5e1' }}>{h}</th>)}</tr></thead>
        <tbody>{items.map((i, idx) => <tr key={idx} style={{ background: idx%2===0?'#fff':'#f8fafc' }}><td style={{ padding:10, borderBottom:'1px solid #e2e8f0', fontWeight: 'bold' }}>{i.item_name}</td><td style={{ padding:10, borderBottom:'1px solid #e2e8f0' }}>{i.category}</td><td style={{ padding:10, borderBottom:'1px solid #e2e8f0' }}>{i.quantity} {i.unit}</td><td style={{ padding:10, borderBottom:'1px solid #e2e8f0' }}>{fc(i.cost_price)}</td><td style={{ padding:10, borderBottom:'1px solid #e2e8f0' }}>{i.supplier_name}</td><td style={{ padding:10, borderBottom:'1px solid #e2e8f0' }}>{i.expiry_date}</td></tr>)}</tbody>
      </table>
      <div style={{ padding: 15, background: '#f8fafc', borderRadius: 8, display: 'flex', gap: 20, fontWeight: 'bold', fontSize: 14 }}><div>إجمالي التكلفة: <span style={{ color: '#059669' }}>{fc(stats.totalValue)}</span></div><div>إجمالي الأصناف: <span style={{ color: '#0284c7' }}>{items.length}</span></div></div>
      <p style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 30 }}>جميع الحقوق محفوظة © المحاسب الذكي 2026</p>
    </div>
  );
}
