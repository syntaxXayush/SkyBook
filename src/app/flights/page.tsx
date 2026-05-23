import { createClient } from '@/lib/supabase/server';
import FlightResults from '@/components/flights/FlightResults';

interface FlightsPageProps {
  searchParams: Promise<{ from?: string; to?: string; date?: string; pax?: string }>;
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const params = await searchParams;
  const from = params.from || '';
  const to = params.to || '';
  const date = params.date || '';
  const pax = parseInt(params.pax || '1', 10);

  const supabase = await createClient();

  // Query flights matching the search criteria
  let query = supabase
    .from('flights')
    .select('*')
    .eq('status', 'scheduled')
    .gte('departure_time', new Date().toISOString()) // Only future flights
    .order('departure_time', { ascending: true });

  if (from) query = query.eq('origin_code', from);
  if (to) query = query.eq('destination_code', to);
  if (date) {
    // Use a wide window to handle timezone differences.
    // The user's selected date (e.g. "2026-05-25") might be in IST (+05:30),
    // while departure_time is stored as timestamptz. We search a 30-hour
    // window starting 6 hours before midnight UTC to cover all common timezones.
    const dateStart = new Date(`${date}T00:00:00`);
    dateStart.setHours(dateStart.getHours() - 6); // 6h buffer for timezone
    const dateEnd = new Date(`${date}T00:00:00`);
    dateEnd.setHours(dateEnd.getHours() + 30); // extend through end of day + buffer
    query = query
      .gte('departure_time', dateStart.toISOString())
      .lte('departure_time', dateEnd.toISOString());
  }

  const { data: flights, error } = await query;

  if (error) {
    console.error('Error fetching flights:', error);
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlightResults
          flights={flights || []}
          from={from}
          to={to}
          date={date}
          pax={pax}
        />
      </div>
    </div>
  );
}
