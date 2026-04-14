import { Landmark, LayoutDashboard, Wallet, Users, Truck, Briefcase, Receipt, ShoppingCart, FileCheck, BookOpen, BarChart3, UtensilsCrossed, Command, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SCHEMAS } from '../data/schemas';

const iconMap = {
  'LayoutDashboard': LayoutDashboard,
  'Wallet': Wallet,
  'Users': Users,
  'Truck': Truck,
  'Briefcase': Briefcase,
  'Receipt': Receipt,
  'ShoppingCart': ShoppingCart,
  'FileCheck': FileCheck,
  'BookOpen': BookOpen,
  'UtensilsCrossed': UtensilsCrossed,
  'BarChart3': BarChart3,
};

export default function Sidebar({ active, onNav, isOpen, onClose }) {
  const { user, signOut, role } = useAuth();
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'المستخدم';

  const items = [
    { key: 'dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard' },
    ...Object.entries(SCHEMAS).map(([k, s]) => ({ key: k, label: s.name, icon: s.icon })),
    { key: 'pnl', label: 'الأرباح والخسائر', icon: 'BarChart3' },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />}
      <aside className={`sidebar fixed md:relative right-0 top-0 bottom-0 w-56 z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Landmark size={16} color="white" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-white">المحاسب الذكي</h1>
              <p className="text-[9px] text-surface-500">منصة المحاسبة والإدارة المالية</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const IconComp = iconMap[item.icon] || Wallet;
            return (
              <div
                key={item.key}
                className={`sidebar-item ${active === item.key ? 'active' : ''}`}
                onClick={() => { onNav(item.key); onClose(); }}
              >
                <IconComp size={15} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="p-2.5 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <User size={13} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{fullName}</p>
              <p className="text-[9px] text-surface-500 truncate">{user?.email}</p>
            </div>
            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              role === 'مدير' ? 'bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/[0.15]' :
              role === 'محاسب' ? 'bg-amber-500/[0.12] text-amber-400 border border-amber-500/[0.15]' :
              'bg-violet-500/[0.12] text-violet-400 border border-violet-500/[0.15]'
            }`}>{role}</span>
          </div>
          <div className="sidebar-item text-[11px] text-surface-500" onClick={() => document.dispatchEvent(new CustomEvent('openCmd'))}>
            <Command size={13} />
            <span>Ctrl+K بحث سريع</span>
          </div>
          <div className="sidebar-item text-[11px] text-red-400/70 hover:text-red-400" onClick={signOut}>
            <LogOut size={13} />
            <span>تسجيل الخروج</span>
          </div>
        </div>
      </aside>
    </>
  );
}
