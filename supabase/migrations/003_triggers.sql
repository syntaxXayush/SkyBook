-- =============================================================================
-- SkyBook Flight Management Application — Triggers
-- File: triggers.sql
-- Run order: 3 of 5
-- Description: Database-level safety net triggers.
--              The cancellation guard duplicates logic in the cancel_booking RPC
--              to ensure the rule cannot be bypassed even with direct SQL access.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: Prevent cancellation within 2 hours of departure
-- ---------------------------------------------------------------------------
-- This fires BEFORE UPDATE on bookings.  It only activates when the status
-- column is being changed TO 'cancelled'.  It looks up the linked flight's
-- departure_time and raises an exception if the departure is less than
-- 2 hours away.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_cancellation_window()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_departure_time timestamptz;
BEGIN
    -- Only act when the status is being changed TO 'cancelled'
    IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN

        -- Look up the departure time for the booking's flight
        SELECT f.departure_time
          INTO v_departure_time
          FROM flights f
         WHERE f.id = NEW.flight_id;

        -- If the flight departs within the next 2 hours, block the cancellation.
        -- Uses now() AT TIME ZONE 'UTC' for timezone-proof comparison.
        -- Even if a client manipulates their local clock, this uses
        -- the server's UTC time from PostgreSQL, which cannot be faked.
        IF v_departure_time IS NOT NULL
           AND (v_departure_time - (now() AT TIME ZONE 'UTC')) < interval '2 hours'
        THEN
            RAISE EXCEPTION
                'Cannot cancel booking within 2 hours of departure (departure: %)',
                v_departure_time;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION guard_cancellation_window()
    IS 'DB-level safety net: blocks booking cancellation when departure is < 2 h away.';

-- ---------------------------------------------------------------------------
-- Attach the trigger to the bookings table
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_guard_cancellation_window
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION guard_cancellation_window();
