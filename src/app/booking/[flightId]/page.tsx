'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { User, CreditCard, Globe, ArrowRight, Plane, Clock, MapPin, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/stores/useFlightStore';
import { NATIONALITIES, SEAT_CONFIG } from '@/lib/constants';
import { formatPrice, formatTime, formatDate, calculateDuration, getClassLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Flight, SeatClass, PassengerInput } from '@/types';

export default function PassengerDetailsPage({ params }: { params: Promise<{ flightId: string }> }) {
  const { flightId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const {
    selectedFlight, setSelectedFlight,
    selectedClass, setSelectedClass,
    searchParams,
    passengers: storedPassengers, setPassengers,
  } = useFlightStore();

  const [flight, setFlight] = useState<Flight | null>(selectedFlight);
  const [loading, setLoading] = useState(!selectedFlight);
  const passengerCount = searchParams?.passengerCount || 1;

  const [passengers, setLocalPassengers] = useState<PassengerInput[]>(
    storedPassengers.length === passengerCount
      ? storedPassengers
      : Array.from({ length: passengerCount }, () => ({ full_name: '', passport_number: '', nationality: '' }))
  );

  useEffect(() => {
    if (!selectedFlight) {
      supabase.from('flights').select('*').eq('id', flightId).single()
        .then(({ data, error }) => {
          if (data && !error) { setFlight(data); setSelectedFlight(data); }
          setLoading(false);
        });
    }
  }, [flightId, selectedFlight, supabase, setSelectedFlight]);

  const updatePassenger = (index: number, field: keyof PassengerInput, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setLocalPassengers(updated);
  };

  const handleContinue = () => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.full_name || !p.passport_number || !p.nationality) {
        toast.error(`Please fill all details for Passenger ${i + 1}`);
        return;
      }
    }
    setPassengers(passengers);
    router.push(`/booking/${flightId}/seats`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <Plane className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl text-slate-400">Flight not found</h2>
        </div>
      </div>
    );
  }

  const classPrice = selectedClass === 'first' ? flight.price_first
    : selectedClass === 'business' ? flight.price_business : flight.price_economy;

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6 animate-slide-up">Passenger Details</h1>

        {/* Flight Summary */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">✈️</span>
            <div>
              <p className="font-semibold text-white">{flight.airline} • {flight.flight_number}</p>
              <p className="text-xs text-slate-500">{formatDate(flight.departure_time)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{formatTime(flight.departure_time)}</p>
              <p className="text-blue-400 font-semibold">{flight.origin_code}</p>
              <p className="text-xs text-slate-500">{flight.origin_city}</p>
            </div>
            <div className="flex-1 mx-4 flex items-center gap-1">
              <div className="h-[1px] flex-1 bg-slate-700" />
              <Clock className="w-3 h-3 text-slate-600" />
              <span className="text-xs text-slate-600">{calculateDuration(flight.departure_time, flight.arrival_time)}</span>
              <div className="h-[1px] flex-1 bg-slate-700" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{formatTime(flight.arrival_time)}</p>
              <p className="text-cyan-400 font-semibold">{flight.destination_code}</p>
              <p className="text-xs text-slate-500">{flight.destination_city}</p>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Select Class</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['economy', 'business', 'first'] as SeatClass[]).map((cls) => {
              const config = SEAT_CONFIG[cls];
              const price = cls === 'first' ? flight.price_first : cls === 'business' ? flight.price_business : flight.price_economy;
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                    selectedClass === cls
                      ? `${config.bgColor} ${config.borderColor} ${config.textColor}`
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  )}
                >
                  <p className="font-semibold text-sm mb-1">{config.label}</p>
                  <p className="text-lg font-bold text-white">{formatPrice(price)}</p>
                  <p className="text-xs opacity-60">per person</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Passenger Forms */}
        {passengers.map((p, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 mb-4 animate-slide-up"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Passenger {i + 1}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input
                  value={p.full_name}
                  onChange={(e) => updatePassenger(i, 'full_name', e.target.value)}
                  placeholder="As on passport"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Passport Number</label>
                <input
                  value={p.passport_number}
                  onChange={(e) => updatePassenger(i, 'passport_number', e.target.value.toUpperCase())}
                  placeholder="e.g. AB1234567"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nationality</label>
                <select
                  value={p.nationality}
                  onChange={(e) => updatePassenger(i, 'nationality', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:border-blue-500 outline-none transition-all [color-scheme:dark]"
                >
                  <option value="" className="bg-slate-900 text-slate-200">Select nationality</option>
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n} className="bg-slate-900 text-slate-200">{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {/* Total + Continue */}
        <div className="glass-card rounded-2xl p-6 mt-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm">Total for {passengerCount} passenger{passengerCount > 1 ? 's' : ''}</p>
              <p className="text-3xl font-bold text-white">{formatPrice(classPrice * passengerCount)}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{getClassLabel(selectedClass)}</p>
              <p>{formatPrice(classPrice)} × {passengerCount}</p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full py-3.5 bg-white text-slate-900 font-semibold rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-lg"
          >
            Continue to Seat Selection
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
