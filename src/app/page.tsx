'use client';

import { Plane, LayoutGrid, Shield, RefreshCw, Globe, Clock, Headphones, ArrowRight } from 'lucide-react';
import SearchForm from '@/components/flights/SearchForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section
        className="relative w-full h-screen min-h-[800px] flex flex-col justify-between"
        style={{
          backgroundImage: 'url(/hero-bg.png.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Soft dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 w-full">
          <div className="max-w-3xl animate-slide-up">
            <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tight leading-[1.1] mb-4 shadow-sm">
              SkyBook
              <br />
              <span className="text-white/90 font-medium tracking-normal text-5xl md:text-6xl">
                Luxury, Now Boarding
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed mb-8 drop-shadow-md font-medium">
              Experience seamless luxury travel designed for modern explorers,
              blending elegance, comfort, and an effortless journey.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500 text-white font-semibold shadow-lg hover:bg-blue-600 transition-all">
                Instant Flight Booking
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <Plane className="w-3 h-3 text-blue-500 transform -rotate-45" />
                </div>
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 font-semibold shadow-lg hover:bg-slate-100 transition-all">
                Group Flight
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
                  <Plane className="w-3 h-3 text-white transform -rotate-45" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar container at bottom */}
        <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto animate-slide-up stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="glass-hero-bar p-6 md:p-8">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose SkyBook?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Elevating every aspect of your travel experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutGrid,
                title: 'Real-time Seats',
                desc: 'Interactive seat map with live updates. See availability change in real-time as others book.',
              },
              {
                icon: Shield,
                title: 'Secure Booking',
                desc: 'Bank-grade security with Row Level Security. Your data is protected at every layer.',
              },
              {
                icon: RefreshCw,
                title: 'Easy Management',
                desc: 'Reschedule or cancel with one click. Full booking management from your dashboard.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-1 transition-transform duration-300 animate-slide-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
                  <feature.icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Globe, value: '20+', label: 'Destinations' },
              { icon: Plane, value: '4', label: 'Airlines' },
              { icon: Clock, value: '99.9%', label: 'Uptime' },
              { icon: Headphones, value: '24/7', label: 'Support' },
            ].map((stat) => (
              <div key={stat.label} className="text-center flex flex-col items-center">
                <div className="mb-4">
                  <stat.icon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-slate-500 font-medium uppercase tracking-wider text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white -rotate-45" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-wide">SkyBook</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 SkyBook Luxury Travel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
