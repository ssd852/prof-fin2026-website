import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Landmark, Mail, Lock, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

function AuthOrbs() {
  return (
    <>
      <div className="gradient-orb animate-pulse-glow" style={{ width: 500, height: 500, background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', top: -150, left: -150 }} />
      <div className="gradient-orb animate-pulse-glow" style={{ width: 400, height: 400, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', bottom: -100, right: -100, animationDelay: '2s' }} />
      <div className="gradient-orb animate-pulse-glow" style={{ width: 300, height: 300, background: 'linear-gradient(135deg,#10b981,#06b6d4)', top: '40%', right: -80, animationDelay: '4s' }} />
    </>
  );
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const { error } = await signIn(email, pass);
    if (error) {
      setErr(error.message);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <AuthOrbs />
      <div className={`auth-card ${shake ? 'auth-shake' : ''}`}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Landmark size={24} color="white" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-white mb-1">المحاسب الذكي</h2>
        <p className="text-center text-[12px] text-surface-400 mb-6">تسجيل الدخول إلى حسابك</p>

        {err && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/[0.08] border border-red-500/[0.15] text-red-400 text-[12px] font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle size={14} color="#f87171" />{err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail size={15} color="#475569" />
              </div>
              <input
                className="auth-input"
                style={{ paddingRight: '40px' }}
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={15} color="#475569" />
              </div>
              <input
                className="auth-input"
                style={{ paddingRight: '40px', paddingLeft: '40px' }}
                type={showPass ? 'text' : 'password'}
                placeholder="أدخل كلمة المرور"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
              />
              <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 btn-icon" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={15} color="#475569" /> : <Eye size={15} color="#475569" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <span className="auth-link" onClick={() => navigate('/forgot-password')}>نسيت كلمة المرور؟</span>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size={16} color="white" className="animate-spin" />جاري تسجيل الدخول...
              </span>
            ) : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="auth-divider">أو</div>

        <p className="text-center text-[12.5px] text-surface-400">
          ليس لديك حساب؟{' '}
          <span className="auth-link" onClick={() => navigate('/register')}>إنشاء حساب جديد</span>
        </p>
      </div>
    </div>
  );
}
