/* ===== Pages ===== */

// Recharts components
const {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart
} = Recharts;

// Custom Recharts tooltip
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return React.createElement('div', {
        className: 'glass-strong rounded-xl p-3 text-sm',
        style: { direction: 'rtl' }
    },
        React.createElement('p', { className: 'font-bold text-white mb-1' }, label),
        payload.map((entry, i) =>
            React.createElement('p', { key: i, style: { color: entry.color }, className: 'text-xs' },
                `${entry.name}: ${Number(entry.value).toLocaleString('ar-SA')} ر.س`
            )
        )
    );
}

// ===== Dashboard Page =====
function DashboardPage({ store, onToggleSidebar }) {
    const stats = store.getStats();

    const formatCurrency = (val) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + ' مليون';
        if (val >= 1000) return (val / 1000).toFixed(0) + ' ألف';
        return val.toLocaleString('ar-SA');
    };

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement(PageHeader, {
            title: 'لوحة التحكم',
            subtitle: 'نظرة عامة على الأداء المالي',
            onToggleSidebar
        }),

        // Stat Cards
        React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' },
            React.createElement(StatCard, {
                icon: 'banknote',
                label: 'إجمالي السيولة',
                value: formatCurrency(stats.totalLiquidity) + ' ر.س',
                color: 'cyan',
                trend: 12.5
            }),
            React.createElement(StatCard, {
                icon: 'users',
                label: 'العملاء النشطون',
                value: stats.activeCustomers.toString(),
                color: 'violet',
                trend: 8.3
            }),
            React.createElement(StatCard, {
                icon: 'clock',
                label: 'الشيكات المعلقة',
                value: stats.pendingChecks.toString(),
                color: 'amber',
                trend: -2.1
            }),
            React.createElement(StatCard, {
                icon: 'trending-up',
                label: 'صافي الربح',
                value: formatCurrency(stats.netProfit) + ' ر.س',
                color: 'emerald',
                trend: 15.7
            })
        ),

        // Charts Row
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-4' },
            // Cash Flow Bar Chart
            React.createElement('div', { className: 'lg:col-span-2 glass-card rounded-2xl p-6' },
                React.createElement('div', { className: 'flex items-center justify-between mb-6' },
                    React.createElement('div', null,
                        React.createElement('h3', { className: 'text-base font-bold text-white' }, 'التدفق النقدي'),
                        React.createElement('p', { className: 'text-xs text-surface-500 mt-0.5' }, 'مقارنة الإيرادات والمصروفات الشهرية')
                    ),
                    React.createElement('div', { className: 'flex items-center gap-4' },
                        React.createElement('div', { className: 'flex items-center gap-1.5' },
                            React.createElement('div', { className: 'w-2.5 h-2.5 rounded-full bg-cyan-400' }),
                            React.createElement('span', { className: 'text-xs text-surface-400' }, 'الإيرادات')
                        ),
                        React.createElement('div', { className: 'flex items-center gap-1.5' },
                            React.createElement('div', { className: 'w-2.5 h-2.5 rounded-full bg-violet-400' }),
                            React.createElement('span', { className: 'text-xs text-surface-400' }, 'المصروفات')
                        )
                    )
                ),
                React.createElement(ResponsiveContainer, { width: '100%', height: 300 },
                    React.createElement(BarChart, { data: CASH_FLOW_DATA, barGap: 4 },
                        React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: 'rgba(148,163,184,0.06)' }),
                        React.createElement(XAxis, { dataKey: 'month', tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }),
                        React.createElement(YAxis, {
                            tick: { fill: '#64748b', fontSize: 11 },
                            axisLine: false,
                            tickLine: false,
                            tickFormatter: (v) => (v / 1000) + 'K'
                        }),
                        React.createElement(Tooltip, { content: React.createElement(CustomTooltip) }),
                        React.createElement(Bar, { dataKey: 'inflow', name: 'الإيرادات', fill: '#06b6d4', radius: [6, 6, 0, 0], maxBarSize: 32 }),
                        React.createElement(Bar, { dataKey: 'outflow', name: 'المصروفات', fill: '#8b5cf6', radius: [6, 6, 0, 0], maxBarSize: 32 })
                    )
                )
            ),

            // Account Distribution Pie Chart
            React.createElement('div', { className: 'glass-card rounded-2xl p-6' },
                React.createElement('h3', { className: 'text-base font-bold text-white mb-1' }, 'توزيع الحسابات'),
                React.createElement('p', { className: 'text-xs text-surface-500 mb-4' }, 'توزيع الأرصدة حسب الحساب'),
                React.createElement(ResponsiveContainer, { width: '100%', height: 220 },
                    React.createElement(PieChart, null,
                        React.createElement(Pie, {
                            data: ACCOUNT_DISTRIBUTION_DATA,
                            cx: '50%',
                            cy: '50%',
                            innerRadius: 55,
                            outerRadius: 85,
                            paddingAngle: 3,
                            dataKey: 'value',
                            stroke: 'none'
                        },
                            ACCOUNT_DISTRIBUTION_DATA.map((entry, i) =>
                                React.createElement(Cell, { key: i, fill: entry.color })
                            )
                        ),
                        React.createElement(Tooltip, {
                            formatter: (val) => val.toLocaleString('ar-SA') + ' ر.س',
                            contentStyle: {
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(148,163,184,0.15)',
                                borderRadius: '10px',
                                color: '#e2e8f0',
                                fontSize: '12px',
                                direction: 'rtl'
                            }
                        })
                    )
                ),
                // Legend
                React.createElement('div', { className: 'grid grid-cols-2 gap-2 mt-2' },
                    ACCOUNT_DISTRIBUTION_DATA.map((item, i) =>
                        React.createElement('div', { key: i, className: 'flex items-center gap-2' },
                            React.createElement('div', { className: 'w-2 h-2 rounded-full', style: { backgroundColor: item.color } }),
                            React.createElement('span', { className: 'text-[11px] text-surface-400 truncate' }, item.name)
                        )
                    )
                )
            )
        ),

        // Recent Activity Row
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-4' },
            // Recent Sales
            React.createElement('div', { className: 'glass-card rounded-2xl p-6' },
                React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                    React.createElement('h3', { className: 'text-base font-bold text-white' }, 'آخر فواتير المبيعات'),
                    React.createElement('span', { className: 'text-xs text-cyan-400 cursor-pointer hover:underline' }, 'عرض الكل')
                ),
                React.createElement('div', { className: 'space-y-3' },
                    store.getAll('sales_invoices').slice(-5).reverse().map(inv => {
                        const customer = store.getById('customers', inv.customer_id);
                        return React.createElement('div', {
                            key: inv.id,
                            className: 'flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors'
                        },
                            React.createElement('div', { className: 'flex items-center gap-3' },
                                React.createElement('div', { className: 'w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center' },
                                    React.createElement(Icon, { name: 'receipt', size: 16, color: '#22d3ee' })
                                ),
                                React.createElement('div', null,
                                    React.createElement('p', { className: 'text-sm font-medium text-surface-200' }, inv.description),
                                    React.createElement('p', { className: 'text-xs text-surface-500' }, customer ? customer.name : 'عميل')
                                )
                            ),
                            React.createElement('div', { className: 'text-left' },
                                React.createElement('p', { className: 'text-sm font-bold text-emerald-400' }, '+' + Number(inv.value).toLocaleString('ar-SA')),
                                React.createElement('p', { className: 'text-xs text-surface-500' }, inv.date)
                            )
                        );
                    })
                )
            ),

            // Pending Checks
            React.createElement('div', { className: 'glass-card rounded-2xl p-6' },
                React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                    React.createElement('h3', { className: 'text-base font-bold text-white' }, 'الشيكات المعلقة'),
                    React.createElement('span', { className: 'text-xs text-amber-400 cursor-pointer hover:underline' }, 'عرض الكل')
                ),
                React.createElement('div', { className: 'space-y-3' },
                    store.getAll('checks').filter(c => c.status === 'معلق').slice(0, 5).map(check => {
                        const customer = store.getById('customers', check.customer_id);
                        return React.createElement('div', {
                            key: check.id,
                            className: 'flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors'
                        },
                            React.createElement('div', { className: 'flex items-center gap-3' },
                                React.createElement('div', { className: 'w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center' },
                                    React.createElement(Icon, { name: 'file-check', size: 16, color: '#fbbf24' })
                                ),
                                React.createElement('div', null,
                                    React.createElement('p', { className: 'text-sm font-medium text-surface-200' }, customer ? customer.name : 'عميل'),
                                    React.createElement('p', { className: 'text-xs text-surface-500' }, 'استحقاق: ' + check.due_date)
                                )
                            ),
                            React.createElement('div', { className: 'text-left' },
                                React.createElement('p', { className: 'text-sm font-bold text-amber-400' }, Number(check.value).toLocaleString('ar-SA') + ' ر.س'),
                                React.createElement('span', { className: 'badge badge-pending text-[10px]' }, 'معلق')
                            )
                        );
                    })
                )
            )
        )
    );
}

// ===== Generic Entity Page (used by all 8 entity sections) =====
function EntityPage({ entityKey, store, onToggleSidebar }) {
    const schema = SCHEMAS[entityKey];
    const data = store.getAll(entityKey);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editItem, setEditItem] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const { showToast } = useToast();

    const filteredData = React.useMemo(() => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(q)
            )
        );
    }, [data, searchQuery]);

    const handleAdd = () => {
        setEditItem(null);
        setModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        store.remove(entityKey, id);
        showToast('تم الحذف بنجاح ✓', 'success');
    };

    const handleSubmit = (formData) => {
        if (editItem) {
            store.update(entityKey, editItem.id, formData);
            showToast('تم التحديث بنجاح ✓', 'success');
        } else {
            store.add(entityKey, formData);
            showToast('تمت الإضافة بنجاح ✓', 'success');
        }
        setModalOpen(false);
        setEditItem(null);
    };

    // Summary stats for the entity
    const entityStats = React.useMemo(() => {
        const count = data.length;
        let total = 0;
        const valueField = schema.fields.find(f => f.currency);
        if (valueField) {
            total = data.reduce((sum, item) => sum + (Number(item[valueField.key]) || 0), 0);
        }
        return { count, total, valueField };
    }, [data]);

    return React.createElement('div', null,
        React.createElement(PageHeader, {
            title: schema.name,
            subtitle: `إدارة بيانات ${schema.name} — ${entityStats.count} سجل`,
            onAdd: handleAdd,
            addLabel: 'إضافة جديد',
            onToggleSidebar
        }),

        // Quick Stats
        React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4' },
            React.createElement('div', { className: 'glass-card rounded-xl p-4' },
                React.createElement('p', { className: 'text-xs text-surface-500 mb-1' }, 'عدد السجلات'),
                React.createElement('p', { className: 'text-lg font-bold text-white' }, entityStats.count)
            ),
            entityStats.valueField && React.createElement('div', { className: 'glass-card rounded-xl p-4' },
                React.createElement('p', { className: 'text-xs text-surface-500 mb-1' }, 'إجمالي ' + entityStats.valueField.label),
                React.createElement('p', { className: 'text-lg font-bold text-cyan-400' }, entityStats.total.toLocaleString('ar-SA') + ' ر.س')
            ),
            React.createElement('div', { className: 'glass-card rounded-xl p-4' },
                React.createElement('p', { className: 'text-xs text-surface-500 mb-1' }, 'آخر تحديث'),
                React.createElement('p', { className: 'text-lg font-bold text-surface-300' }, new Date().toLocaleDateString('ar-SA'))
            )
        ),

        // Search
        React.createElement(SearchBar, {
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: `البحث في ${schema.name}...`
        }),

        // Data Table
        React.createElement(DataTable, {
            columns: schema.fields,
            data: filteredData,
            onEdit: handleEdit,
            onDelete: handleDelete,
            store,
            entity: entityKey
        }),

        // Add/Edit Modal
        React.createElement(Modal, {
            isOpen: modalOpen,
            onClose: () => { setModalOpen(false); setEditItem(null); },
            title: editItem ? `تعديل في ${schema.name}` : `إضافة إلى ${schema.name}`
        },
            React.createElement(DynamicForm, {
                schema,
                initialData: editItem,
                onSubmit: handleSubmit,
                onCancel: () => { setModalOpen(false); setEditItem(null); },
                store
            })
        )
    );
}
