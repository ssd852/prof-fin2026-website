/* ===== Shared UI Components ===== */

// Lucide icon helper
function Icon({ name, size = 20, className = '', color }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = '';
            try {
                const iconEl = lucide.createElement(lucide.icons[name]);
                if (iconEl) {
                    iconEl.setAttribute('width', size);
                    iconEl.setAttribute('height', size);
                    if (color) iconEl.setAttribute('stroke', color);
                    ref.current.appendChild(iconEl);
                }
            } catch (e) {
                // fallback - empty
            }
        }
    }, [name, size, color]);
    return React.createElement('span', { ref, className: `inline-flex items-center justify-center ${className}`, style: { width: size, height: size } });
}

// ===== Stat Card =====
function StatCard({ icon, label, value, color, trend }) {
    const colorMap = {
        cyan: { bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/15' },
        violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400', iconBg: 'bg-violet-500/15' },
        emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/15' },
        amber: { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/15' },
    };
    const c = colorMap[color] || colorMap.cyan;

    return React.createElement('div', {
        className: `glass-card rounded-2xl p-6 bg-gradient-to-br ${c.bg} border ${c.border} relative overflow-hidden`
    },
        // Decorative circle
        React.createElement('div', { className: `absolute -top-4 -left-4 w-24 h-24 rounded-full ${c.iconBg} blur-2xl opacity-50` }),
        React.createElement('div', { className: 'relative z-10 flex items-start justify-between' },
            React.createElement('div', null,
                React.createElement('p', { className: 'text-sm text-surface-400 mb-1 font-medium' }, label),
                React.createElement('p', { className: `text-2xl font-bold ${c.text} tracking-tight` }, value),
                trend && React.createElement('p', { className: `text-xs mt-2 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}` },
                    trend > 0 ? '▲' : '▼', ' ', Math.abs(trend), '%'
                )
            ),
            React.createElement('div', { className: `p-3 rounded-xl ${c.iconBg}` },
                React.createElement(Icon, { name: icon, size: 22, color: color === 'cyan' ? '#22d3ee' : color === 'violet' ? '#a78bfa' : color === 'emerald' ? '#34d399' : '#fbbf24' })
            )
        )
    );
}

// ===== Data Table =====
function DataTable({ columns, data, onEdit, onDelete, store, entity }) {
    const formatValue = (col, val, row) => {
        if (col.currency) return (Number(val) || 0).toLocaleString('ar-SA') + ' ر.س';
        if (col.type === 'select' && col.source && store) {
            const ref = store.getById(col.source, Number(val));
            return ref ? ref.name : val;
        }
        if (col.key === 'status') {
            const statusClass = val === 'مدفوع' ? 'badge-paid' : val === 'مرتجع' ? 'badge-bounced' : 'badge-pending';
            return React.createElement('span', { className: `badge ${statusClass}` }, val);
        }
        return val;
    };

    return React.createElement('div', { className: 'overflow-auto rounded-2xl glass max-h-[calc(100vh-320px)]' },
        React.createElement('table', { className: 'data-table' },
            React.createElement('thead', null,
                React.createElement('tr', null,
                    columns.filter(c => !c.auto).map(col =>
                        React.createElement('th', { key: col.key }, col.label)
                    ),
                    React.createElement('th', { style: { width: 100 } }, 'الإجراءات')
                )
            ),
            React.createElement('tbody', null,
                data.length === 0
                    ? React.createElement('tr', null,
                        React.createElement('td', { colSpan: columns.filter(c => !c.auto).length + 1, className: 'text-center py-12 text-surface-500' },
                            React.createElement(Icon, { name: 'inbox', size: 40, className: 'mx-auto mb-3 opacity-30' }),
                            React.createElement('p', null, 'لا توجد بيانات')
                        )
                    )
                    : data.map(row =>
                        React.createElement('tr', { key: row.id },
                            columns.filter(c => !c.auto).map(col =>
                                React.createElement('td', { key: col.key }, formatValue(col, row[col.key], row))
                            ),
                            React.createElement('td', null,
                                React.createElement('div', { className: 'flex gap-1' },
                                    React.createElement('button', {
                                        className: 'btn-icon edit',
                                        onClick: () => onEdit(row),
                                        title: 'تعديل'
                                    }, React.createElement(Icon, { name: 'pencil', size: 16, color: '#22d3ee' })),
                                    React.createElement('button', {
                                        className: 'btn-icon delete',
                                        onClick: () => onDelete(row.id),
                                        title: 'حذف'
                                    }, React.createElement(Icon, { name: 'trash-2', size: 16, color: '#f87171' }))
                                )
                            )
                        )
                    )
            )
        )
    );
}

// ===== Modal =====
function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'modal-overlay',
        onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
    },
        React.createElement('div', { className: 'modal-content' },
            React.createElement('div', { className: 'flex items-center justify-between mb-6' },
                React.createElement('h3', { className: 'text-lg font-bold text-white' }, title),
                React.createElement('button', {
                    className: 'btn-icon',
                    onClick: onClose
                }, React.createElement(Icon, { name: 'x', size: 20, color: '#94a3b8' }))
            ),
            children
        )
    );
}

// ===== Dynamic Form =====
function DynamicForm({ schema, initialData, onSubmit, onCancel, store }) {
    const fields = schema.fields.filter(f => !f.auto);
    const [formData, setFormData] = React.useState(() => {
        if (initialData) return { ...initialData };
        const defaults = {};
        fields.forEach(f => {
            if (f.type === 'date') defaults[f.key] = new Date().toISOString().split('T')[0];
            else if (f.type === 'number') defaults[f.key] = '';
            else if (f.type === 'select' && f.options) defaults[f.key] = f.options[0];
            else if (f.type === 'select' && f.source) {
                const items = store.getAll(f.source);
                defaults[f.key] = items.length > 0 ? items[0].id : '';
            }
            else defaults[f.key] = '';
        });
        return defaults;
    });

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert numeric fields
        const processed = { ...formData };
        fields.forEach(f => {
            if (f.type === 'number' || f.currency) {
                processed[f.key] = Number(processed[f.key]) || 0;
            }
        });
        onSubmit(processed);
    };

    return React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'space-y-4' },
            fields.map(field => {
                if (field.type === 'select' && field.source) {
                    const items = store.getAll(field.source);
                    return React.createElement('div', { key: field.key },
                        React.createElement('label', { className: 'form-label' }, field.label),
                        React.createElement('select', {
                            className: 'form-select',
                            value: formData[field.key] || '',
                            onChange: (e) => handleChange(field.key, e.target.value),
                            required: field.required
                        },
                            items.map(item =>
                                React.createElement('option', { key: item.id, value: item.id }, item.name || item.account_name)
                            )
                        )
                    );
                }
                if (field.type === 'select' && field.options) {
                    return React.createElement('div', { key: field.key },
                        React.createElement('label', { className: 'form-label' }, field.label),
                        React.createElement('select', {
                            className: 'form-select',
                            value: formData[field.key] || '',
                            onChange: (e) => handleChange(field.key, e.target.value),
                            required: field.required
                        },
                            field.options.map(opt =>
                                React.createElement('option', { key: opt, value: opt }, opt)
                            )
                        )
                    );
                }
                return React.createElement('div', { key: field.key },
                    React.createElement('label', { className: 'form-label' }, field.label),
                    React.createElement('input', {
                        className: 'form-input',
                        type: field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text',
                        value: formData[field.key] || '',
                        onChange: (e) => handleChange(field.key, e.target.value),
                        required: field.required,
                        placeholder: field.label,
                        step: field.currency ? '0.01' : undefined
                    })
                );
            })
        ),
        React.createElement('div', { className: 'flex gap-3 mt-8' },
            React.createElement('button', { type: 'submit', className: 'btn-primary flex-1' },
                initialData ? 'تحديث' : 'إضافة'
            ),
            React.createElement('button', { type: 'button', className: 'btn-secondary flex-1', onClick: onCancel },
                'إلغاء'
            )
        )
    );
}

// ===== Sidebar Component =====
function Sidebar({ activeSection, onNavigate, isOpen, onClose }) {
    const menuItems = [
        { key: 'dashboard', label: 'لوحة التحكم', icon: 'layout-dashboard' },
        { key: 'accounts', label: 'الحسابات', icon: 'wallet' },
        { key: 'customers', label: 'العملاء', icon: 'users' },
        { key: 'suppliers', label: 'الموردون', icon: 'truck' },
        { key: 'employees', label: 'الموظفون', icon: 'briefcase' },
        { key: 'sales_invoices', label: 'فواتير المبيعات', icon: 'receipt' },
        { key: 'purchase_invoices', label: 'فواتير المشتريات', icon: 'shopping-cart' },
        { key: 'checks', label: 'الشيكات', icon: 'file-check' },
        { key: 'journal_entries', label: 'القيود اليومية', icon: 'book-open' },
    ];

    return React.createElement(React.Fragment, null,
        // Mobile overlay
        isOpen && React.createElement('div', {
            className: 'fixed inset-0 bg-black/50 z-30 md:hidden',
            onClick: onClose
        }),
        React.createElement('aside', {
            className: `sidebar fixed md:relative right-0 top-0 bottom-0 w-64 z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`
        },
            // Logo area
            React.createElement('div', { className: 'p-6 border-b border-white/5' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center' },
                        React.createElement(Icon, { name: 'landmark', size: 20, color: 'white' })
                    ),
                    React.createElement('div', null,
                        React.createElement('h1', { className: 'text-base font-bold text-white' }, 'المالية'),
                        React.createElement('p', { className: 'text-[11px] text-surface-500' }, 'نظام الإدارة المحاسبية')
                    )
                )
            ),
            // Navigation
            React.createElement('nav', { className: 'flex-1 p-4 space-y-1 overflow-y-auto' },
                menuItems.map(item =>
                    React.createElement('div', {
                        key: item.key,
                        className: `sidebar-item ${activeSection === item.key ? 'active' : ''}`,
                        onClick: () => { onNavigate(item.key); onClose(); }
                    },
                        React.createElement(Icon, { name: item.icon, size: 18 }),
                        React.createElement('span', null, item.label)
                    )
                )
            ),
            // Footer
            React.createElement('div', { className: 'p-4 border-t border-white/5' },
                React.createElement('div', { className: 'flex items-center gap-3 px-3 py-2' },
                    React.createElement('div', { className: 'w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white' }, 'م'),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm font-medium text-surface-300' }, 'المسؤول'),
                        React.createElement('p', { className: 'text-[11px] text-surface-500' }, 'admin@finance.sa')
                    )
                )
            )
        )
    );
}

// ===== Page Header =====
function PageHeader({ title, subtitle, onAdd, addLabel, onToggleSidebar }) {
    return React.createElement('div', { className: 'flex items-center justify-between mb-6' },
        React.createElement('div', { className: 'flex items-center gap-4' },
            React.createElement('button', {
                className: 'btn-icon md:hidden',
                onClick: onToggleSidebar
            }, React.createElement(Icon, { name: 'menu', size: 24, color: '#94a3b8' })),
            React.createElement('div', null,
                React.createElement('h2', { className: 'text-xl font-bold text-white' }, title),
                subtitle && React.createElement('p', { className: 'text-sm text-surface-400 mt-0.5' }, subtitle)
            )
        ),
        onAdd && React.createElement('button', {
            className: 'btn-primary flex items-center gap-2',
            onClick: onAdd
        },
            React.createElement(Icon, { name: 'plus', size: 18, color: 'white' }),
            React.createElement('span', null, addLabel || 'إضافة جديد')
        )
    );
}

// ===== Search Bar =====
function SearchBar({ value, onChange, placeholder }) {
    return React.createElement('div', { className: 'relative mb-4' },
        React.createElement('div', { className: 'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' },
            React.createElement(Icon, { name: 'search', size: 16, color: '#475569' })
        ),
        React.createElement('input', {
            type: 'text',
            className: 'form-input pr-10',
            style: { paddingRight: '40px' },
            placeholder: placeholder || 'بحث...',
            value: value,
            onChange: (e) => onChange(e.target.value)
        })
    );
}
