/* ===== Database Schema & Dummy Data ===== */

// Schema definitions for each entity
const SCHEMAS = {
    accounts: {
        name: 'الحسابات',
        icon: 'wallet',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'account_name', label: 'اسم الحساب', type: 'text', required: true },
            { key: 'balance', label: 'الرصيد', type: 'number', required: true, currency: true },
            { key: 'creation_date', label: 'تاريخ الإنشاء', type: 'date', required: true },
        ]
    },
    customers: {
        name: 'العملاء',
        icon: 'users',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'name', label: 'الاسم', type: 'text', required: true },
            { key: 'phone', label: 'الهاتف', type: 'text', required: true },
            { key: 'balance', label: 'الرصيد', type: 'number', required: true, currency: true },
            { key: 'last_action_date', label: 'آخر إجراء', type: 'date', required: true },
        ]
    },
    suppliers: {
        name: 'الموردون',
        icon: 'truck',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'name', label: 'الاسم', type: 'text', required: true },
            { key: 'phone', label: 'الهاتف', type: 'text', required: true },
            { key: 'balance', label: 'الرصيد', type: 'number', required: true, currency: true },
            { key: 'last_action_date', label: 'آخر إجراء', type: 'date', required: true },
        ]
    },
    employees: {
        name: 'الموظفون',
        icon: 'briefcase',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'name', label: 'الاسم', type: 'text', required: true },
            { key: 'phone', label: 'الهاتف', type: 'text', required: true },
            { key: 'debit_balance', label: 'رصيد مدين', type: 'number', required: true, currency: true },
        ]
    },
    sales_invoices: {
        name: 'فواتير المبيعات',
        icon: 'receipt',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'customer_id', label: 'العميل', type: 'select', source: 'customers', required: true },
            { key: 'value', label: 'القيمة', type: 'number', required: true, currency: true },
            { key: 'description', label: 'الوصف', type: 'text', required: true },
            { key: 'date', label: 'التاريخ', type: 'date', required: true },
        ]
    },
    purchase_invoices: {
        name: 'فواتير المشتريات',
        icon: 'shopping-cart',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'supplier_id', label: 'المورد', type: 'select', source: 'suppliers', required: true },
            { key: 'value', label: 'القيمة', type: 'number', required: true, currency: true },
            { key: 'description', label: 'الوصف', type: 'text', required: true },
            { key: 'date', label: 'التاريخ', type: 'date', required: true },
        ]
    },
    checks: {
        name: 'الشيكات',
        icon: 'file-check',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'value', label: 'القيمة', type: 'number', required: true, currency: true },
            { key: 'due_date', label: 'تاريخ الاستحقاق', type: 'date', required: true },
            { key: 'status', label: 'الحالة', type: 'select', options: ['معلق', 'مدفوع', 'مرتجع'], required: true },
            { key: 'customer_id', label: 'العميل', type: 'select', source: 'customers', required: true },
        ]
    },
    journal_entries: {
        name: 'القيود اليومية',
        icon: 'book-open',
        fields: [
            { key: 'id', label: '#', type: 'number', auto: true },
            { key: 'notes', label: 'الملاحظات', type: 'text', required: true },
            { key: 'value', label: 'القيمة', type: 'number', required: true, currency: true },
            { key: 'entry_type', label: 'نوع القيد', type: 'select', options: ['مدين', 'دائن', 'تسوية'], required: true },
            { key: 'date', label: 'التاريخ', type: 'date', required: true },
        ]
    }
};

// Realistic Arabic dummy data
const INITIAL_DATA = {
    accounts: [
        { id: 1, account_name: 'الصندوق الرئيسي', balance: 245000, creation_date: '2025-01-15' },
        { id: 2, account_name: 'حساب البنك الأهلي', balance: 1850000, creation_date: '2025-01-20' },
        { id: 3, account_name: 'حساب البنك العربي', balance: 720000, creation_date: '2025-02-01' },
        { id: 4, account_name: 'صندوق المصروفات', balance: 45000, creation_date: '2025-02-10' },
        { id: 5, account_name: 'حساب الاستثمارات', balance: 3200000, creation_date: '2025-03-01' },
        { id: 6, account_name: 'حساب الضرائب', balance: 128000, creation_date: '2025-03-15' },
        { id: 7, account_name: 'حساب الرواتب', balance: 560000, creation_date: '2025-04-01' },
        { id: 8, account_name: 'حساب العهد', balance: 95000, creation_date: '2025-04-10' },
        { id: 9, account_name: 'حساب التأمينات', balance: 310000, creation_date: '2025-05-01' },
        { id: 10, account_name: 'حساب المخزون', balance: 1450000, creation_date: '2025-05-15' },
    ],
    customers: [
        { id: 1, name: 'محمد أحمد العلي', phone: '0551234567', balance: 125000, last_action_date: '2026-03-20' },
        { id: 2, name: 'فاطمة سعيد الخالدي', phone: '0559876543', balance: 78000, last_action_date: '2026-03-18' },
        { id: 3, name: 'عبدالله ناصر المطيري', phone: '0541112233', balance: 340000, last_action_date: '2026-03-15' },
        { id: 4, name: 'نورة خالد الشمري', phone: '0533344556', balance: 55000, last_action_date: '2026-03-10' },
        { id: 5, name: 'سلطان فهد الدوسري', phone: '0567788990', balance: 192000, last_action_date: '2026-03-22' },
        { id: 6, name: 'أحمد يوسف الغامدي', phone: '0544455667', balance: 89000, last_action_date: '2026-02-28' },
        { id: 7, name: 'سارة عبدالرحمن البقمي', phone: '0522233445', balance: 267000, last_action_date: '2026-03-05' },
        { id: 8, name: 'خالد سعد العتيبي', phone: '0511122334', balance: 145000, last_action_date: '2026-03-25' },
        { id: 9, name: 'مريم حسن القحطاني', phone: '0588877665', balance: 73000, last_action_date: '2026-03-12' },
        { id: 10, name: 'عمر ماجد الحربي', phone: '0577766554', balance: 420000, last_action_date: '2026-03-28' },
        { id: 11, name: 'هند سالم الزهراني', phone: '0566655443', balance: 52000, last_action_date: '2026-02-15' },
        { id: 12, name: 'ياسر إبراهيم النفيعي', phone: '0555544332', balance: 178000, last_action_date: '2026-03-30' },
    ],
    suppliers: [
        { id: 1, name: 'شركة الأمان للتوريدات', phone: '0112345678', balance: 560000, last_action_date: '2026-03-22' },
        { id: 2, name: 'مؤسسة النجاح التجارية', phone: '0119876543', balance: 230000, last_action_date: '2026-03-20' },
        { id: 3, name: 'شركة البركة للمواد', phone: '0114455667', balance: 890000, last_action_date: '2026-03-18' },
        { id: 4, name: 'مصنع الفجر الصناعي', phone: '0117788990', balance: 1200000, last_action_date: '2026-03-15' },
        { id: 5, name: 'شركة الوفاء للتجارة', phone: '0112233445', balance: 345000, last_action_date: '2026-03-25' },
        { id: 6, name: 'مؤسسة الإتقان للخدمات', phone: '0118899001', balance: 178000, last_action_date: '2026-03-10' },
        { id: 7, name: 'شركة التقدم للإلكترونيات', phone: '0113344556', balance: 720000, last_action_date: '2026-03-28' },
        { id: 8, name: 'مصنع الجودة للبلاستيك', phone: '0116677889', balance: 440000, last_action_date: '2026-02-28' },
    ],
    employees: [
        { id: 1, name: 'عادل محمد السالم', phone: '0501234567', debit_balance: 3500 },
        { id: 2, name: 'ريم فيصل العنزي', phone: '0509876543', debit_balance: 0 },
        { id: 3, name: 'بندر سعود الرشيدي', phone: '0504455667', debit_balance: 12000 },
        { id: 4, name: 'لمى عبدالعزيز الجهني', phone: '0507788990', debit_balance: 5000 },
        { id: 5, name: 'تركي نواف المالكي', phone: '0502233445', debit_balance: 0 },
        { id: 6, name: 'هيفاء حمد العمري', phone: '0508899001', debit_balance: 8500 },
        { id: 7, name: 'ماجد خالد الثبيتي', phone: '0503344556', debit_balance: 2000 },
        { id: 8, name: 'نوف عبدالله السبيعي', phone: '0506677889', debit_balance: 15000 },
        { id: 9, name: 'فهد سلطان الشهري', phone: '0501122334', debit_balance: 0 },
        { id: 10, name: 'أمل حسين الأحمدي', phone: '0505566778', debit_balance: 4200 },
    ],
    sales_invoices: [
        { id: 1, customer_id: 1, value: 45000, description: 'بيع أجهزة حاسب', date: '2026-03-01' },
        { id: 2, customer_id: 3, value: 128000, description: 'بيع معدات مكتبية', date: '2026-03-05' },
        { id: 3, customer_id: 5, value: 67000, description: 'بيع شاشات عرض', date: '2026-03-08' },
        { id: 4, customer_id: 2, value: 23000, description: 'بيع طابعات', date: '2026-03-10' },
        { id: 5, customer_id: 8, value: 89000, description: 'بيع خوادم شبكات', date: '2026-03-12' },
        { id: 6, customer_id: 10, value: 156000, description: 'بيع نظام أمني', date: '2026-03-15' },
        { id: 7, customer_id: 4, value: 34000, description: 'بيع قطع غيار', date: '2026-03-18' },
        { id: 8, customer_id: 7, value: 210000, description: 'بيع نظام ERP', date: '2026-03-20' },
        { id: 9, customer_id: 12, value: 52000, description: 'بيع كاميرات مراقبة', date: '2026-03-22' },
        { id: 10, customer_id: 6, value: 78000, description: 'بيع أنظمة صوتية', date: '2026-03-25' },
        { id: 11, customer_id: 9, value: 41000, description: 'بيع أجهزة شبكات', date: '2026-03-28' },
        { id: 12, customer_id: 11, value: 95000, description: 'بيع أنظمة حماية', date: '2026-03-30' },
    ],
    purchase_invoices: [
        { id: 1, supplier_id: 1, value: 320000, description: 'شراء مواد خام', date: '2026-03-02' },
        { id: 2, supplier_id: 3, value: 185000, description: 'شراء معدات إنتاج', date: '2026-03-06' },
        { id: 3, supplier_id: 4, value: 540000, description: 'شراء آلات صناعية', date: '2026-03-09' },
        { id: 4, supplier_id: 2, value: 92000, description: 'شراء مستلزمات تغليف', date: '2026-03-11' },
        { id: 5, supplier_id: 7, value: 278000, description: 'شراء قطع إلكترونية', date: '2026-03-14' },
        { id: 6, supplier_id: 5, value: 156000, description: 'شراء مواد بناء', date: '2026-03-17' },
        { id: 7, supplier_id: 6, value: 67000, description: 'شراء أدوات صيانة', date: '2026-03-20' },
        { id: 8, supplier_id: 8, value: 430000, description: 'شراء قوالب بلاستيكية', date: '2026-03-24' },
        { id: 9, supplier_id: 1, value: 145000, description: 'شراء مواد كيميائية', date: '2026-03-27' },
        { id: 10, supplier_id: 3, value: 210000, description: 'شراء لوازم مكتبية', date: '2026-03-30' },
    ],
    checks: [
        { id: 1, value: 75000, due_date: '2026-04-15', status: 'معلق', customer_id: 1 },
        { id: 2, value: 120000, due_date: '2026-04-20', status: 'معلق', customer_id: 3 },
        { id: 3, value: 45000, due_date: '2026-03-10', status: 'مدفوع', customer_id: 5 },
        { id: 4, value: 89000, due_date: '2026-03-15', status: 'مدفوع', customer_id: 2 },
        { id: 5, value: 200000, due_date: '2026-05-01', status: 'معلق', customer_id: 10 },
        { id: 6, value: 34000, due_date: '2026-02-28', status: 'مرتجع', customer_id: 4 },
        { id: 7, value: 156000, due_date: '2026-04-30', status: 'معلق', customer_id: 8 },
        { id: 8, value: 67000, due_date: '2026-03-20', status: 'مدفوع', customer_id: 7 },
        { id: 9, value: 92000, due_date: '2026-05-10', status: 'معلق', customer_id: 12 },
        { id: 10, value: 28000, due_date: '2026-03-05', status: 'مرتجع', customer_id: 6 },
    ],
    journal_entries: [
        { id: 1, notes: 'قيد افتتاحي - رأس المال', value: 5000000, entry_type: 'دائن', date: '2025-01-15' },
        { id: 2, notes: 'إيداع بنكي - البنك الأهلي', value: 1850000, entry_type: 'مدين', date: '2025-01-20' },
        { id: 3, notes: 'سداد فواتير كهرباء', value: 15000, entry_type: 'مدين', date: '2026-03-01' },
        { id: 4, notes: 'تحصيل مبيعات نقدية', value: 245000, entry_type: 'دائن', date: '2026-03-05' },
        { id: 5, notes: 'صرف رواتب شهر مارس', value: 320000, entry_type: 'مدين', date: '2026-03-28' },
        { id: 6, notes: 'تسوية حساب الضرائب', value: 128000, entry_type: 'تسوية', date: '2026-03-30' },
        { id: 7, notes: 'سداد إيجار المقر', value: 45000, entry_type: 'مدين', date: '2026-03-01' },
        { id: 8, notes: 'تحصيل شيك عميل', value: 89000, entry_type: 'دائن', date: '2026-03-15' },
        { id: 9, notes: 'شراء أثاث مكتبي', value: 67000, entry_type: 'مدين', date: '2026-03-18' },
        { id: 10, notes: 'تسوية عهدة موظف', value: 12000, entry_type: 'تسوية', date: '2026-03-22' },
        { id: 11, notes: 'إيراد خدمات استشارية', value: 180000, entry_type: 'دائن', date: '2026-03-25' },
        { id: 12, notes: 'سداد قسط تأمين', value: 35000, entry_type: 'مدين', date: '2026-03-30' },
    ]
};

// Chart data for Dashboard
const CASH_FLOW_DATA = [
    { month: 'يناير', inflow: 520000, outflow: 380000 },
    { month: 'فبراير', inflow: 680000, outflow: 450000 },
    { month: 'مارس', inflow: 890000, outflow: 620000 },
    { month: 'أبريل', inflow: 750000, outflow: 510000 },
    { month: 'مايو', inflow: 920000, outflow: 680000 },
    { month: 'يونيو', inflow: 1050000, outflow: 720000 },
    { month: 'يوليو', inflow: 830000, outflow: 590000 },
    { month: 'أغسطس', inflow: 960000, outflow: 640000 },
    { month: 'سبتمبر', inflow: 1120000, outflow: 780000 },
    { month: 'أكتوبر', inflow: 870000, outflow: 550000 },
    { month: 'نوفمبر', inflow: 1040000, outflow: 700000 },
    { month: 'ديسمبر', inflow: 1280000, outflow: 850000 },
];

const ACCOUNT_DISTRIBUTION_DATA = [
    { name: 'البنك الأهلي', value: 1850000, color: '#06b6d4' },
    { name: 'الاستثمارات', value: 3200000, color: '#8b5cf6' },
    { name: 'المخزون', value: 1450000, color: '#10b981' },
    { name: 'البنك العربي', value: 720000, color: '#f59e0b' },
    { name: 'الرواتب', value: 560000, color: '#ec4899' },
    { name: 'أخرى', value: 823000, color: '#64748b' },
];
