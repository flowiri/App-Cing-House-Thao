import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Store } from 'lucide-react';

interface LoginViewProps {
  authError: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginView({ authError, onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onLogin(email, password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleError = formError ?? authError;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased flex items-center justify-center p-4">
      <section className="w-full max-w-[420px] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-[#ffeae0] text-[#9d4300] flex items-center justify-center">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              OrderHub <span className="text-[#f97316]">F&B</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Terminal Login</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#f97316] focus:bg-white focus:ring-4 focus:ring-orange-100"
                placeholder="admin@cinghouse.vn"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#f97316] focus:bg-white focus:ring-4 focus:ring-orange-100"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {visibleError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {visibleError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#f97316] text-white px-5 py-3 text-sm font-black shadow-sm hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  );
}
