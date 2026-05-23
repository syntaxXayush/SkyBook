'use client';

import { useRouter } from 'next/navigation';
import { Plane, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Flight } from '@/types';
import { useFlightStore } from '@/stores/useFlightStore';
import FlightCard from '@/components/flights/FlightCard';
import Link from 'next/link';

interface FlightResultsProps {
  flights: Flight[];
  from: string;
  to: string;
  date: string;
  pax: number;
}

export default function FlightResults({ flights, from, to, date, pax }: FlightResultsProps) {
  const router = useRouter();
  const { setSelectedFlight } = useFlightStore();
  const [sortBy, setSortBy] = useState<'price' | 'time'>('price');

  const sorted = [...flights].sort((a, b) => {
    if (sortBy === 'price') return a.price_economy - b.price_economy;
    return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
  });

  const handleSelect = (flight: Flight) => {
    setSelectedFlight(flight);
    router.push(`/booking/${flight.id}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {from} → {to}
          </h1>
          <p className="text-slate-400 text-sm">{date} • {pax} passenger{pax > 1 ? 's' : ''} • {flights.length} flight{flights.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'time')}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 outline-none focus:border-white/30 [color-scheme:dark]"
          >
            <option value="price" className="bg-slate-900 text-slate-200">Sort by Price</option>
            <option value="time" className="bg-slate-900 text-slate-200">Sort by Time</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <Plane className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-400 mb-2">No Flights Found</h2>
          <p className="text-slate-500 mb-6">Try adjusting your search criteria or pick a different date.</p>
          <Link href="/" className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition-all shadow-md inline-block">
            Search Again
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sorted.map((flight, i) => (
            <div
              key={flight.id}
              className="animate-slide-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: `${i * 0.1}s` }}
            >
              <FlightCard flight={flight} onSelect={handleSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
