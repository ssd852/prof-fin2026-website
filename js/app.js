/* ===== Main Application ===== */

function App() {
    const [activeSection, setActiveSection] = React.useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const store = useDataStore();

    const toggleSidebar = () => setSidebarOpen(prev => !prev);
    const closeSidebar = () => setSidebarOpen(false);

    const renderPage = () => {
        if (activeSection === 'dashboard') {
            return React.createElement(DashboardPage, { store, onToggleSidebar: toggleSidebar });
        }
        return React.createElement(EntityPage, {
            key: activeSection,
            entityKey: activeSection,
            store,
            onToggleSidebar: toggleSidebar
        });
    };

    return React.createElement(ToastProvider, null,
        React.createElement('div', { className: 'flex h-screen overflow-hidden bg-surface-950 relative' },
            // Background decorations
            React.createElement('div', { className: 'gradient-orb gradient-orb-1 animate-pulse-glow' }),
            React.createElement('div', { className: 'gradient-orb gradient-orb-2 animate-pulse-glow', style: { animationDelay: '2s' } }),

            // Sidebar
            React.createElement(Sidebar, {
                activeSection,
                onNavigate: setActiveSection,
                isOpen: sidebarOpen,
                onClose: closeSidebar
            }),

            // Main Content
            React.createElement('main', { className: 'flex-1 overflow-y-auto p-6 md:p-8 bg-grid relative' },
                renderPage()
            )
        )
    );
}

// ===== Render =====
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
