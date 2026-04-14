import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Landmark, Mail, Loader, MailCheck, ArrowRight } from 'lucide-react';

function AuthOrbs() {
  return (
    <>
      <div className="gradient-orb animate-pulse-glow" style={{ width: 500, height: 500, background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', top: -150, left: -150 }} />
      <div className="gradient-orb animate-pulse-glow" style={{ width: 400, height: 400, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', bottom: -100, right: -100, animationDelay: '2s' }} />
    </>
  );
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await resetPassword(email);
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="auth-bg">
        <AuthOrbs />
        <div className="auth-card text-center">
          <div className="success-pop w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center">
            <MailCheck size={30} color="#22d3ee" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">تم إرسال رابط الاستعادة</h2>
          <p className="text-[13px] text-surface-400 mb-2 leading-relaxed">إذا كان هناك حساب مرتبط بالبريد الإلكتروني</p>
          <p className="text-[13px] text-primary-400 font-semibold mb-4" dir="ltr">{email}</p>
          <p className="text-[12px] text-surface-500 mb-6">فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه. يرجى مراجعة بريدك الوارد ومجلد الرسائل غير المرغوبة.</p>
          <button className="auth-btn" onClick={() => navigate('/login')}>العودة لتسجيل الدخول</button>
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
        <h2 className="text-center text-xl font-bold text-white mb-1">استعادة كلمة المرور</h2>
        <p className="text-center text-[12px] text-surface-400 mb-6">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-surface-400 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Mail size={15} color="#475569" /></div>
              <input className="auth-input" style={{ paddingRight: '40px' }} type="email" placeholder="أدخل بريدك الإلكتروني المسجل" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size={16} color="white" className="animate-spin" />جاري الإرسال...
              </span>
            ) : 'إرسال رابط الاستعادة'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <span className="auth-link flex items-center justify-center gap-1" onClick={() => navigate('/login')}>
            <ArrowRight size={13} color="#22d3ee" /> العودة لتسجيل الدخول
          </span>
        </div>
      </div>
    </div>
  );
}
