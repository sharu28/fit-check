'use client';

import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type InputMode = 'phone' | 'email';
type OAuthStrategy = 'oauth_google' | 'oauth_facebook';

type ClerkError = { errors?: { message: string; longMessage?: string }[] };

function getClerkErrorMessage(err: unknown): string {
  const clerkErr = err as ClerkError;
  return (
    clerkErr?.errors?.[0]?.longMessage ??
    clerkErr?.errors?.[0]?.message ??
    (err instanceof Error ? err.message : 'An error occurred')
  );
}

export default function AuthPage() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('login');
  const [inputMode, setInputMode] = useState<InputMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signInLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/auth/sso-callback',
        redirectUrlComplete: '/app',
      });
    } catch (err) {
      setError(getClerkErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const identifier = inputMode === 'phone' ? phone : email;
        const result = await signIn.create({ identifier, password });
        if (result.status === 'complete') {
          router.push('/app');
          router.refresh();
        }
      } else {
        if (inputMode === 'phone') {
          await signUp.create({ phoneNumber: phone, password });
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        } else {
          await signUp.create({ emailAddress: email, password });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        }
        setPendingVerification(true);
      }
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result =
        inputMode === 'phone'
          ? await signUp.attemptPhoneNumberVerification({ code: verificationCode })
          : await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === 'complete') {
        router.push('/app');
        router.refresh();
      }
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setPendingVerification(false);
    setVerificationCode('');
  };

  // OTP verification screen
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Verify your {inputMode === 'phone' ? 'phone' : 'email'}
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-gray-900">
              {inputMode === 'phone' ? phone : email}
            </span>
          </p>
          <form onSubmit={handleVerification} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
              maxLength={6}
              required
            />
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Verify <ArrowRight size={18} /></>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setPendingVerification(false); setVerificationCode(''); setError(null); }}
              className="w-full text-sm text-gray-500 hover:text-black font-medium"
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {mode === 'signup' ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-center text-gray-500 mb-6">
            {mode === 'signup'
              ? 'Start designing your virtual style.'
              : 'Sign in to access your designs.'}
          </p>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('oauth_google')}
              disabled={loading}
              className="w-full bg-white text-gray-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.3-.2-2H12z" />
                <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-4.9-1.8-5.7-4.2l-3.2 2.5C4.8 19.8 8.1 22 12 22z" />
                <path fill="#4A90E2" d="M6.3 14c-.2-.6-.3-1.3-.3-2L3.1 7.5C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.5L6.3 14z" />
                <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.9 14.7 2 12 2 8.1 2 4.8 4.2 3.1 7.5L6.3 10c.8-2.4 3-4.2 5.7-4.2z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('oauth_facebook')}
              disabled={loading}
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-[#1666d4] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Phone / Email tabs */}
          <div className="flex rounded-lg border border-gray-200 mb-4 overflow-hidden">
            <button
              type="button"
              onClick={() => { setInputMode('phone'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                inputMode === 'phone' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Phone size={13} />Phone
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('email'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                inputMode === 'email' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mail size={13} />Email
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {inputMode === 'phone' ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="+1 555 000 0000"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !signInLoaded || !signUpLoaded}
              className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => resetForm(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-gray-600 hover:text-black font-medium"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

