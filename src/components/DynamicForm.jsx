import { useState } from 'react';
import { VAT_RATE } from '../data/schemas';
import OCRZone from './OCRZone';

export default function DynamicForm({ schema, entityKey, initialData, onSubmit, onCancel, store }) {
  const isInvoice = entityKey === 'sales_invoices' || entityKey === 'purchase_invoices';
  const fields = schema.fields.filter((f) => !f.auto);

  const [formData, setFormData] = useState(() => {
    if (initialData) return { ...initialData };
    const d = {};
    fields.forEach((f) => {
      if (f.type === 'date') d[f.key] = new Date().toISOString().split('T')[0];
      else if (f.type === 'number') d[f.key] = '';
      else if (f.type === 'select' && f.options) d[f.key] = f.options[0];
      else if (f.type === 'select' && f.source) {
        const items = store.getAll(f.source);
        d[f.key] = items.length > 0 ? items[0].id : '';
      } else d[f.key] = '';
    });
    return d;
  });

  const handleChange = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const processed = { ...formData };
    fields.forEach((f) => {
      if (f.type === 'number' || f.currency) processed[f.key] = Number(processed[f.key]) || 0;
      if (f.type === 'select' && f.source) processed[f.key] = Number(processed[f.key]) || 0;
    });
    if (isInvoice) {
      processed.vat_tax = Math.round(processed.subtotal * VAT_RATE);
      processed.total_value = processed.subtotal + processed.vat_tax;
      if (entityKey === 'sales_invoices') {
        processed.qr_code_hash = `QR-SI-${String(Date.now()).slice(-6)}`;
      }
    }
    onSubmit(processed);
  };

  const handleOCR = (data) => {
    Object.entries(data).forEach(([key, value]) => handleChange(key, value));
  };

  const subtotal = Number(formData.subtotal) || 0;
  const vatCalc = Math.round(subtotal * VAT_RATE);

  return (
    <form onSubmit={handleSubmit}>
      {entityKey === 'purchase_invoices' && <OCRZone onScanned={handleOCR} />}
      <div className="space-y-3">
        {fields.map((field) => {
          if (field.type === 'select' && field.source) {
            const items = store.getAll(field.source);
            return (
              <div key={field.key}>
                <label className="form-label">{field.label}</label>
                <select
                  className="form-select"
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.account_name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          if (field.type === 'select' && field.options) {
            return (
              <div key={field.key}>
                <label className="form-label">{field.label}</label>
                <select
                  className="form-select"
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <div key={field.key}>
              <label className="form-label">{field.label}</label>
              <input
                className="form-input"
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                placeholder={field.label}
                step={field.currency ? '0.01' : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Invoice VAT Preview */}
      {isInvoice && subtotal > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-surface-400">المبلغ قبل الضريبة</span>
            <span className="text-surface-300">{subtotal.toLocaleString('ar-SA')}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-surface-400">ض.ق.م 16%</span>
            <span className="text-amber-400">{vatCalc.toLocaleString('ar-SA')}</span>
          </div>
          <div className="border-t border-white/5 pt-1.5 flex justify-between text-[13px] font-bold">
            <span className="text-white">الإجمالي</span>
            <span className="text-primary-400">{(subtotal + vatCalc).toLocaleString('ar-SA')}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-5">
        <button type="submit" className="btn-primary flex-1">
          {initialData ? 'تحديث' : 'إضافة'}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
