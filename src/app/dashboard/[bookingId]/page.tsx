'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Plane, User, CreditCard, Clock, History, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants';
import { formatPrice, formatTime, formatDate, calculateDuration, getClassLabel, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Booking, Reschedule } from '@/types';

export default function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [reschedules, setReschedules] = useState<Reschedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data: bData } = await supabase
        .from('bookings')
        .select('*, flight:flights(*), passengers(*, seat:seats(*))')
        .eq('id', bookingId)
        .single();

      if (bData) setBooking(bData as unknown as Booking);

      const { data: rData } = await supabase
        .from('reschedules')
        .select('*, original_flight:flights!reschedules_original_flight_id_fkey(*), new_flight:flights!reschedules_new_flight_id_fkey(*)')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (rData) setReschedules(rData as unknown as Reschedule[]);
      setLoading(false);
    }
    fetch();
  }, [bookingId, supabase]);

  const copyPNR = () => {
    if (booking) navigator.clipboard.writeText(booking.pnr_code);
    setCopied(true);
    toast.success('PNR copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center text-slate-400">Booking not found</div>;

  const statusConfig = BOOKING_STATUS_CONFIG[booking.status];
  const flight = booking.flight;

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>

        {/* PNR Header */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">PNR Code</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-mono font-bold text-white tracking-wider">{booking.pnr_code}</span>
                <button onClick={copyPNR} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <span className={cn('px-4 py-1.5 rounded-full text-sm font-medium border', statusConfig.color)}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Flight Details */}
        {flight && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <Plane className="w-4 h-4" /> Flight Details
            </h3>
            <p className="text-sm text-slate-500 mb-3">{flight.airline} • {flight.flight_number}</p>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{formatTime(flight.departure_time)}</p>
                <p className="text-blue-400 font-semibold">{flight.origin_code}</p>
                <p className="text-xs text-slate-500">{flight.origin_city}, {flight.origin_country}</p>
              </div>
              <div className="flex-1 mx-6 text-center">
                <p className="text-xs text-slate-600">{calculateDuration(flight.departure_time, flight.arrival_time)}</p>
                <div className="h-[1px] bg-slate-700 my-1" />
                <p className="text-xs text-slate-500">{formatDate(flight.departure_time)}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{formatTime(flight.arrival_time)}</p>
                <p className="text-cyan-400 font-semibold">{flight.destination_code}</p>
                <p className="text-xs text-slate-500">{flight.destination_city}, {flight.destination_country}</p>
              </div>
            </div>
          </div>
        )}

        {/* Passengers */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Passengers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-white/10">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Passport</th>
                    <th className="pb-2">Nationality</th>
                    <th className="pb-2">Seat</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.passengers.map((p) => (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-3 text-white font-medium">{p.full_name}</td>
                      <td className="py-3 text-slate-400">{p.passport_number}</td>
                      <td className="py-3 text-slate-400">{p.nationality}</td>
                      <td className="py-3 text-blue-400 font-semibold">{p.seat?.seat_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{booking.passenger_count}× {getClassLabel(booking.booking_class)}</span>
              <span className="text-slate-300">{formatPrice(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2 mt-2">
              <span className="text-white">Total</span>
              <span className="gradient-text">{formatPrice(booking.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Reschedule History */}
        {reschedules.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Reschedule History
            </h3>
            <div className="space-y-3">
              {reschedules.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span>
                    {r.fee > 0 && <span className="text-xs text-amber-400">Fee: {formatPrice(r.fee)}</span>}
                  </div>
                  <p className="text-sm text-slate-300">
                    {r.original_flight?.flight_number} → {r.new_flight?.flight_number}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {booking.status === 'confirmed' && (
          <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Link
              href={`/dashboard/${booking.id}/reschedule`}
              className="py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold rounded-xl text-center hover:bg-amber-500/20 transition-all"
            >
              Reschedule
            </Link>
            <button
              onClick={() => router.push('/dashboard')}
              className="py-3 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
