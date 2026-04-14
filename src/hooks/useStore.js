import { useState, useEffect } from 'react';
import { SEED } from '../data/schemas';

const STORAGE_KEY = 'smartacc_data';

export function useStore() {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : SEED;
    } catch {
      return SEED;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const getAll = (entity) => data[entity] || [];

  const getById = (entity, id) =>
    (data[entity] || []).find((item) => item.id === Number(id));

  const add = (entity, record) => {
    setData((prev) => {
      const list = prev[entity] || [];
      const maxId = list.reduce((max, item) => Math.max(max, item.id || 0), 0);
      return { ...prev, [entity]: [...list, { ...record, id: maxId + 1 }] };
    });
  };

  const update = (entity, id, updates) => {
    setData((prev) => ({
      ...prev,
      [entity]: (prev[entity] || []).map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const remove = (entity, id) => {
    setData((prev) => ({
      ...prev,
      [entity]: (prev[entity] || []).filter((item) => item.id !== id),
    }));
  };

  const reset = () => {
    setData(SEED);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getStats = () => {
    const accounts = data.accounts || [];
    const customers = data.customers || [];
    const checks = data.checks || [];
    const salesInvoices = data.sales_invoices || [];
    const purchaseInvoices = data.purchase_invoices || [];

    return {
      totalLiquidity: accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0),
      activeCustomers: customers.length,
      pendingChecks: checks.filter((c) => c.status === 'معلق').length,
      pendingChecksValue: checks
        .filter((c) => c.status === 'معلق')
        .reduce((sum, c) => sum + (Number(c.value) || 0), 0),
      totalSales: salesInvoices.reduce((sum, i) => sum + (Number(i.total_value) || 0), 0),
      totalPurchases: purchaseInvoices.reduce((sum, i) => sum + (Number(i.total_value) || 0), 0),
      netProfit:
        salesInvoices.reduce((sum, i) => sum + (Number(i.total_value) || 0), 0) -
        purchaseInvoices.reduce((sum, i) => sum + (Number(i.total_value) || 0), 0),
      totalVAT: salesInvoices.reduce((sum, i) => sum + (Number(i.vat_tax) || 0), 0),
      overLimitCustomers: customers.filter(
        (c) => (Number(c.balance) || 0) > (Number(c.credit_limit) || 0)
      ).length,
      weekChecks: checks.filter((c) => {
        if (c.status !== 'معلق') return false;
        const d = new Date(c.due_date);
        const now = new Date();
        const diff = (d - now) / 86400000;
        return diff >= 0 && diff <= 7;
      }),
    };
  };

  return { data, getAll, getById, add, update, remove, reset, getStats };
}
