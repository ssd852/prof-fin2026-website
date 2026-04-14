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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export default function EntityPage({ entityKey, store, onToggle }) {
  const schema = SCHEMAS[entityKey];
  const data = store.getAll(entityKey);
  const printRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { show } = useToast();
  const { fc } = useCurrency();
  const { canAdd, canEdit, canDelete } = useAuth();
  const PP = 10;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PP));
  useEffect(() => { setPage(1); }, [search, entityKey]);
  const paged = filtered.slice((page - 1) * PP, page * PP);
  const visCols = schema.fields.filter((c) => !c.auto || c.key === 'vat_tax' || c.key === 'total_value');

  const handleSubmit = (formData) => {
    if (editItem) {
      store.update(entityKey, editItem.id, formData);
      show('تم التحديث بنجاح ✓');
    } else {
      store.add(entityKey, formData);
      show('تمت الإضافة بنجاح ✓');
    }
    setModalOpen(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    store.remove(entityKey, id);
    show('تم الحذف بنجاح ✓');
  };

  const valField = schema.fields.find((f) => f.currency && !f.auto);
  const total = valField ? data.reduce((s, i) => s + (Number(i[valField.key]) || 0), 0) : 0;

  const isOverLimit = (row) =>
    entityKey === 'customers' && (Number(row.balance) || 0) > (Number(row.credit_limit) || 0);

  // Exporters
  const exportCSV = () => {
    const headers = visCols.map(c => c.label);
    const rows = filtered.map(row => visCols.map(c => {
      let v = row[c.key];
      if (c.type === 'select' && c.source) {
        const ref = store.getById(c.source, v);
        v = ref ? ref.name : v;
      }
      return `"${String(v || '').replace(/"/g, '""')}"`;
    }));
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    show('تم تصدير CSV بنجاح ✓', 'info');
  };

  const exportExcel = () => {
    const dataAOA = [
      visCols.map(c => c.label),
      ...filtered.map(row => visCols.map(c => {
        let v = row[c.key];
        if (c.type === 'select' && c.source) v = store.getById(c.source, v)?.name || v;
        return v;
      })),
    ];
    const ws = XLSX.utils.aoa_to_sheet(dataAOA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, schema.name);
    XLSX.writeFile(wb, `${schema.name}.xlsx`);
    show('تم تصدير Excel بنجاح ✓', 'info');
  };

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
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
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
      pdf.save(`تقرير-${schema.name.replace(/\s+/g, '-')}.pdf`);
      show('تم تصدير PDF بنجاح ✓', 'info');
    } catch (e) {
      show('خطأ في تصدير PDF', 'error');
    }
    setPdfLoading(false);
  };

  const handlePrint = () => window.print();

  return (
    <div className="entity-page pb-10">
      <Header onToggle={onToggle} />

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
             {schema.name}
          </h2>
          <p className="text-xs text-surface-400 mt-1">إدارة بيانات {schema.name} بطريقة احترافية — {data.length} سجل متاح</p>
        </div>
        <div className="flex items-center gap-2">
          {canAdd && (
            <button className="btn-primary flex items-center gap-2" onClick={() => { setEditItem(null); setModalOpen(true); }}>
              <Plus size={16} color="white" />
              <span>إضافة جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 no-print">
        <div className="glass-table-container rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-sm font-semibold text-slate-400 mb-1">إجمالي السجلات</p>
          <p className="text-2xl font-bold text-white">{data.length}</p>
        </div>
        {valField && (
          <div className="glass-table-container rounded-2xl p-4 flex flex-col justify-center border-emerald-500/10">
            <p className="text-sm font-semibold text-slate-400 mb-1">إجمالي القطاع ({valField.label})</p>
            <p className="text-2xl font-bold text-emerald-400">{fc(total)}</p>
          </div>
        )}
        <div className="glass-table-container rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-sm font-semibold text-slate-400 mb-1">آخر تحديث</p>
          <p className="text-lg font-bold text-slate-300">{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 no-print">
        <div className="relative w-full md:w-96">
          <Search size={16} color="#64748b" className="absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            className="form-input !py-2.5 !ps-4 !pe-10 shadow-sm"
            placeholder={`بحث في ${schema.name}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="export-btn export-pdf flex-1 md:flex-none justify-center" onClick={exportPDF} disabled={pdfLoading}>
            {pdfLoading ? <Loader size={12} className="animate-spin"/> : <FileText size={14} />} PDF
          </button>
          <button className="export-btn export-excel flex-1 md:flex-none justify-center" onClick={exportExcel}>
            <Table size={14} /> Excel
          </button>
          <button className="export-btn export-csv flex-1 md:flex-none justify-center" onClick={exportCSV}>
            <FileSpreadsheet size={14} /> CSV
          </button>
          <button className="print-btn flex-1 md:flex-none justify-center" onClick={handlePrint}>
            <Printer size={14} /> طباعة
          </button>
        </div>
      </div>

      {/* Luxury Table */}
      <div className="glass-table-container w-full overflow-x-auto print:border-none print:shadow-none">
        <table className="data-table min-w-full">
          <thead>
            <tr>
              {visCols.map((col) => {
                let colIcon = <FileDigit size={12}/>;
                if(col.key === 'id') colIcon = <Hash size={12}/>;
                if(col.key.includes('name') || col.key === 'customer_id' || col.key === 'supplier_id') colIcon = <User size={12}/>;
                if(col.currency) colIcon = <Wallet size={12}/>;
                if(col.type === 'date') colIcon = <Calendar size={12}/>;
                if(col.key.includes('phone')) colIcon = <Phone size={12}/>;
                if(col.key.includes('role')) colIcon = <Briefcase size={12}/>;

                return (
                  <th key={col.key} className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5 opacity-80">
                      {colIcon}
                      <span>{col.label}</span>
                    </div>
                  </th>
                );
              })}
              <th className="w-20 no-print text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={visCols.length + 1} className="text-center py-12">
                  <Inbox size={40} className="mx-auto mb-3 text-slate-500 opacity-30" />
                  <p className="text-slate-400 font-medium">لا توجد سجلات لعرضها</p>
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className={isOverLimit(row) ? 'bg-red-500/5 hover:bg-red-500/10' : ''}>
                  {visCols.map((col) => {
                    let val = row[col.key];

                    // Formatting Overrides
                    let cellContent = val;
                    if (col.key === 'id') {
                      cellContent = <span className="text-slate-400 font-mono">#{val}</span>;
                    } else if (col.key.includes('name')) {
                      cellContent = (
                        <div className="flex items-center gap-2.5">
                          <div className="avatar-round">{val?.charAt(0) || '-'}</div>
                          <div>
                            <span className="font-bold text-slate-200">{val}</span>
                            {isOverLimit(row) && col.key === 'name' && (
                              <span className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                                <AlertTriangle size={10} /> تجاوز الحد
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    } else if (col.currency || col.key === 'balance' || col.key === 'total_value') {
                      cellContent = <span className="font-mono font-bold text-slate-200 text-end block">{fc(val)}</span>;
                    } else if (col.type === 'select' && col.source) {
                      const ref = store.getById(col.source, val);
                      cellContent = ref ? <span className="text-slate-300 font-medium">{ref.name}</span> : <span className="text-slate-500">-</span>;
                    } else if (col.key === 'status') {
                      const badgeClass = val === 'مدفوع' ? 'badge-active' : val === 'مرتجع' ? 'badge-error' : 'badge-warning';
                      cellContent = <span className={`badge ${badgeClass}`}>{val}</span>;
                    } else if (col.key === 'entry_type') {
                      const badgeClass = val === 'دائن' ? 'badge-active' : val === 'مدين' ? 'badge-error' : 'badge-warning';
                      cellContent = <span className={`badge ${badgeClass}`}>{val}</span>;
                    } else if (col.key === 'qr_code_hash' && val) {
                      cellContent = <div className="qr-icon shadow-lg shadow-violet-500/20" title={val}><QrCode size={14} color="#a78bfa" /></div>;
                    } else if (col.type === 'date') {
                      cellContent = <span className="text-slate-400 font-medium whitespace-nowrap">{val}</span>;
                    }

                    return <td key={col.key}>{cellContent}</td>;
                  })}
                  <td className="no-print">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <button className="btn-icon bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" onClick={() => { setEditItem(row); setModalOpen(true); }}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete ? (
                        <button className="btn-icon bg-red-500/10 text-red-400 hover:bg-red-500/20" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button className="btn-icon bg-slate-500/10 text-slate-500 cursor-not-allowed">
                          <Lock size={14} />
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

      {/* Ultimate Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 no-print gap-3">
          <p className="text-xs text-slate-400 font-medium">
            عرض {Math.min((page - 1) * PP + 1, filtered.length)} - {Math.min(page * PP, filtered.length)} من أصل {filtered.length} سجل
          </p>
          <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
            <button className="p-1 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white transition-colors" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronRight size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
              <div key={p} className="flex items-center">
                {idx > 0 && arr[idx-1] !== p - 1 && <span className="px-1 text-slate-500">...</span>}
                <button
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              </div>
            ))}
            <button className="p-1 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white transition-colors" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? `تعديل سجل - ${schema.name}` : `إضافة جديد - ${schema.name}`}
        wide={entityKey === 'purchase_invoices' || entityKey === 'sales_invoices'}
      >
        <DynamicForm
          schema={schema}
          entityKey={entityKey}
          initialData={editItem}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditItem(null); }}
          store={store}
        />
      </Modal>

      {/* ═══ HIDDEN PDF RENDER TARGET ═══ */}
      <div ref={printRef} style={{ display: 'none' }}>
        <PDFRenderTarget schema={schema} items={filtered} visCols={visCols} store={store} fc={fc} />
      </div>

    </div>
  );
}

// ── Corporate PDF Template ──
function PDFRenderTarget({ schema, items, visCols, store, fc }) {
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const uniqueId = `DOC-${new Date().getTime().toString().slice(-6)}`;

  return (
    <div style={{
      fontFamily: "'Tajawal', sans-serif", direction: 'rtl',
      background: '#fff', color: '#1a1a1a', padding: '30px 40px', minWidth: 1100
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: 20, marginBottom: 25 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 60, height: 60, background: '#1e293b', color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900 }}>م</div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>المحاسب الذكي</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>تقرير رسمي — {schema.name}</div>
          </div>
        </div>
        <div style={{ textAlign: 'left', fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>{today}</div>
          <div>رقم التقرير: <strong>{uniqueId}</strong></div>
          <div style={{ color: '#0f172a', fontWeight: 'bold' }}>معتمد بواسطة النظام</div>
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
