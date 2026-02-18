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
    features: [
      '10 credits/month',
      'Image generation (1K)',
      'Basic presets',
      'Community support',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    icon: <Star size={20} />,
    credits: 100,
    features: [
      '100 credits/month',
      'Image generation (up to 4K)',
      'Video generation (5s)',
      'All presets & styles',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$29',
    period: '/month',
    icon: <Crown size={20} />,
    credits: 500,
    features: [
      '500 credits/month',
      'Image generation (up to 4K)',
      'Video generation (10s)',
      'All presets & styles',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Upgrade to Premium',
    highlighted: false,
  },
];

export default function PricingPage() {
  const { user, loading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planName: string) => {
    if (planName === 'Free') return;
    setLoadingPlan(planName);
    // Polar checkout will be implemented when products are set up
    setTimeout(() => setLoadingPlan(null), 2000);
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
      <div className="max-w-5xl mx-auto">
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
        <div className="grid md:grid-cols-3 gap-6">
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

                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>

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
          <div className="flex justify-center gap-4">
            {[
              { credits: 50, price: '$5' },
              { credits: 150, price: '$12' },
              { credits: 500, price: '$35' },
            ].map((pack) => (
              <button
                key={pack.credits}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="text-lg font-bold text-gray-900">
                  {pack.credits} credits
                </div>
                <div className="text-sm text-gray-500">{pack.price}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
