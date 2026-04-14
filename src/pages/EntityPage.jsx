import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Lock, AlertTriangle, Inbox, QrCode, FileText, Table, FileSpreadsheet } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import PrintButton from '../components/PrintButton';
import PrintHeader, { PrintFooter } from '../components/PrintHeader';
import { SCHEMAS } from '../data/schemas';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { exportPDF, exportExcel, exportCSV } from '../utils/exportUtils';

export default function EntityPage({ entityKey, store, onToggle }) {
  const schema = SCHEMAS[entityKey];
  const data = store.getAll(entityKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { show } = useToast();
  const { fc, cur } = useCurrency();
  const { canAdd, canEdit, canDelete } = useAuth();
  const PP = 8;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PP));
  useEffect(() => { setPage(1); }, [search]);
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

  const formatValue = (col, val) => {
    if (col.currency) return fc(val);
    if (col.type === 'select' && col.source) {
      const record = store.getById(col.source, val);
      return record ? record.name : val;
    }
    if (col.key === 'status') {
      const statusClass = val === 'مدفوع' ? 'badge-paid' : val === 'مرتجع' ? 'badge-bounced' : 'badge-pending';
      return <span className={`badge ${statusClass}`}>{val}</span>;
    }
    if (col.key === 'entry_type') {
      const entryClass = val === 'دائن' ? 'badge-paid' : val === 'مدين' ? 'badge-bounced' : 'badge-pending';
      return <span className={`badge ${entryClass}`}>{val}</span>;
    }
    if (col.key === 'qr_code_hash' && val) {
      return (
        <div className="qr-icon" title={val}>
          <QrCode size={12} color="#a78bfa" />
        </div>
      );
    }
    return val;
  };

  return (
    <div>
      <Header onToggle={onToggle} />
      <PrintHeader />

      {/* Title & Add Button */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-white">{schema.name}</h2>
          <p className="text-[11px] text-surface-400 mt-0.5">إدارة بيانات {schema.name} — {data.length} سجل</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          {canAdd && (
            <button className="btn-primary flex items-center gap-1.5" onClick={() => { setEditItem(null); setModalOpen(true); }}>
              <Plus size={14} color="white" />
              <span>إضافة جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
        <div className="glass-card rounded-lg p-2.5">
          <p className="text-[10px] text-surface-500 mb-0.5">عدد السجلات</p>
          <p className="text-[15px] font-bold text-white">{data.length}</p>
        </div>
        {valField && (
          <div className="glass-card rounded-lg p-2.5">
            <p className="text-[10px] text-surface-500 mb-0.5">إجمالي {valField.label}</p>
            <p className="text-[15px] font-bold text-primary-400">{fc(total)}</p>
          </div>
        )}
        <div className="glass-card rounded-lg p-2.5">
          <p className="text-[10px] text-surface-500 mb-0.5">آخر تحديث</p>
          <p className="text-[15px] font-bold text-surface-300">{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      {/* Search & Export */}
      <div className="flex items-center gap-2 mb-2.5 no-print">
        <div className="relative flex-1">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search size={13} color="#475569" />
          </div>
          <input className="form-input" style={{ paddingRight: '34px', fontSize: '12.5px' }} placeholder={`البحث في ${schema.name}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="export-btn export-pdf" onClick={() => exportPDF(schema.name, schema.fields, data, cur)}>
          <FileText size={12} color="#f87171" />PDF
        </button>
        <button className="export-btn export-excel" onClick={() => exportExcel(schema.name, schema.fields, data)}>
          <Table size={12} color="#34d399" />Excel
        </button>
        <button className="export-btn export-csv" onClick={() => exportCSV(schema.name, schema.fields, data)}>
          <FileSpreadsheet size={12} color="#22d3ee" />CSV
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-auto rounded-2xl glass" style={{ maxHeight: 'calc(100vh - 380px)' }}>
        <table className="data-table">
          <thead>
            <tr>
              {visCols.map((col) => <th key={col.key}>{col.label}</th>)}
              <th style={{ width: 80 }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={visCols.length + 1} className="text-center py-8 text-surface-500">
                  <Inbox size={30} className="mx-auto mb-1.5 opacity-20" />
                  <p className="text-[12px]">لا توجد بيانات</p>
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className={isOverLimit(row) ? 'row-warning' : ''}>
                  {visCols.map((col) => (
                    <td key={col.key}>
                      {col.key === 'name' && isOverLimit(row) ? (
                        <span className="flex items-center gap-1">
                          {row.name}
                          <AlertTriangle size={12} color="#f87171" />
                        </span>
                      ) : formatValue(col, row[col.key])}
                    </td>
                  ))}
                  <td>
                    <div className="flex gap-0.5">
                      {canEdit && (
                        <button className="btn-icon" onClick={() => { setEditItem(row); setModalOpen(true); }}>
                          <Pencil size={13} color="#22d3ee" />
                        </button>
                      )}
                      {canDelete ? (
                        <button className="btn-icon" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={13} color="#f87171" />
                        </button>
                      ) : (
                        <button className="btn-icon" disabled style={{ opacity: .25, cursor: 'not-allowed' }}>
                          <Lock size={13} color="#94a3b8" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2.5 no-print">
          <button className="pag-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>السابق</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pag-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pag-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>التالي</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? `تعديل في ${schema.name}` : `إضافة إلى ${schema.name}`}
        wide={entityKey === 'purchase_invoices'}
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

      <PrintFooter />
    </div>
  );
}
