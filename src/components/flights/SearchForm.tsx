'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, ArrowLeftRight, Search, Plane, Minus, Plus, Clock } from 'lucide-react';
import { AIRPORTS } from '@/lib/constants';
import { useFlightStore } from '@/stores/useFlightStore';
import { cn } from '@/lib/utils';

export default function SearchForm() {
  const router = useRouter();
  const { searchParams, setSearchParams } = useFlightStore();

  const [origin, setOrigin] = useState(searchParams?.origin || '');
  const [destination, setDestination] = useState(searchParams?.destination || '');
  const [date, setDate] = useState(searchParams?.date || '');
  const [pax, setPax] = useState(searchParams?.passengerCount || 1);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setShowOriginDropdown(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDestDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOrigins = AIRPORTS.filter(a =>
    a.code !== destination &&
    (a.city.toLowerCase().includes(originSearch.toLowerCase()) ||
     a.code.toLowerCase().includes(originSearch.toLowerCase()) ||
     a.country.toLowerCase().includes(originSearch.toLowerCase()))
  );

  const filteredDests = AIRPORTS.filter(a =>
    a.code !== origin &&
    (a.city.toLowerCase().includes(destSearch.toLowerCase()) ||
     a.code.toLowerCase().includes(destSearch.toLowerCase()) ||
     a.country.toLowerCase().includes(destSearch.toLowerCase()))
  );

  const getAirportLabel = (code: string) => {
    const a = AIRPORTS.find(ap => ap.code === code);
    return a ? `${a.city} (${a.code})` : '';
  };

  const swapLocations = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;

    setSearchParams({ origin, destination, date, passengerCount: pax });
    router.push(`/flights?from=${origin}&to=${destination}&date=${date}&pax=${pax}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full">
        {/* Origin */}
        <div ref={originRef} className="relative w-full lg:flex-1">
          <label className="flex items-center text-sm font-medium text-white mb-2">
            <Plane className="w-4 h-4 mr-2 text-white/70" /> Departure
          </label>
          <div className="relative">
            <input
              type="text"
              value={showOriginDropdown ? originSearch : getAirportLabel(origin)}
              onChange={(e) => { setOriginSearch(e.target.value); setShowOriginDropdown(true); }}
              onFocus={() => { setShowOriginDropdown(true); setOriginSearch(''); }}
              placeholder="Departure Airport"
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white placeholder-white/50 focus:border-white focus:bg-white/20 outline-none transition-all"
            />
            {showOriginDropdown && (
              <div className="absolute z-50 top-full mt-2 w-full max-h-60 overflow-y-auto glass-card rounded-2xl py-2 shadow-xl border border-white/10">
                {filteredOrigins.map(a => (
                  <button
                    type="button"
                    key={a.code}
                    onClick={() => { setOrigin(a.code); setShowOriginDropdown(false); setOriginSearch(''); }}
                    className={cn(
                      'w-full text-left px-5 py-3 hover:bg-white/10 transition-colors text-sm',
                      origin === a.code ? 'bg-white/10 text-white' : 'text-slate-300'
                    )}
                  >
                    <span className="font-semibold text-white">{a.city}</span>
                    <span className="text-slate-400 ml-1">({a.code})</span>
                    <span className="text-slate-500 text-xs block mt-0.5">{a.country} • {a.name}</span>
                  </button>
                ))}
                {filteredOrigins.length === 0 && (
                  <p className="px-5 py-4 text-slate-400 text-sm">No airports found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={swapLocations}
          className="mt-6 lg:mt-6 p-3 rounded-full hover:bg-white/10 text-white transition-all hover:rotate-180 duration-300 flex-shrink-0"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* Destination */}
        <div ref={destRef} className="relative w-full lg:flex-1">
          <label className="flex items-center text-sm font-medium text-white mb-2">
            <Plane className="w-4 h-4 mr-2 text-white/70 transform rotate-90" /> Arrival
          </label>
          <div className="relative">
            <input
              type="text"
              value={showDestDropdown ? destSearch : getAirportLabel(destination)}
              onChange={(e) => { setDestSearch(e.target.value); setShowDestDropdown(true); }}
              onFocus={() => { setShowDestDropdown(true); setDestSearch(''); }}
              placeholder="Arrival Airport"
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white placeholder-white/50 focus:border-white focus:bg-white/20 outline-none transition-all"
            />
            {showDestDropdown && (
              <div className="absolute z-50 top-full mt-2 w-full max-h-60 overflow-y-auto glass-card rounded-2xl py-2 shadow-xl border border-white/10">
                {filteredDests.map(a => (
                  <button
                    type="button"
                    key={a.code}
                    onClick={() => { setDestination(a.code); setShowDestDropdown(false); setDestSearch(''); }}
                    className={cn(
                      'w-full text-left px-5 py-3 hover:bg-white/10 transition-colors text-sm',
                      destination === a.code ? 'bg-white/10 text-white' : 'text-slate-300'
                    )}
                  >
                    <span className="font-semibold text-white">{a.city}</span>
                    <span className="text-slate-400 ml-1">({a.code})</span>
                    <span className="text-slate-500 text-xs block mt-0.5">{a.country} • {a.name}</span>
                  </button>
                ))}
                {filteredDests.length === 0 && (
                  <p className="px-5 py-4 text-slate-400 text-sm">No airports found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="w-full lg:w-48">
          <label className="flex items-center text-sm font-medium text-white mb-2">
            <Clock className="w-4 h-4 mr-2 text-white/70" /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white placeholder-white/50 focus:border-white focus:bg-white/20 outline-none transition-all [color-scheme:dark]"
            required
          />
        </div>

        {/* Passengers */}
        <div className="w-full lg:w-40">
          <label className="flex items-center text-sm font-medium text-white mb-2">
            <Users className="w-4 h-4 mr-2 text-white/70" /> Passengers
          </label>
          <div className="flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full transition-all">
            <button type="button" onClick={() => setPax(Math.max(1, pax - 1))}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-medium text-white">{pax}</span>
            <button type="button" onClick={() => setPax(Math.min(6, pax + 1))}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Button */}
        <div className="w-full lg:w-auto mt-6 lg:mt-6">
          <button
            type="submit"
            disabled={!origin || !destination || !date}
            className="w-full lg:w-auto p-4 bg-white text-slate-900 rounded-full shadow-xl hover:bg-slate-100 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
            title="Search Flights"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      </div>
    </form>
  );
}
