'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Sparkles,
  Check,
  ArrowLeft,
  Zap,
  Crown,
  Star,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    icon: <Zap size={20} />,
    credits: 10,
    hint: '10 images',
    features: [
      '10 credits/month',
      '1 credit per image (2K)',
      'Watermark on outputs',
      'Community support',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Creator',
    price: '$15',
    period: '/month',
    icon: <Star size={20} />,
    credits: 50,
    hint: '50 images or 16 videos',
    features: [
      '50 credits/month',
      '1 credit per image (2K or 4K)',
      '3 credits per 5s video',
      'No watermark',
      'All presets & styles',
    ],
    cta: 'Upgrade to Creator',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$35',
    period: '/month',
    icon: <Crown size={20} />,
    credits: 150,
    hint: '150 images or 50 videos',
    features: [
      '150 credits/month',
      '1 credit per image (2K or 4K)',
      '3–5 credits per video',
      'No watermark',
      'All presets & styles',
      'Priority queue',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Studio',
    price: '$99',
    period: '/month',
    icon: <Sparkles size={20} />,
    credits: 500,
    hint: '500 images or 166 videos',
    features: [
      '500 credits/month',
      '1 credit per image (2K or 4K)',
      '3–5 credits per video',
      'No watermark',
      'All presets & styles',
      'Priority queue',
      'Early access to new features',
    ],
    cta: 'Upgrade to Studio',
    highlighted: false,
  },
];

export default function PricingPage() {
  const { user, loading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planName: string) => {
    if (planName === 'Free' || !user) return;
    setLoadingPlan(planName);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName.toLowerCase() }),
      });

      if (res.status === 503) {
        alert('Billing is not configured yet. Please check back later.');
        return;
      }

      if (!res.ok) throw new Error('Failed to create checkout');
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch {
      console.error('Checkout failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleTopUp = async (credits: number) => {
    if (!user) return;
    setLoadingPlan(`topup-${credits}`);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: `topup-${credits}` }),
      });

      if (res.status === 503) {
        alert('Billing is not configured yet. Please check back later.');
        return;
      }

      if (!res.ok) throw new Error('Failed to create checkout');
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch {
      console.error('Top-up failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          href="/app"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft size={16} /> Back to app
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Choose your plan
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Get more credits to create stunning virtual try-ons and videos.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                plan.highlighted
                  ? 'border-black shadow-xl scale-105'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-black text-white text-center text-xs font-bold py-2 uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      plan.highlighted
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-400 mb-6">{plan.hint}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check size={16} className="text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={plan.name === 'Free' || loadingPlan === plan.name}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? 'bg-black text-white hover:bg-gray-800'
                      : plan.name === 'Free'
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {loadingPlan === plan.name ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credit Packs */}
        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Need more credits?
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Buy credit top-ups anytime without changing your plan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { credits: 15, price: '$6', hint: '15 images or 5 videos' },
              { credits: 50, price: '$18', hint: '50 images or 16 videos' },
              { credits: 150, price: '$49', hint: '150 images or 50 videos' },
              { credits: 500, price: '$140', hint: '500 images or 166 videos' },
            ].map((pack) => (
              <button
                key={pack.credits}
                onClick={() => handleTopUp(pack.credits)}
                disabled={loadingPlan === `topup-${pack.credits}`}
                className="px-6 py-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50 text-left min-w-[140px]"
              >
                {loadingPlan === `topup-${pack.credits}` ? (
                  <Loader2 size={16} className="animate-spin mx-auto mb-1" />
                ) : (
                  <div className="text-lg font-bold text-gray-900">
                    {pack.credits} credits
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-700">{pack.price}</div>
                <div className="text-xs text-gray-400 mt-1">{pack.hint}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
