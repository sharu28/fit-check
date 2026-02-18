'use client';

import { useState, useEffect } from 'react';

export function useCredits(userId: string | null) {
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('free');

  useEffect(() => {
    if (!userId) return;

    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits');
        if (!res.ok) return;
        const data = await res.json();
        setCredits(data.credits);
        setPlan(data.plan || 'free');
      } catch (e) {
        console.error('Failed to fetch credits:', e);
      }
    };

    fetchCredits();
  }, [userId]);

  const refreshCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      if (!res.ok) return;
      const data = await res.json();
      setCredits(data.credits);
      setPlan(data.plan || 'free');
    } catch (e) {
      console.error('Failed to refresh credits:', e);
    }
  };

  return { credits, plan, refreshCredits };
}
