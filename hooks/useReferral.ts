'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Referral, ReferralStats } from '@/services/referralService';

/* ——————————————————————————————————————————————————————————
 * useReferral — Fetches and manages referral data
 * —————————————————————————————————————————————————————————— */

interface UseReferralReturn {
  code: string | null;
  referralLink: string | null;
  stats: ReferralStats | null;
  history: Referral[];
  isLoading: boolean;
  error: string | null;
  isCopied: boolean;
  copyLink: () => void;
  refresh: () => void;
}

export function useReferral(): UseReferralReturn {
  const [code, setCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReferralData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/referral');
      if (!res.ok) throw new Error('Failed to fetch referral data');
      const data = await res.json();
      setCode(data.code ?? null);
      setReferralLink(data.referralLink ?? null);
      setStats(data.stats ?? null);
      setHistory(data.history ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const copyLink = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setIsCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    });
  }, [referralLink]);

  return {
    code,
    referralLink,
    stats,
    history,
    isLoading,
    error,
    isCopied,
    copyLink,
    refresh: fetchReferralData,
  };
}
