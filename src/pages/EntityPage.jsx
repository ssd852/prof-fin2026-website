import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, Lock, AlertTriangle, Inbox, QrCode, FileText, Table, FileSpreadsheet, User, Hash, Wallet, MapPin, Phone, Briefcase, FileDigit, Calendar, ChevronRight, ChevronLeft, Printer, Loader } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { PrintFooter } from '../components/PrintHeader';
import { SCHEMAS } from '../data/schemas';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export default function EntityPage({ entityKey, store, onToggle }) {
  const schema = SCHEMAS[entityKey];
  const printRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { show } = useToast();
  const { fc } = useCurrency();
  const { can } = useAuth();
  const PAGE_SIZE = 15;

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: fetchedData, error } = await supabase
        .from(entityKey)
        .select('*');

      if (error) throw error;
      setData(fetchedData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      show(`حدث خطأ أثناء جلب البيانات: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityKey]);

  useEffect(() => {
    setPage(1);
  }, [search, entityKey]);

  const handleSubmit = async (formData) => {
    try {
      if (editItem) {
        const { error } = await supabase
          .from(entityKey)
          .update(formData)
          .eq('id', editItem.id);

        if (error) throw error;
        show('تم التحديث بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from(entityKey)
          .insert([formData]);

        if (error) throw error;
        show('تمت الإضافة بنجاح', 'success');
      }

      setModalOpen(false);
      setEditItem(null);
      fetchData(); // جلب البيانات من جديد بعد الحفظ
    } catch (err) {
      console.error("Error saving data:", err);
      show(`حدث خطأ أثناء الحفظ: ${err.message}`, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const { error } = await supabase
        .from(entityKey)
        .delete()
        .eq('id', id);

      if (error) throw error;
      show('تم الحذف بنجاح', 'success');
      fetchData(); // تحديث الجدول
    } catch (err) {
      console.error("Error deleting data:", err);
      show(`حدث خطأ أثناء الحذف: ${err.message}`, "error");
    }
  };

  // --- Functions for export and display (kept exactly as they were) ---
  const visCols = schema.columns.filter(c => !c.hideInTable);
  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(r => visCols.some(c => String(r[c.key] || '').toLowerCase().includes(s)));
  }, [data, search, visCols]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportPDF = async () => {
    if (!printRef.current) return;
    setPdfLoading(true);
    try {
      printRef.current.style.display = 'block';
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false });
      printRef.current.style.display = 'none';
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
      pdf.save(`${schema.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      show('تم تصدير PDF بنجاح', 'success');
    } catch (err) {
      printRef.current.style.display = 'none';
      show('فشل التصدير', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(row => {
      let obj = {};
      visCols.forEach(c => {
        let v = row[c.key];
        if (c.type === 'select' && c.source) v = store.getById(c.source, v)?.name || v;
        obj[c.label] = v;
      });
      return obj;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, schema.name);
    XLSX.writeFile(wb, `${schema.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    show('تم تصدير Excel بنجاح', 'success');
  };

  if (!can(`view_${entityKey}`)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3">عذراً، لا تملك صلاحية</h2>
        <p className="text-slate-500 max-w-md">حسابك الحالي لا يملك الصلاحيات الكافية للوصول إلى هذه الشاشة.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <Header title={schema.name} icon={schema.icon} onToggle={onToggle} />

      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Action Bar */}
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
              <input
                type="text"
                placeholder="ابحث في السجلات..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-slate-700 font-medium placeholder:font-normal"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              <button onClick={exportPDF} disabled={pdfLoading} className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold disabled:opacity-50">
                {pdfLoading ? <Loader size={18} className="animate-spin" /> : <FileText size={18} className="text-red-500" />}
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={exportExcel} className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold">
                <FileSpreadsheet size={18} className="text-green-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              {can(`add_${entityKey}`) && (
                <button
                  onClick={() => { setEditItem(null); setModalOpen(true); }}
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-md shadow-brand-500/30 font-bold"
                >
                  <Plus size={20} />
                  <span>إضافة جديد</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    {visCols.map(c => (
                      <th key={c.key} className="p-4 font-black text-slate-700 whitespace-nowrap bg-slate-50/50 backdrop-blur-xl">
                        {c.label}
                      </th>
                    ))}
                    <th className="p-4 font-black text-slate-700 text-left bg-slate-50/50 backdrop-blur-xl w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={visCols.length + 1} className="p-12 text-center text-slate-500">
                        <Loader className="animate-spin mx-auto mb-4" size={32} />
                        <p>جاري جلب البيانات...</p>
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={visCols.length + 1} className="p-16 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                          <Inbox size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد بيانات</h3>
                        <p className="text-slate-500">لم يتم العثور على أي سجلات مطابقة للبحث أو الجدول فارغ.</p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                        {visCols.map(c => {
                          let v = row[c.key];
                          if (c.type === 'select' && c.source) {
                            v = store.getById(c.source, v)?.name || <span className="text-slate-400 italic">غير محدد</span>;
                          }
                          if (c.currency) v = fc(v);
                          if (c.type === 'date') v = new Date(v).toLocaleDateString('ar-SA');

                          return (
                            <td key={c.key} className={`p-4 align-middle whitespace-nowrap ${c.key.includes('name') ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
                              {v}
                            </td>
                          );
                        })}
                        <td className="p-4 align-middle text-left">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {can(`edit_${entityKey}`) && (
                              <button onClick={() => { setEditItem(row); setModalOpen(true); }} className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:scale-110 transition-all">
                                <Pencil size={16} />
                              </button>
                            )}
                            {can(`delete_${entityKey}`) && (
                              <button onClick={() => handleDelete(row.id)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="bg-slate-50/80 border-t border-slate-200 p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">
                  صفحة <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">{page}</span> من {totalPages}
                </span>
                <div className="flex gap-2 relative z-10">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all active:scale-95">
                    <ChevronRight size={20} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all active:scale-95">
                    <ChevronLeft size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal title={editItem ? `تعديل ${schema.name}` : `إضافة ${schema.name}`} onClose={() => { setModalOpen(false); setEditItem(null); }}>
          <DynamicForm schema={schema.columns} initialData={editItem} onSubmit={handleSubmit} store={store} />
        </Modal>
      )}

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        <PDFRenderTarget items={filtered} schema={schema} visCols={visCols} printRef={printRef} store={store} fc={fc} />
      </div>
    </div>
  );
}

// --- Component to render the PDF properly ---
function PDFRenderTarget({ items, schema, visCols, printRef, store, fc }) {
  return (
    <div ref={printRef} style={{ width: '800px', padding: '40px', background: '#fff', color: '#0f172a', fontFamily: 'sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0, fontWeight: 900, color: '#0f172a' }}>تقرير {schema.name}</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748b' }}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'inline-block', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <QrCode size={48} color="#0f172a" />
          </div>
          <div style={{ marginTop: '8px', fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>معتمد بواسطة النظام</div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            {visCols.map((c, i) => (
              <th key={i} style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#334155', borderBottom: '2px solid #cbd5e1' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
              {visCols.map((c, i) => {
                let v = row[c.key];
                if (c.type === 'select' && c.source) v = store.getById(c.source, v)?.name || v;
                if (c.currency) v = fc(v);
                return (
                  <td key={i} style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: c.key.includes('name') ? 700 : 500 }}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 30, paddingTop: 15, borderTop: '2px solid #1e293b', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
        المحاسب الذكي © جميع الحقوق محفوظة | تم إنشاء هذا التقرير آلياً بواسطة المنصة
      </div>
    </div>
  );
}