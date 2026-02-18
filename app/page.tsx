import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center">
            <Sparkles size={32} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Fit Check
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          AI-powered virtual try-on and style studio.
          See how any outfit looks on you before you buy.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
        >
          Get Started
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
