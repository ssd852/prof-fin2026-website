import { useState, useMemo, useEffect } from 'react';
import { Wallet, Users, Truck, Briefcase, Receipt, ShoppingCart, FileCheck, BookOpen, BarChart3, UtensilsCrossed } from 'lucide-react';
import { SCHEMAS } from '../data/schemas';

const iconMap = {
  'Wallet': Wallet, 'Users': Users, 'Truck': Truck, 'Briefcase': Briefcase,
  'Receipt': Receipt, 'ShoppingCart': ShoppingCart, 'FileCheck': FileCheck,
  'BookOpen': BookOpen, 'UtensilsCrossed': UtensilsCrossed, 'BarChart3': BarChart3,
};

export default function CommandPalette({ isOpen, onClose, store, onNavigate }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const results = useMemo(() => {
    const r = [];
    const storeData = store.data;

    if (!query.trim()) {
      Object.entries(SCHEMAS).forEach(([k, s]) => {
        r.push({ type: 'nav', key: k, label: s.name, icon: s.icon });
      });
      r.push({ type: 'nav', key: 'pnl', label: 'قائمة الأرباح والخسائر', icon: 'BarChart3' });
      return r;
    }

    const q = query;
    Object.entries(SCHEMAS).forEach(([k, s]) => {
      if (s.name.includes(q)) r.push({ type: 'nav', key: k, label: s.name, icon: s.icon });
    });

    const customers = storeData.customers || [];
    customers.filter((c) => c.name.includes(q) || c.phone.includes(q))
      .slice(0, 4)
      .forEach((c) => r.push({ type: 'record', key: 'customers', label: c.name, sub: c.phone, icon: 'Users' }));

    const suppliers = storeData.suppliers || [];
    suppliers.filter((s) => s.name.includes(q))
      .slice(0, 3)
      .forEach((s) => r.push({ type: 'record', key: 'suppliers', label: s.name, sub: s.phone, icon: 'Truck' }));

    const invoices = storeData.sales_invoices || [];
    invoices.filter((i) => i.description?.includes(q))
      .slice(0, 3)
      .forEach((i) => r.push({ type: 'record', key: 'sales_invoices', label: `فاتورة #${i.id}: ${i.description}`, icon: 'Receipt' }));

    const foodItems = storeData.food_inventory || [];
    foodItems.filter((f) => f.item_name?.includes(q) || f.supplier_name?.includes(q))
      .slice(0, 3)
      .forEach((f) => r.push({ type: 'record', key: 'food_inventory', label: f.item_name, sub: f.category, icon: 'UtensilsCrossed' }));

    return r;
  }, [query, store.data]);

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-box">
        <input
          className="cmd-input"
          placeholder="ابحث عن عميل، فاتورة، أو انتقل إلى صفحة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="text-center py-6 text-surface-500 text-[13px]">لا توجد نتائج</p>
          ) : (
            results.map((r, i) => {
              const IconComp = iconMap[r.icon] || Wallet;
              return (
                <div
                  key={i}
                  className="cmd-item"
                  onClick={() => { onNavigate(r.key); onClose(); }}
                >
                  <IconComp size={15} />
                  <div>
                    <p className="text-[13px]">{r.label}</p>
                    {r.sub && <p className="text-[10px] text-surface-500">{r.sub}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-white/5 text-[10px] text-surface-500 flex gap-3">
          <span>↑↓ التنقل</span>
          <span>↵ اختيار</span>
          <span>ESC إغلاق</span>
        </div>
      </div>
    </div>
  );
}
