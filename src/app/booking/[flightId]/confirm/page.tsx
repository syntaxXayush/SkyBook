'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Copy, Plane, Users, CreditCard, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/stores/useFlightStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatPrice, formatTime, formatDate, calculateDuration, getClassLabel } from '@/lib/utils';
import { toast } from 'sonner';
import type { Booking } from '@/types';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const pnr = searchParams.get('pnr') || '';
  const bookingId = searchParams.get('bookingId') || '';
  const supabase = createClient();
  const { resetBookingFlow } = useFlightStore();
  const { addCachedBooking } = useUserStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('bookings')
        .select('*, flight:flights(*), passengers(*, seat:seats(*))')
        .eq('id', bookingId)
        .single();
      if (data && !error) {
        setBooking(data as unknown as Booking);
        addCachedBooking(data as unknown as Booking);
      }
      setLoading(false);
      resetBookingFlow();
    }
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const copyPNR = () => {
    navigator.clipboard.writeText(pnr);
    setCopied(true);
    toast.success('PNR copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid bg-radial-glow">
      {/* Confetti effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e'][i % 5],
              animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s forwards`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6 animate-pulse-glow" style={{ '--tw-shadow-color': 'rgba(34,197,94,0.3)' } as React.CSSProperties}>
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Booking Confirmed!</h1>
          <p className="text-slate-400">Your flight has been successfully booked</p>
        </div>

        {/* PNR Card */}
        <div className="glass-card rounded-2xl p-8 text-center mb-6 animate-slide-up">
          <p className="text-sm text-slate-400 mb-2">Your PNR Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl md:text-5xl font-mono font-bold tracking-[0.3em] text-white">
              {pnr}
            </span>
            <button
              onClick={copyPNR}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Copy PNR"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-3">Save this code. You&apos;ll need it to manage your booking.</p>
        </div>

        {/* Flight Details */}
        {booking?.flight && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <Plane className="w-4 h-4" /> Flight Details
            </h3>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{formatTime(booking.flight.departure_time)}</p>
                <p className="text-blue-400 font-semibold">{booking.flight.origin_code}</p>
                <p className="text-xs text-slate-500">{booking.flight.origin_city}</p>
              </div>
              <div className="flex-1 mx-4 text-center">
                <p className="text-xs text-slate-600">{calculateDuration(booking.flight.departure_time, booking.flight.arrival_time)}</p>
                <div className="h-[1px] bg-slate-700 my-1" />
                <p className="text-xs text-slate-500">{booking.flight.airline} • {booking.flight.flight_number}</p>
                <p className="text-xs text-slate-600">{formatDate(booking.flight.departure_time)}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{formatTime(booking.flight.arrival_time)}</p>
                <p className="text-cyan-400 font-semibold">{booking.flight.destination_code}</p>
                <p className="text-xs text-slate-500">{booking.flight.destination_city}</p>
              </div>
            </div>
          </div>
        )}

        {/* Passengers */}
        {booking?.passengers && booking.passengers.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Passengers
            </h3>
            <div className="space-y-3">
              {booking.passengers.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">{p.full_name}</p>
                    <p className="text-xs text-slate-500">{p.nationality}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-400">Seat {p.seat?.seat_number || '—'}</p>
                    <p className="text-xs text-slate-500">{getClassLabel(booking.booking_class)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400">Total Paid</span>
            </div>
            <span className="text-2xl font-bold text-white">{formatPrice(booking?.total_amount || 0)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/dashboard"
            className="py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
          >
            View My Bookings
          </Link>
          <Link
            href="/"
            className="py-3.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-semibold rounded-xl text-center transition-all"
          >
            Book Another Flight
          </Link>
        </div>
      </div>
    </div>
  );
}
