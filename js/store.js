/* ===== Data Store Hook (localStorage persistence) ===== */

function useDataStore() {
    const [data, setData] = React.useState(() => {
        try {
            const saved = localStorage.getItem('financeAppData');
            return saved ? JSON.parse(saved) : INITIAL_DATA;
        } catch {
            return INITIAL_DATA;
        }
    });

    // Persist to localStorage on every change
    React.useEffect(() => {
        localStorage.setItem('financeAppData', JSON.stringify(data));
    }, [data]);

    const getAll = (entity) => data[entity] || [];

    const getById = (entity, id) => (data[entity] || []).find(item => item.id === id);

    const add = (entity, record) => {
        setData(prev => {
            const list = prev[entity] || [];
            const maxId = list.reduce((max, item) => Math.max(max, item.id || 0), 0);
            const newRecord = { ...record, id: maxId + 1 };
            return { ...prev, [entity]: [...list, newRecord] };
        });
    };

    const update = (entity, id, updates) => {
        setData(prev => ({
            ...prev,
            [entity]: (prev[entity] || []).map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        }));
    };

    const remove = (entity, id) => {
        setData(prev => ({
            ...prev,
            [entity]: (prev[entity] || []).filter(item => item.id !== id)
        }));
    };

    const resetData = () => {
        setData(INITIAL_DATA);
        localStorage.removeItem('financeAppData');
    };

    // Computed stats for dashboard
    const getStats = () => {
        const accounts = data.accounts || [];
        const customers = data.customers || [];
        const checks = data.checks || [];
        const salesInvoices = data.sales_invoices || [];
        const purchaseInvoices = data.purchase_invoices || [];

        const totalLiquidity = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
        const activeCustomers = customers.length;
        const pendingChecks = checks.filter(c => c.status === 'معلق').length;
        const totalSales = salesInvoices.reduce((sum, inv) => sum + (Number(inv.value) || 0), 0);
        const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.value) || 0), 0);
        const netProfit = totalSales - totalPurchases;

        return { totalLiquidity, activeCustomers, pendingChecks, netProfit, totalSales, totalPurchases };
    };

    return { data, getAll, getById, add, update, remove, resetData, getStats };
}

// Toast notification system
const ToastContext = React.createContext();

function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return React.createElement(ToastContext.Provider, { value: { showToast } },
        children,
        toasts.map(toast =>
            React.createElement('div', {
                key: toast.id,
                className: `toast toast-${toast.type}`
            }, toast.message)
        )
    );
}

function useToast() {
    return React.useContext(ToastContext);
}
