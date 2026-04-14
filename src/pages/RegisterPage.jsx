import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Landmark, User, Mail, Lock, ShieldCheck, Loader, AlertCircle, CheckCircle } from 'lucide-react';

function AuthOrbs() {
  return (
    <>
      <div className="gradient-orb animate-pulse-glow" style={{ width: 500, height: 500, background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', top: -150, left: -150 }} />
      <div className="gradient-orb animate-pulse-glow" style={{ width: 400, height: 400, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', bottom: -100, right: -100, animationDelay: '2s' }} />
      <div className="gradient-orb animate-pulse-glow" style={{ width: 300, height: 300, background: 'linear-gradient(135deg,#10b981,#06b6d4)', top: '40%', right: -80, animationDelay: '4s' }} />
    </>
  );
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (pass !== confirmPass) { setErr('كلمات المرور غير متطابقة'); return; }
    if (pass.length < 6) { setErr('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    const { error } = await signUp(email, pass, fullName);
    if (error) { setErr(error.message); }
    else { setSuccess(true); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-bg">
        <AuthOrbs />
        <div className="auth-card text-center">
          <div className="success-pop w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-primary-500/20 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={32} color="#34d399" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">تم إنشاء الحساب بنجاح!</h2>
          <p className="text-[13px] text-surface-400 mb-6">
            تم إرسال رابط التفعيل إلى بريدك الإلكتروني.<br />
            يرجى تفعيل حسابك ثم تسجيل الدخول.
          </p>
          <button className="auth-btn" onClick={() => navigate('/login')}>
            الانتقال لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <AuthOrbs />
      <div className="auth-card">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Landmark size={24} color="white" />
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-white mb-1">إنشاء حساب جديد</h2>
        <p className="text-center text-[12px] text-surface-400 mb-6">انضم إلى المحاسب الذكي وابدأ إدارة أعمالك</p>

        {err && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/[0.08] border border-red-500/[0.15] text-red-400 text-[12px] font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle size={14} color="#f87171" />{err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">الاسم الكامل</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><User size={15} color="#475569" /></div>
              <input className="auth-input" style={{ paddingRight: '40px' }} placeholder="أدخل اسمك الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Mail size={15} color="#475569" /></div>
              <input className="auth-input" style={{ paddingRight: '40px' }} type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Lock size={15} color="#475569" /></div>
              <input className="auth-input" style={{ paddingRight: '40px' }} type="password" placeholder="أنشئ كلمة مرور قوية" value={pass} onChange={(e) => setPass(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">تأكيد كلمة المرور</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><ShieldCheck size={15} color="#475569" /></div>
              <input className="auth-input" style={{ paddingRight: '40px' }} type="password" placeholder="أعد كتابة كلمة المرور" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size={16} color="white" className="animate-spin" />جاري إنشاء الحساب...
              </span>
            ) : 'إنشاء حساب'}
          </button>
        </form>

        <div className="auth-divider">أو</div>
        <p className="text-center text-[12.5px] text-surface-400">
          لديك حساب بالفعل؟{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>تسجيل الدخول</span>
        </p>
      </div>
    </div>
  );
}
