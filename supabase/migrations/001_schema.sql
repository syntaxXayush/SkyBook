-- =============================================================================
-- SkyBook Flight Management Application — Schema
-- File: schema.sql
-- Run order: 1 of 5
-- Description: Creates all tables, constraints, indexes, and the updated_at
--              trigger function for the SkyBook application.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. FLIGHTS — Master flight schedule
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flights (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_number      text          NOT NULL,                          -- e.g. 'SK-201'
    airline            text          NOT NULL,                          -- e.g. 'SkyWing Airlines'

    -- Origin airport
    origin_code        text          NOT NULL,                          -- IATA code, e.g. 'DEL'
    origin_city        text          NOT NULL,                          -- e.g. 'New Delhi'
    origin_country     text          NOT NULL,                          -- e.g. 'India'

    -- Destination airport
    destination_code   text          NOT NULL,
    destination_city   text          NOT NULL,
    destination_country text         NOT NULL,

    -- Schedule
    departure_time     timestamptz   NOT NULL,
    arrival_time       timestamptz   NOT NULL,

    -- Pricing per class (INR ₹)
    price_economy      numeric(10,2) NOT NULL,
    price_business     numeric(10,2) NOT NULL,
    price_first        numeric(10,2) NOT NULL,

    -- Flight status
    status             text          NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled')),

    created_at         timestamptz   DEFAULT now()
);

COMMENT ON TABLE  flights IS 'Master table of all scheduled flights.';
COMMENT ON COLUMN flights.origin_code IS 'IATA 3-letter airport code for origin.';
COMMENT ON COLUMN flights.destination_code IS 'IATA 3-letter airport code for destination.';


-- ---------------------------------------------------------------------------
-- 2. SEATS — Per-flight seat inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id       uuid          NOT NULL
        REFERENCES flights (id) ON DELETE CASCADE,
    seat_number     text          NOT NULL,                             -- e.g. '12A'
    class           text          NOT NULL
        CHECK (class IN ('economy', 'business', 'first')),
    is_available    boolean       NOT NULL DEFAULT true,
    price           numeric(10,2) NOT NULL,
    created_at      timestamptz   DEFAULT now(),

    -- A seat number must be unique within a flight
    UNIQUE (flight_id, seat_number)
);

-- Composite index for fast "available seats on flight X" queries
CREATE INDEX IF NOT EXISTS idx_seats_flight_available
    ON seats (flight_id, is_available);

COMMENT ON TABLE  seats IS 'Individual seat records for every flight.';
COMMENT ON COLUMN seats.is_available IS 'false once a seat has been reserved.';


-- ---------------------------------------------------------------------------
-- 3. BOOKINGS — Reservation records linked to auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid          NOT NULL
        REFERENCES auth.users (id),
    flight_id       uuid          NOT NULL
        REFERENCES flights (id),
    pnr_code        text          NOT NULL UNIQUE,                     -- 6-char uppercase alphanumeric
    status          text          NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled', 'rescheduled')),
    total_amount    numeric(10,2) NOT NULL,
    passenger_count integer       NOT NULL
        CHECK (passenger_count > 0 AND passenger_count <= 6),
    booking_class   text          NOT NULL
        CHECK (booking_class IN ('economy', 'business', 'first')),
    created_at      timestamptz   DEFAULT now(),
    updated_at      timestamptz   DEFAULT now()
);

-- Index for fast "my bookings" lookup
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
    ON bookings (user_id);

COMMENT ON TABLE  bookings IS 'Flight reservations made by authenticated users.';
COMMENT ON COLUMN bookings.pnr_code IS '6-character uppercase alphanumeric PNR, e.g. A3X9K2.';


-- ---------------------------------------------------------------------------
-- 4. PASSENGERS — Individual travellers within a booking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passengers (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      uuid          NOT NULL
        REFERENCES bookings (id) ON DELETE CASCADE,
    full_name       text          NOT NULL,
    passport_number text          NOT NULL,
    nationality     text          NOT NULL,
    seat_id         uuid
        REFERENCES seats (id) ON DELETE SET NULL,
    created_at      timestamptz   DEFAULT now()
);

COMMENT ON TABLE passengers IS 'Passenger details for each booking.';


-- ---------------------------------------------------------------------------
-- 5. RESCHEDULES — Audit trail for booking reschedule operations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reschedules (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id        uuid          NOT NULL
        REFERENCES bookings (id),
    original_flight_id uuid         NOT NULL
        REFERENCES flights (id),
    new_flight_id     uuid          NOT NULL
        REFERENCES flights (id),
    fee               numeric(10,2) NOT NULL DEFAULT 0,
    created_at        timestamptz   DEFAULT now()
);

COMMENT ON TABLE reschedules IS 'Tracks every reschedule operation for audit purposes.';


-- ---------------------------------------------------------------------------
-- 6. FUNCTION: Auto-update `updated_at` on bookings
-- ---------------------------------------------------------------------------
-- Generic trigger function — can be reused on any table with an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_set_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMENT ON FUNCTION set_updated_at() IS 'Sets updated_at to now() before every UPDATE.';
