-- =============================================================================
-- SkyBook Flight Management Application — RPC Functions
-- File: rpc.sql
-- Run order: 4 of 5
-- Description: Server-side transactional functions exposed as Supabase RPCs.
--              All three are SECURITY DEFINER so they bypass RLS and run with
--              elevated privileges.  The client calls them via
--              supabase.rpc('reserve_seats', { ... }) etc.
-- =============================================================================


-- ===========================================================================
-- 1. reserve_seats — Atomically book seats for one or more passengers
-- ===========================================================================
-- Parameters:
--   p_flight_id     – the flight being booked
--   p_user_id       – auth.uid() of the caller
--   p_passengers    – JSONB array of passenger objects, each containing:
--                     { full_name, passport_number, nationality, seat_id }
--   p_seat_ids      – UUID array of the requested seat IDs
--   p_booking_class – 'economy' | 'business' | 'first'
--
-- Returns: JSON { booking_id, pnr_code }
-- ===========================================================================
CREATE OR REPLACE FUNCTION reserve_seats(
    p_flight_id     uuid,
    p_user_id       uuid,
    p_passengers    jsonb,
    p_seat_ids      uuid[],
    p_booking_class text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER                  -- bypasses RLS; runs as DB owner
SET search_path = public          -- avoid search-path hijacking
AS $$
DECLARE
    v_locked_count   integer;
    v_total_amount   numeric(10,2);
    v_pnr_code       text;
    v_booking_id     uuid;
    v_passenger      jsonb;
BEGIN
    -- -----------------------------------------------------------------
    -- 1. Lock the requested seats with FOR UPDATE SKIP LOCKED
    --    SKIP LOCKED instantly skips rows locked by concurrent txns,
    --    so the user gets an immediate error instead of a hanging wait.
    --    NOTE: FOR UPDATE cannot be used with aggregate functions in PG,
    --    so we lock in a subquery then count the results.
    -- -----------------------------------------------------------------
    SELECT count(*) INTO v_locked_count
      FROM (
          SELECT id FROM seats
           WHERE id = ANY(p_seat_ids)
             AND flight_id = p_flight_id
             AND is_available = true
             FOR UPDATE SKIP LOCKED
      ) locked;

    IF v_locked_count <> array_length(p_seat_ids, 1) THEN
        RAISE EXCEPTION 'One or more selected seats are no longer available';
    END IF;

    -- -----------------------------------------------------------------
    -- 2. Calculate total amount from seat prices
    -- -----------------------------------------------------------------
    SELECT coalesce(sum(price), 0)
      INTO v_total_amount
      FROM seats
     WHERE id = ANY(p_seat_ids);

    -- -----------------------------------------------------------------
    -- 3. Generate a unique 6-character uppercase alphanumeric PNR
    -- -----------------------------------------------------------------
    LOOP
        v_pnr_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
        -- Ensure uniqueness (extremely unlikely collision, but safety first)
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM bookings WHERE pnr_code = v_pnr_code
        );
    END LOOP;

    -- -----------------------------------------------------------------
    -- 4. Create the booking record
    -- -----------------------------------------------------------------
    INSERT INTO bookings (
        user_id, flight_id, pnr_code, status,
        total_amount, passenger_count, booking_class
    )
    VALUES (
        p_user_id,
        p_flight_id,
        v_pnr_code,
        'confirmed',
        v_total_amount,
        jsonb_array_length(p_passengers),
        p_booking_class
    )
    RETURNING id INTO v_booking_id;

    -- -----------------------------------------------------------------
    -- 5. Create passenger records from the JSONB array
    -- -----------------------------------------------------------------
    FOR v_passenger IN SELECT * FROM jsonb_array_elements(p_passengers)
    LOOP
        INSERT INTO passengers (
            booking_id, full_name, passport_number, nationality, seat_id
        )
        VALUES (
            v_booking_id,
            v_passenger ->> 'full_name',
            v_passenger ->> 'passport_number',
            v_passenger ->> 'nationality',
            (v_passenger ->> 'seat_id')::uuid
        );
    END LOOP;

    -- -----------------------------------------------------------------
    -- 6. Mark all reserved seats as unavailable
    -- -----------------------------------------------------------------
    UPDATE seats
       SET is_available = false
     WHERE id = ANY(p_seat_ids);

    -- -----------------------------------------------------------------
    -- 7. Return the booking details
    -- -----------------------------------------------------------------
    RETURN jsonb_build_object(
        'booking_id', v_booking_id,
        'pnr_code',   v_pnr_code
    );
END;
$$;

COMMENT ON FUNCTION reserve_seats(uuid, uuid, jsonb, uuid[], text)
    IS 'Atomically reserves seats, creates a booking + passengers, and returns PNR.';


-- ===========================================================================
-- 2. cancel_booking — Cancel a confirmed booking and free its seats
-- ===========================================================================
-- Parameters:
--   p_booking_id – the booking to cancel
--   p_user_id    – auth.uid() of the caller (ownership check)
--
-- Returns: JSON { message }
-- ===========================================================================
CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id uuid,
    p_user_id    uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking        bookings%ROWTYPE;
    v_departure_time timestamptz;
BEGIN
    -- -----------------------------------------------------------------
    -- 1. Fetch and verify booking ownership
    -- -----------------------------------------------------------------
    SELECT *
      INTO v_booking
      FROM bookings
     WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.user_id <> p_user_id THEN
        RAISE EXCEPTION 'Booking does not belong to this user';
    END IF;

    -- -----------------------------------------------------------------
    -- 2. Ensure booking is not already cancelled
    -- -----------------------------------------------------------------
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled';
    END IF;

    -- -----------------------------------------------------------------
    -- 3. Enforce the 2-hour cancellation window (timezone-proof)
    --    Uses now() AT TIME ZONE 'UTC' so a client's local clock
    --    cannot be manipulated to bypass this rule.
    -- -----------------------------------------------------------------
    SELECT f.departure_time
      INTO v_departure_time
      FROM flights f
     WHERE f.id = v_booking.flight_id;

    IF (v_departure_time - (now() AT TIME ZONE 'UTC')) < interval '2 hours' THEN
        RAISE EXCEPTION 'Cannot cancel booking within 2 hours of departure';
    END IF;

    -- -----------------------------------------------------------------
    -- 4. Set booking status to 'cancelled'
    -- -----------------------------------------------------------------
    UPDATE bookings
       SET status = 'cancelled'
     WHERE id = p_booking_id;

    -- -----------------------------------------------------------------
    -- 5. Free all seats held by passengers on this booking
    -- -----------------------------------------------------------------
    UPDATE seats
       SET is_available = true
     WHERE id IN (
         SELECT p.seat_id
           FROM passengers p
          WHERE p.booking_id = p_booking_id
            AND p.seat_id IS NOT NULL
     );

    -- -----------------------------------------------------------------
    -- 6. Return confirmation
    -- -----------------------------------------------------------------
    RETURN jsonb_build_object(
        'message', 'Booking ' || v_booking.pnr_code || ' has been cancelled successfully'
    );
END;
$$;

COMMENT ON FUNCTION cancel_booking(uuid, uuid)
    IS 'Cancels a booking (if >2 h before departure) and releases all held seats.';


-- ===========================================================================
-- 3. reschedule_booking — Move a booking to a different flight on the same route
-- ===========================================================================
-- Parameters:
--   p_booking_id    – existing booking to reschedule
--   p_user_id       – auth.uid() of the caller
--   p_new_flight_id – target flight (must share origin/destination)
--   p_new_seat_ids  – new seat UUIDs on the target flight
--
-- Returns: JSON { reschedule_id, fee }
-- ===========================================================================
CREATE OR REPLACE FUNCTION reschedule_booking(
    p_booking_id    uuid,
    p_user_id       uuid,
    p_new_flight_id uuid,
    p_new_seat_ids  uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking          bookings%ROWTYPE;
    v_old_flight       flights%ROWTYPE;
    v_new_flight       flights%ROWTYPE;
    v_locked_count     integer;
    v_new_total        numeric(10,2);
    v_old_total        numeric(10,2);
    v_fee              numeric(10,2);
    v_reschedule_id    uuid;
    v_old_seat_ids     uuid[];
    v_passenger_ids    uuid[];
    i                  integer;
BEGIN
    -- -----------------------------------------------------------------
    -- 1. Fetch and verify booking ownership
    -- -----------------------------------------------------------------
    SELECT *
      INTO v_booking
      FROM bookings
     WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.user_id <> p_user_id THEN
        RAISE EXCEPTION 'Booking does not belong to this user';
    END IF;

    -- -----------------------------------------------------------------
    -- 2. Booking must be in 'confirmed' status
    -- -----------------------------------------------------------------
    IF v_booking.status <> 'confirmed' THEN
        RAISE EXCEPTION 'Only confirmed bookings can be rescheduled (current status: %)', v_booking.status;
    END IF;

    -- -----------------------------------------------------------------
    -- 3. Verify same route (origin_code & destination_code must match)
    -- -----------------------------------------------------------------
    SELECT * INTO v_old_flight FROM flights WHERE id = v_booking.flight_id;
    SELECT * INTO v_new_flight FROM flights WHERE id = p_new_flight_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'New flight not found';
    END IF;

    IF v_old_flight.origin_code      <> v_new_flight.origin_code
       OR v_old_flight.destination_code <> v_new_flight.destination_code
    THEN
        RAISE EXCEPTION 'New flight must be on the same route (% → %)',
            v_old_flight.origin_code, v_old_flight.destination_code;
    END IF;

    -- -----------------------------------------------------------------
    -- 4. Lock new seats with FOR UPDATE SKIP LOCKED
    --    Non-blocking: if another txn holds any of these rows, we fail
    --    instantly rather than waiting, keeping UX snappy.
    --    NOTE: FOR UPDATE cannot be used with aggregate functions in PG,
    --    so we lock in a subquery then count the results.
    -- -----------------------------------------------------------------
    SELECT count(*) INTO v_locked_count
      FROM (
          SELECT id FROM seats
           WHERE id = ANY(p_new_seat_ids)
             AND flight_id = p_new_flight_id
             AND is_available = true
             FOR UPDATE SKIP LOCKED
      ) locked;

    IF v_locked_count <> array_length(p_new_seat_ids, 1) THEN
        RAISE EXCEPTION 'One or more selected seats on the new flight are no longer available';
    END IF;

    -- -----------------------------------------------------------------
    -- 5. Lock old seats first (FOR UPDATE) then free them.
    --    Locking the old rows before releasing prevents a window
    --    where another txn could grab them mid-swap, which would
    --    leave the user with NO seats on rollback.
    -- -----------------------------------------------------------------
    SELECT array_agg(p.seat_id)
      INTO v_old_seat_ids
      FROM passengers p
     WHERE p.booking_id = p_booking_id
       AND p.seat_id IS NOT NULL;

    -- Acquire lock on old seats to prevent mid-swap race
    PERFORM 1 FROM seats WHERE id = ANY(v_old_seat_ids) FOR UPDATE;

    UPDATE seats
       SET is_available = true
     WHERE id = ANY(v_old_seat_ids);

    -- -----------------------------------------------------------------
    -- 6. Calculate fee = MAX(0, new_total - old_total)
    -- -----------------------------------------------------------------
    v_old_total := v_booking.total_amount;

    SELECT coalesce(sum(price), 0)
      INTO v_new_total
      FROM seats
     WHERE id = ANY(p_new_seat_ids);

    v_fee := GREATEST(0, v_new_total - v_old_total);

    -- -----------------------------------------------------------------
    -- 7. Update the booking record (stays 'confirmed', new flight & amount)
    -- -----------------------------------------------------------------
    UPDATE bookings
       SET flight_id    = p_new_flight_id,
           total_amount = v_new_total,
           status       = 'confirmed'
     WHERE id = p_booking_id;

    -- -----------------------------------------------------------------
    -- 8. Reassign passenger seats (preserve ordering)
    -- -----------------------------------------------------------------
    SELECT array_agg(p.id ORDER BY p.created_at)
      INTO v_passenger_ids
      FROM passengers p
     WHERE p.booking_id = p_booking_id;

    FOR i IN 1 .. array_length(v_passenger_ids, 1)
    LOOP
        UPDATE passengers
           SET seat_id = p_new_seat_ids[i]
         WHERE id = v_passenger_ids[i];
    END LOOP;

    -- -----------------------------------------------------------------
    -- 9. Mark new seats as unavailable
    -- -----------------------------------------------------------------
    UPDATE seats
       SET is_available = false
     WHERE id = ANY(p_new_seat_ids);

    -- -----------------------------------------------------------------
    -- 10. Create reschedule audit record
    -- -----------------------------------------------------------------
    INSERT INTO reschedules (
        booking_id, original_flight_id, new_flight_id, fee
    )
    VALUES (
        p_booking_id, v_old_flight.id, p_new_flight_id, v_fee
    )
    RETURNING id INTO v_reschedule_id;

    -- -----------------------------------------------------------------
    -- 11. Return result
    -- -----------------------------------------------------------------
    RETURN jsonb_build_object(
        'reschedule_id', v_reschedule_id,
        'fee',           v_fee
    );
END;
$$;

COMMENT ON FUNCTION reschedule_booking(uuid, uuid, uuid, uuid[])
    IS 'Moves a booking to a new same-route flight, swaps seats, and records the fee.';
