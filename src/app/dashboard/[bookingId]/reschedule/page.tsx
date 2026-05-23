'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Plane, Calendar, CreditCard, Check, Loader2, AlertTriangle, Armchair, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatTime, formatDate, calculateDuration, cn } from '@/lib/utils';
import { SEAT_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';
import type { Flight, Booking, Seat, SeatClass } from '@/types';

export default function ReschedulePage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [altFlights, setAltFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [step, setStep] = useState<'select-flight' | 'select-seats'>('select-flight');

  useEffect(() => {
    async function fetch() {
      const { data: bData } = await supabase
        .from('bookings')
        .select('*, flight:flights(*), passengers(*, seat:seats(*))')
        .eq('id', bookingId)
        .single();

      if (bData) {
        const b = bData as unknown as Booking;
        setBooking(b);

        // Fetch alternative flights on the same route
        if (b.flight) {
          const { data: flights } = await supabase
            .from('flights')
            .select('*')
            .eq('origin_code', b.flight.origin_code)
            .eq('destination_code', b.flight.destination_code)
            .eq('status', 'scheduled')
            .neq('id', b.flight_id)
            .gt('departure_time', new Date().toISOString())
            .order('departure_time');

          if (flights) setAltFlights(flights);
        }
      }
      setLoading(false);
    }
    fetch();
  }, [bookingId, supabase]);

  const fetchSeatsForFlight = useCallback(async (flightId: string) => {
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number');
    if (data) setSeats(data);
  }, [supabase]);

  const handleSelectFlight = async (flight: Flight) => {
    setSelectedFlight(flight);
    await fetchSeatsForFlight(flight.id);
    setStep('select-seats');
  };

  const toggleSeat = (seat: Seat) => {
    if (!seat.is_available) return;
    if (seat.class !== booking?.booking_class) {
      toast.error(`Please select a ${booking?.booking_class} class seat`);
      return;
    }
    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(prev => prev.filter(id => id !== seat.id));
    } else {
      if (selectedSeats.length >= (booking?.passenger_count || 1)) {
        toast.error(`Select exactly ${booking?.passenger_count} seat(s)`);
        return;
      }
      setSelectedSeats(prev => [...prev, seat.id]);
    }
  };

  const handleReschedule = async () => {
    if (!booking || !selectedFlight || selectedSeats.length !== booking.passenger_count) {
      toast.error('Please select all seats');
      return;
    }

    setRescheduling(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data, error } = await supabase.rpc('reschedule_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_new_flight_id: selectedFlight.id,
      p_new_seat_ids: selectedSeats,
    });

    if (error) {
      toast.error(error.message || 'Failed to reschedule');
      setRescheduling(false);
      return;
    }

    toast.success('Booking rescheduled successfully!');
    router.push('/dashboard');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center text-slate-400">Booking not found</div>;

  const currentFlight = booking.flight;
  const currentPrice = booking.total_amount;

  // Parse seat for grid display
  const parseSeat = (seatNum: string) => {
    const row = parseInt(seatNum.replace(/\D/g, ''));
    const col = seatNum.replace(/\d/g, '');
    return { row, col };
  };

  const groupByRow = (classSeats: Seat[]) => {
    const rows: Record<number, Seat[]> = {};
    classSeats.forEach(s => {
      const { row } = parseSeat(s.seat_number);
      if (!rows[row]) rows[row] = [];
      rows[row].push(s);
    });
    return Object.entries(rows).sort(([a], [b]) => parseInt(a) - parseInt(b));
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => step === 'select-seats' ? setStep('select-flight') : router.push('/dashboard')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {step === 'select-seats' ? 'Back to Flight Selection' : 'Back to Dashboard'}
        </button>

        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-amber-400" />
          Reschedule Booking
        </h1>
        <p className="text-sm text-slate-400 mb-6">PNR: {booking.pnr_code}</p>

        {/* Current Booking Summary */}
        {currentFlight && (
          <div className="glass-card rounded-2xl p-5 mb-6 border-amber-500/20">
            <p className="text-xs text-amber-400 font-medium mb-2">Current Flight</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-bold text-white">{currentFlight.origin_code}</p>
                <p className="text-xs text-slate-500">{formatTime(currentFlight.departure_time)}</p>
              </div>
              <Plane className="w-4 h-4 text-slate-600 -rotate-12" />
              <div className="text-center">
                <p className="font-bold text-white">{currentFlight.destination_code}</p>
                <p className="text-xs text-slate-500">{formatTime(currentFlight.arrival_time)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-white">{formatDate(currentFlight.departure_time)}</p>
                <p className="text-xs text-slate-500">{currentFlight.flight_number}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'select-flight' && (
          <>
            <h2 className="text-lg font-semibold text-white mb-4">Available Alternative Flights</h2>
            {altFlights.length === 0 ? (
              <div className="text-center py-16">
                <Plane className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">No alternative flights available on this route</p>
              </div>
            ) : (
              <div className="space-y-4">
                {altFlights.map((f) => {
                  const newPrice = booking.booking_class === 'first' ? f.price_first * booking.passenger_count
                    : booking.booking_class === 'business' ? f.price_business * booking.passenger_count
                    : f.price_economy * booking.passenger_count;
                  const fee = Math.max(0, newPrice - currentPrice);

                  return (
                    <div key={f.id} className="glass-card rounded-2xl p-5 hover:border-white/20 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{formatTime(f.departure_time)}</p>
                            <p className="text-blue-400 text-sm">{f.origin_code}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-600">{calculateDuration(f.departure_time, f.arrival_time)}</p>
                            <div className="w-20 h-[1px] bg-slate-700" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{formatTime(f.arrival_time)}</p>
                            <p className="text-cyan-400 text-sm">{f.destination_code}</p>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-white">{f.airline}</p>
                            <p className="text-xs text-slate-500">{f.flight_number} • {formatDate(f.departure_time)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{formatPrice(newPrice)}</p>
                            {fee > 0 ? (
                              <p className="text-xs text-amber-400">+{formatPrice(fee)} fee</p>
                            ) : (
                              <p className="text-xs text-emerald-400">No extra fee</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleSelectFlight(f)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 'select-seats' && selectedFlight && (
          <>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Armchair className="w-5 h-5 text-blue-400" />
              Select New Seats for {selectedFlight.flight_number}
            </h2>

            {/* Legend */}
            <div className="flex gap-4 mb-4 p-3 glass rounded-xl">
              <div className="flex items-center gap-2 text-sm"><div className="w-5 h-5 rounded seat-available" /><span className="text-slate-400">Available</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-5 h-5 rounded seat-booked" /><span className="text-slate-400">Booked</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-5 h-5 rounded seat-selected" /><span className="text-slate-400">Selected</span></div>
            </div>

            <div className="glass-card rounded-2xl p-6 mb-6 overflow-x-auto">
              {/* Only show seats for the booking class */}
              {(() => {
                const cls = booking.booking_class as SeatClass;
                const config = SEAT_CONFIG[cls];
                const classSeats = seats.filter(s => s.class === cls);
                const rows = groupByRow(classSeats);
                const colLayout = cls === 'first' ? ['A', 'B', '|', 'E', 'F'] : ['A', 'B', 'C', '|', 'D', 'E', 'F'];

                return (
                  <div>
                    <div className={cn('text-center py-2 mb-4 rounded-lg border', config.bgColor, config.borderColor)}>
                      <span className={cn('text-sm font-semibold', config.textColor)}>{config.label}</span>
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      <div className="w-8" />
                      {colLayout.map((col, i) => col === '|' ? <div key={i} className="w-6" /> : <div key={col} className="w-10 text-center text-xs text-slate-600">{col}</div>)}
                    </div>
                    {rows.map(([rowNum, rowSeats]) => (
                      <div key={rowNum} className="flex justify-center gap-1 mb-1">
                        <div className="w-8 flex items-center justify-center text-xs text-slate-600">{rowNum}</div>
                        {colLayout.map((col, i) => {
                          if (col === '|') return <div key={`a-${rowNum}-${i}`} className="w-6" />;
                          const seat = rowSeats.find(s => s.seat_number === `${rowNum}${col}`);
                          if (!seat) return <div key={`e-${rowNum}-${col}`} className="w-10 h-10" />;
                          const isSelected = selectedSeats.includes(seat.id);
                          return (
                            <button key={seat.id} onClick={() => toggleSeat(seat)} disabled={!seat.is_available}
                              className={cn('seat w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium',
                                isSelected ? 'seat-selected' : seat.is_available ? 'seat-available' : 'seat-booked')}>
                              {isSelected ? <Check className="w-4 h-4" /> : seat.is_available ? col : <X className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <p className="text-sm text-slate-400 mb-4 text-center">{selectedSeats.length}/{booking.passenger_count} seats selected</p>

            <button
              onClick={handleReschedule}
              disabled={selectedSeats.length !== booking.passenger_count || rescheduling}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {rescheduling ? <><Loader2 className="w-5 h-5 animate-spin" /> Rescheduling...</> : <><RefreshCw className="w-5 h-5" /> Confirm Reschedule</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
