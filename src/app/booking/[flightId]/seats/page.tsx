'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Check, X, Armchair } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/stores/useFlightStore';
import { SEAT_CONFIG } from '@/lib/constants';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import type { Seat, SeatClass } from '@/types';

// ============================================================
// Throttle utility: batches rapid-fire Realtime events so React
// only re-renders the seat grid at most once every `delayMs`.
// Prevents layout thrashing on busy flights.
// ============================================================
function useThrottledCallback<T>(callback: (items: T[]) => void, delayMs: number) {
  const bufferRef = useRef<T[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (bufferRef.current.length > 0) {
      callback([...bufferRef.current]);
      bufferRef.current = [];
    }
    timerRef.current = null;
  }, [callback]);

  const push = useCallback((item: T) => {
    bufferRef.current.push(item);
    if (!timerRef.current) {
      timerRef.current = setTimeout(flush, delayMs);
    }
  }, [flush, delayMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return push;
}

// ============================================================
// Inner seat map component (wrapped by ErrorBoundary)
// ============================================================
function SeatMapInner({ flightId }: { flightId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { selectedClass, passengers, searchParams, selectedSeats, setSelectedSeats } = useFlightStore();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedSeats);
  // ✅ OPTIMISTIC UI: track seats with pending optimistic state
  const [optimisticSeats, setOptimisticSeats] = useState<Set<string>>(new Set());
  const passengerCount = searchParams?.passengerCount || passengers.length || 1;

  // Fetch seats
  const fetchSeats = useCallback(async () => {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number');
    if (data && !error) setSeats(data);
    setLoading(false);
  }, [flightId, supabase]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // ✅ THROTTLED REALTIME: batch seat updates, max once per 200ms
  const applyBatchedUpdates = useCallback((payloads: Record<string, unknown>[]) => {
    setSeats(prev => {
      const updated = [...prev];
      for (const payload of payloads) {
        const idx = updated.findIndex(s => s.id === (payload as unknown as Seat).id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], ...payload } as Seat;
        }
      }
      return updated;
    });

    // If someone booked a seat we selected, evict it
    for (const payload of payloads) {
      const newSeat = payload as unknown as Seat;
      if (!newSeat.is_available) {
        setLocalSelected(prev => {
          if (prev.includes(newSeat.id)) {
            toast.error(`Seat ${newSeat.seat_number} was just booked by another passenger`);
            return prev.filter(id => id !== newSeat.id);
          }
          return prev;
        });
        // Clear optimistic state for this seat
        setOptimisticSeats(prev => {
          const next = new Set(prev);
          next.delete(newSeat.id);
          return next;
        });
      }
    }
  }, []);

  const throttledPush = useThrottledCallback(applyBatchedUpdates, 200);

  useEffect(() => {
    const channel = supabase
      .channel(`seats-${flightId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'seats',
        filter: `flight_id=eq.${flightId}`,
      }, (payload) => {
        throttledPush(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [flightId, supabase, throttledPush]);

  // ✅ OPTIMISTIC UI: toggle seat instantly, revert on failure
  const toggleSeat = (seat: Seat) => {
    if (!seat.is_available && !optimisticSeats.has(seat.id)) return;
    if (seat.class !== selectedClass) {
      toast.error(`Please select a ${selectedClass} class seat`);
      return;
    }

    if (localSelected.includes(seat.id)) {
      setLocalSelected(prev => prev.filter(id => id !== seat.id));
    } else {
      if (localSelected.length >= passengerCount) {
        toast.error(`You can only select ${passengerCount} seat${passengerCount > 1 ? 's' : ''}`);
        return;
      }
      setLocalSelected(prev => [...prev, seat.id]);
    }
  };

  const handleConfirmBooking = async () => {
    if (localSelected.length !== passengerCount) {
      toast.error(`Please select exactly ${passengerCount} seat${passengerCount > 1 ? 's' : ''}`);
      return;
    }

    setBooking(true);

    // ✅ OPTIMISTIC: immediately mark selected seats as "optimistically booked"
    setOptimisticSeats(new Set(localSelected));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to book');
      setOptimisticSeats(new Set());
      router.push('/login');
      return;
    }

    // Map passengers to seats
    const passengersWithSeats = passengers.map((p, i) => ({
      full_name: p.full_name,
      passport_number: p.passport_number,
      nationality: p.nationality,
      seat_id: localSelected[i],
    }));

    const { data, error } = await supabase.rpc('reserve_seats', {
      p_flight_id: flightId,
      p_user_id: user.id,
      p_passengers: passengersWithSeats,
      p_seat_ids: localSelected,
      p_booking_class: selectedClass,
    });

    if (error) {
      // ✅ OPTIMISTIC REVERT: RPC failed, revert the optimistic state
      toast.error(error.message || 'Failed to book. Seats may have been taken.');
      setOptimisticSeats(new Set());
      fetchSeats(); // Re-fetch true state from DB
      setBooking(false);
      return;
    }

    setSelectedSeats(localSelected);
    const result = data as { booking_id: string; pnr_code: string };
    toast.success('Booking confirmed!');
    router.push(`/booking/${flightId}/confirm?pnr=${result.pnr_code}&bookingId=${result.booking_id}`);
  };

  // Group seats by class
  const seatsByClass = {
    first: seats.filter(s => s.class === 'first'),
    business: seats.filter(s => s.class === 'business'),
    economy: seats.filter(s => s.class === 'economy'),
  };

  // Parse seat into row and col
  const parseSeat = (seatNum: string) => {
    const row = parseInt(seatNum.replace(/\D/g, ''));
    const col = seatNum.replace(/\d/g, '');
    return { row, col };
  };

  // Group seats by row
  const groupByRow = (classSeats: Seat[]) => {
    const rows: Record<number, Seat[]> = {};
    classSeats.forEach(s => {
      const { row } = parseSeat(s.seat_number);
      if (!rows[row]) rows[row] = [];
      rows[row].push(s);
    });
    return Object.entries(rows).sort(([a], [b]) => parseInt(a) - parseInt(b));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const selectedSeatObjects = seats.filter(s => localSelected.includes(s.id));
  const totalPrice = selectedSeatObjects.reduce((sum, s) => sum + Number(s.price), 0);

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Select Your Seats</h1>
            <p className="text-sm text-slate-400">Pick {passengerCount} {selectedClass} class seat{passengerCount > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 glass rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded seat-available" />
                <span className="text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded seat-booked" />
                <span className="text-slate-400">Booked</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded seat-selected" />
                <span className="text-slate-400">Your Selection</span>
              </div>
            </div>

            {/* Aircraft Cabin */}
            <div className="glass-card rounded-2xl p-6 overflow-x-auto">
              {/* Nose of the plane */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-8 bg-gradient-to-b from-blue-500/20 to-transparent rounded-t-full" />
              </div>

              {(['first', 'business', 'economy'] as SeatClass[]).map((cls) => {
                const config = SEAT_CONFIG[cls];
                const rows = groupByRow(seatsByClass[cls]);
                if (rows.length === 0) return null;

                const colLayout = cls === 'first' ? ['A', 'B', '|', 'E', 'F'] : ['A', 'B', 'C', '|', 'D', 'E', 'F'];

                return (
                  <div key={cls} className="mb-8">
                    {/* Class Header */}
                    <div className={cn('text-center py-2 mb-4 rounded-lg border', config.bgColor, config.borderColor)}>
                      <span className={cn('text-sm font-semibold', config.textColor)}>{config.label}</span>
                    </div>

                    {/* Column Headers */}
                    <div className="flex justify-center gap-1 mb-2">
                      <div className="w-8" />
                      {colLayout.map((col, i) => (
                        col === '|' ? (
                          <div key={`aisle-h-${i}`} className="w-6" />
                        ) : (
                          <div key={col} className="w-10 text-center text-xs text-slate-600 font-medium">{col}</div>
                        )
                      ))}
                    </div>

                    {/* Rows */}
                    {rows.map(([rowNum, rowSeats]) => (
                      <div key={rowNum} className="flex justify-center gap-1 mb-1">
                        <div className="w-8 flex items-center justify-center text-xs text-slate-600">{rowNum}</div>
                        {colLayout.map((col, i) => {
                          if (col === '|') {
                            return <div key={`aisle-${rowNum}-${i}`} className="w-6" />;
                          }
                          const seat = rowSeats.find(s => s.seat_number === `${rowNum}${col}`);
                          if (!seat) return <div key={`empty-${rowNum}-${col}`} className="w-10 h-10" />;

                          const isSelected = localSelected.includes(seat.id);
                          const isOptimistic = optimisticSeats.has(seat.id);
                          const isAllowedClass = seat.class === selectedClass;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat)}
                              disabled={(!seat.is_available && !isOptimistic) || booking}
                              title={`${seat.seat_number} - ${seat.is_available ? formatPrice(seat.price) : 'Booked'}`}
                              className={cn(
                                'seat w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                                isOptimistic
                                  ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 animate-pulse'
                                  : isSelected
                                    ? 'seat-selected'
                                    : seat.is_available
                                      ? isAllowedClass
                                        ? 'seat-available'
                                        : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                                      : 'seat-booked'
                              )}
                            >
                              {isOptimistic ? <Loader2 className="w-3 h-3 animate-spin" /> : isSelected ? <Check className="w-4 h-4" /> : seat.is_available ? seat.seat_number.slice(-1) : <X className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Armchair className="w-5 h-5 text-blue-400" />
                Booking Summary
              </h3>

              {/* Selected Seats */}
              <div className="space-y-3 mb-6">
                {passengers.map((p, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm font-medium text-white">{p.full_name || `Passenger ${i + 1}`}</p>
                    <p className="text-xs text-slate-500">
                      Seat: {localSelected[i]
                        ? seats.find(s => s.id === localSelected[i])?.seat_number || '—'
                        : <span className="text-amber-400">Not selected</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="border-t border-white/10 pt-4 mb-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>{passengerCount} × {selectedClass}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span className="gradient-text">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmBooking}
                disabled={localSelected.length !== passengerCount || booking}
                className="w-full py-3.5 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>
                ) : (
                  <><Check className="w-5 h-5" /> Confirm Booking</>
                )}
              </button>
              <p className="text-xs text-slate-600 text-center mt-3">
                {localSelected.length}/{passengerCount} seats selected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ✅ ERROR BOUNDARY: Wraps the seat map so a WebSocket disconnect
// or runtime error shows a recovery UI instead of a white screen.
// The navigation, flight details, and sidebar all keep working.
// ============================================================
export default function SeatSelectionPage({ params }: { params: Promise<{ flightId: string }> }) {
  const { flightId } = use(params);
  return (
    <ErrorBoundary>
      <SeatMapInner flightId={flightId} />
    </ErrorBoundary>
  );
}
