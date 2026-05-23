'use client';

import { Plane, Clock, MapPin } from 'lucide-react';
import { Flight } from '@/types';
import { formatPrice, formatTime, calculateDuration } from '@/lib/utils';
import { AIRLINES } from '@/lib/constants';

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
}

export default function FlightCard({ flight, onSelect }: FlightCardProps) {
  const airline = AIRLINES[flight.airline] || { name: flight.airline, logo: '✈️' };
  const duration = calculateDuration(flight.departure_time, flight.arrival_time);

  return (
    <div className="glass-card rounded-2xl p-6 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 group">
      {/* Header: Airline Info */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{airline.logo}</span>
          <div>
            <h3 className="font-semibold text-white">{airline.name}</h3>
            <p className="text-xs text-slate-500">{flight.flight_number}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          {flight.status}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center justify-between mb-6">
        {/* Origin */}
        <div className="text-center flex-shrink-0">
          <p className="text-2xl font-bold text-white">{formatTime(flight.departure_time)}</p>
          <p className="text-lg font-semibold text-blue-400">{flight.origin_code}</p>
          <p className="text-xs text-slate-500">{flight.origin_city}</p>
          <p className="text-xs text-slate-600">{flight.origin_country}</p>
        </div>

        {/* Flight Path */}
        <div className="flex-1 mx-4 flex flex-col items-center">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
          <div className="w-full flex items-center gap-1">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-slate-600" />
            <Plane className="w-4 h-4 text-blue-400 -rotate-12 flex-shrink-0" />
            <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-600 via-slate-600 to-transparent" />
          </div>
          <p className="text-xs text-slate-600 mt-1">Direct</p>
        </div>

        {/* Destination */}
        <div className="text-center flex-shrink-0">
          <p className="text-2xl font-bold text-white">{formatTime(flight.arrival_time)}</p>
          <p className="text-lg font-semibold text-cyan-400">{flight.destination_code}</p>
          <p className="text-xs text-slate-500">{flight.destination_city}</p>
          <p className="text-xs text-slate-600">{flight.destination_country}</p>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 rounded-xl bg-sky-500/5 border border-sky-500/10">
          <p className="text-xs text-sky-400 font-medium mb-1">Economy</p>
          <p className="text-sm font-bold text-white">{formatPrice(flight.price_economy)}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
          <p className="text-xs text-violet-400 font-medium mb-1">Business</p>
          <p className="text-sm font-bold text-white">{formatPrice(flight.price_business)}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-amber-400 font-medium mb-1">First</p>
          <p className="text-sm font-bold text-white">{formatPrice(flight.price_first)}</p>
        </div>
      </div>

      {/* Select Button */}
      <button
        onClick={() => onSelect(flight)}
        className="w-full py-3 bg-white text-slate-900 font-semibold rounded-xl shadow-lg hover:bg-slate-100 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Plane className="w-4 h-4" />
        Select Flight
      </button>
    </div>
  );
}
