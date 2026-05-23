-- =============================================================================
-- SkyBook Flight Management Application — Row Level Security
-- File: rls.sql
-- Run order: 2 of 5
-- Description: Enables RLS on every table and defines granular access policies.
--              Authenticated users can browse flights/seats, but can only
--              read/write their own bookings, passengers, and reschedule records.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on ALL tables
-- ---------------------------------------------------------------------------
ALTER TABLE flights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- FLIGHTS — Read-only for any authenticated user (public search)
-- ===========================================================================
CREATE POLICY "flights_select_authenticated"
    ON flights
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON POLICY "flights_select_authenticated" ON flights
    IS 'Any logged-in user can search / view flight schedules.';


-- ===========================================================================
-- SEATS — SELECT for authenticated; UPDATE restricted to service_role (RPCs)
-- ===========================================================================
-- Anyone logged in can see seat maps
CREATE POLICY "seats_select_authenticated"
    ON seats
    FOR SELECT
    TO authenticated
    USING (true);

-- Only the service_role (used by SECURITY DEFINER RPCs) may flip is_available.
-- Regular users must go through the reserve_seats / cancel_booking RPCs.
CREATE POLICY "seats_update_service_role"
    ON seats
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "seats_select_authenticated" ON seats
    IS 'Authenticated users can view seat availability.';
COMMENT ON POLICY "seats_update_service_role" ON seats
    IS 'Seat availability is only changed via SECURITY DEFINER RPCs.';


-- ===========================================================================
-- BOOKINGS — Users may only access their own bookings
-- ===========================================================================
-- SELECT own bookings
CREATE POLICY "bookings_select_own"
    ON bookings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- INSERT own bookings (user_id must match the caller)
CREATE POLICY "bookings_insert_own"
    ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE own bookings (e.g. cancel / reschedule)
CREATE POLICY "bookings_update_own"
    ON bookings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "bookings_select_own" ON bookings
    IS 'Users can only read their own booking records.';


-- ===========================================================================
-- PASSENGERS — Access only if the parent booking belongs to the user
-- ===========================================================================
-- SELECT: join-check against bookings.user_id
CREATE POLICY "passengers_select_own_booking"
    ON passengers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = passengers.booking_id
              AND b.user_id = auth.uid()
        )
    );

-- INSERT: join-check against bookings.user_id
CREATE POLICY "passengers_insert_own_booking"
    ON passengers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = passengers.booking_id
              AND b.user_id = auth.uid()
        )
    );

COMMENT ON POLICY "passengers_select_own_booking" ON passengers
    IS 'Users can only view passengers on their own bookings.';
COMMENT ON POLICY "passengers_insert_own_booking" ON passengers
    IS 'Users can only add passengers to their own bookings.';


-- ===========================================================================
-- RESCHEDULES — Access only if the parent booking belongs to the user
-- ===========================================================================
-- SELECT: join-check
CREATE POLICY "reschedules_select_own_booking"
    ON reschedules
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = reschedules.booking_id
              AND b.user_id = auth.uid()
        )
    );

-- INSERT: join-check
CREATE POLICY "reschedules_insert_own_booking"
    ON reschedules
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = reschedules.booking_id
              AND b.user_id = auth.uid()
        )
    );

COMMENT ON POLICY "reschedules_select_own_booking" ON reschedules
    IS 'Users can only view reschedule records for their own bookings.';
COMMENT ON POLICY "reschedules_insert_own_booking" ON reschedules
    IS 'Users can only create reschedule records for their own bookings.';
