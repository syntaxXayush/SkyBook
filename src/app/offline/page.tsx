'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Plane, CloudOff } from 'lucide-react';

/**
 * Custom Offline Fallback Page
 *
 * Shown when the service worker intercepts a navigation request
 * but the network is down and no cached version exists.
 *
 * Matches SkyBook's premium dark branding instead of the browser's
 * ugly default "No Internet" chrome page.
 */
export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Auto-redirect back after a beat
      setTimeout(() => window.location.reload(), 500);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    // Try to reach the server
    fetch('/', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        setRetrying(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#020617] bg-grid">
      <div className="max-w-md w-full text-center animate-scale-in">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-slate-500" />
          </div>
          {/* Airplane orbiting */}
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-float">
            <Plane className="w-5 h-5 text-blue-400 -rotate-45" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-slate-400 mb-2">
          It looks like your internet connection was lost.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Don&apos;t worry — your cached bookings are still available from the dashboard.
        </p>

        {/* Connection status indicator */}
        {online ? (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-2 animate-scale-in">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Back online! Redirecting...
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm flex items-center justify-center gap-2">
            <CloudOff className="w-4 h-4" />
            No internet connection detected
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Checking connection...' : 'Retry Connection'}
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-semibold rounded-xl text-center transition-all"
          >
            View Cached Bookings
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-10 text-slate-700 text-xs">
          SkyBook will automatically reconnect when your internet is restored.
        </p>
      </div>
    </div>
  );
}
