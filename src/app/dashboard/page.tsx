'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, Plane, Calendar, Users, CreditCard, Trash2, RefreshCw, Eye, AlertTriangle, Loader2, WifiOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/useUserStore';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants';
import { formatPrice, formatTime, formatDate, isDepartureWithinHours, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Booking, BookingStatus } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { cachedBookings, setCachedBookings } = useUserStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!navigator.onLine) {
      setBookings(cachedBookings);
      setIsOffline(true);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('bookings')
      .select('*, flight:flights(*), passengers(*, seat:seats(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const typedBookings = data as unknown as Booking[];
      setBookings(typedBookings);
      setCachedBookings(typedBookings);
    }
    setLoading(false);
  }, [supabase, cachedBookings, setCachedBookings]);

  useEffect(() => {
    fetchBookings();
    const handleOnline = () => { setIsOffline(false); fetchBookings(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    });

    if (error) {
      toast.error(error.message || 'Failed to cancel booking');
    } else {
      toast.success('Booking cancelled successfully');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b));
    }
    setCancellingId(null);
    setShowCancelDialog(null);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    rescheduled: bookings.filter(b => b.status === 'rescheduled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Offline Banner */}
        {isOffline && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2 animate-slide-down">
            <WifiOff className="w-4 h-4" />
            You&apos;re offline. Showing cached bookings.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-blue-400" />
              My Bookings
            </h1>
            <p className="text-sm text-slate-400">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
          >
            Book a Flight
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'confirmed', 'cancelled', 'rescheduled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                filter === f
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              )}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <Plane className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-400 mb-2">No Bookings Yet</h2>
            <p className="text-slate-500 mb-6">Book your first flight to get started!</p>
            <Link href="/" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl inline-block">
              Search Flights
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking, i) => {
              const statusConfig = BOOKING_STATUS_CONFIG[booking.status];
              const flight = booking.flight;
              const canCancel = booking.status === 'confirmed' && flight && !isDepartureWithinHours(flight.departure_time, 2);
              const tooLateToCancel = booking.status === 'confirmed' && flight && isDepartureWithinHours(flight.departure_time, 2);

              return (
                <div
                  key={booking.id}
                  className="glass-card rounded-2xl p-6 animate-slide-up opacity-0"
                  style={{ animationFillMode: 'forwards', animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: PNR + Status */}
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">PNR</p>
                        <p className="text-xl font-mono font-bold text-white tracking-wider">{booking.pnr_code}</p>
                      </div>
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusConfig.color)}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>

                    {/* Middle: Flight Info */}
                    {flight && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-white">{flight.origin_code}</p>
                          <p className="text-xs text-slate-500">{formatTime(flight.departure_time)}</p>
                        </div>
                        <Plane className="w-4 h-4 text-blue-400 -rotate-12" />
                        <div>
                          <p className="font-semibold text-white">{flight.destination_code}</p>
                          <p className="text-xs text-slate-500">{formatTime(flight.arrival_time)}</p>
                        </div>
                        <div className="ml-4 text-sm text-slate-400">
                          <p>{formatDate(flight.departure_time)}</p>
                          <p className="text-xs">{flight.airline}</p>
                        </div>
                      </div>
                    )}

                    {/* Right: Price + Actions */}
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-white">{formatPrice(booking.total_amount)}</p>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/${booking.id}`}
                          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {booking.status === 'confirmed' && (
                          <Link
                            href={`/dashboard/${booking.id}/reschedule`}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Reschedule"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Link>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => tooLateToCancel ? toast.error('Cannot cancel within 2 hours of departure') : setShowCancelDialog(booking.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title={tooLateToCancel ? 'Too late to cancel' : 'Cancel'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cancel Confirmation Dialog */}
                  {showCancelDialog === booking.id && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-scale-in">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-red-400 mb-1">Cancel this booking?</p>
                          <p className="text-sm text-slate-400 mb-3">This action cannot be undone. Your seats will be released.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {cancellingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              Cancel Booking
                            </button>
                            <button
                              onClick={() => setShowCancelDialog(null)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                            >
                              Keep Booking
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
