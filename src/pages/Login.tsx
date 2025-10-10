import React, { useState } from 'react';
import { Sun, Mail, Lock, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (error: any) {
      showToast(error.message || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00A86B] via-[#0077B6] to-[#005F8F] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00A86B]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-2xl blur-lg opacity-75" />
              <div className="relative p-4 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-2xl shadow-xl">
                <Sun className="text-white" size={48} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quantum Solar Energy</h1>
            <p className="text-gray-600">Content Management System</p>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-[#00A86B]/5 to-[#0077B6]/5 rounded-lg border border-[#00A86B]/20">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Zap size={16} className="text-[#FFD700]" />
              <span className="font-medium">Welcome back!</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
          {t('manage_your_content')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-medium shadow-lg hover:shadow-xl"
            >
            {loading ? t('sign_in') + '...' : t('sign_in')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Powered by sustainable energy and innovation
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-white/80 text-sm">
          © 2025 Quantum Trading co — All rights reserved.
        </div>
      </div>
    </div>
  );
};
