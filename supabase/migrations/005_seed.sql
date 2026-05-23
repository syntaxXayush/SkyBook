-- =============================================================================
-- SkyBook Flight Management Application — Seed Data
-- File: seed.sql
-- Run order: 5 of 5
-- Description: Populates flights and seats with realistic demo data.
--              8 flights across 4 international routes.
--              146 seats per flight (8 First + 30 Business + 108 Economy).
--              ~10-15% of seats randomly marked unavailable to simulate bookings.
--
-- NOTE: All departure times use CURRENT_DATE + interval so they are always
--       in the future no matter when you run this script.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. INSERT 8 FLIGHTS
--    Departure times are relative to CURRENT_DATE so they are always future.
-- ---------------------------------------------------------------------------
INSERT INTO flights (
    flight_number, airline,
    origin_code, origin_city, origin_country,
    destination_code, destination_city, destination_country,
    departure_time, arrival_time,
    price_economy, price_business, price_first,
    status
) VALUES
-- Route 1: DEL → DXB  (approx 3.5 h flight)
-- Flight 1: Tomorrow morning
(
    'SK-201', 'SkyWing Airlines',
    'DEL', 'New Delhi', 'India',
    'DXB', 'Dubai', 'UAE',
    (CURRENT_DATE + interval '1 day' + interval '6 hours')::timestamptz,
    (CURRENT_DATE + interval '1 day' + interval '9 hours 30 minutes')::timestamptz,
    4500.00, 15000.00, 35000.00,
    'scheduled'
),
-- Flight 2: Tomorrow evening
(
    'SK-202', 'SkyWing Airlines',
    'DEL', 'New Delhi', 'India',
    'DXB', 'Dubai', 'UAE',
    (CURRENT_DATE + interval '1 day' + interval '18 hours')::timestamptz,
    (CURRENT_DATE + interval '1 day' + interval '21 hours 30 minutes')::timestamptz,
    5200.00, 17500.00, 38000.00,
    'scheduled'
),

-- Route 2: LHR → JFK  (approx 8 h flight)
-- Flight 3: Day after tomorrow morning
(
    'AT-501', 'Atlas Airways',
    'LHR', 'London', 'United Kingdom',
    'JFK', 'New York', 'United States',
    (CURRENT_DATE + interval '2 days' + interval '8 hours')::timestamptz,
    (CURRENT_DATE + interval '2 days' + interval '16 hours')::timestamptz,
    8500.00, 28000.00, 55000.00,
    'scheduled'
),
-- Flight 4: Day after tomorrow evening
(
    'AT-502', 'Atlas Airways',
    'LHR', 'London', 'United Kingdom',
    'JFK', 'New York', 'United States',
    (CURRENT_DATE + interval '2 days' + interval '20 hours')::timestamptz,
    (CURRENT_DATE + interval '3 days' + interval '4 hours')::timestamptz,
    7800.00, 25000.00, 52000.00,
    'scheduled'
),

-- Route 3: SIN → SYD  (approx 7.5 h flight)
-- Flight 5: 3 days from now
(
    'HZ-301', 'Horizon Air',
    'SIN', 'Singapore', 'Singapore',
    'SYD', 'Sydney', 'Australia',
    (CURRENT_DATE + interval '3 days' + interval '7 hours')::timestamptz,
    (CURRENT_DATE + interval '3 days' + interval '14 hours 30 minutes')::timestamptz,
    6800.00, 22000.00, 45000.00,
    'scheduled'
),
-- Flight 6: 3 days from now evening
(
    'HZ-302', 'Horizon Air',
    'SIN', 'Singapore', 'Singapore',
    'SYD', 'Sydney', 'Australia',
    (CURRENT_DATE + interval '3 days' + interval '19 hours')::timestamptz,
    (CURRENT_DATE + interval '4 days' + interval '2 hours 30 minutes')::timestamptz,
    7200.00, 24000.00, 48000.00,
    'scheduled'
),

-- Route 4: BOM → BKK  (approx 4.5 h flight)
-- Flight 7: 4 days from now
(
    'ZN-401', 'Zenith Airlines',
    'BOM', 'Mumbai', 'India',
    'BKK', 'Bangkok', 'Thailand',
    (CURRENT_DATE + interval '4 days' + interval '5 hours')::timestamptz,
    (CURRENT_DATE + interval '4 days' + interval '9 hours 30 minutes')::timestamptz,
    5500.00, 18000.00, 40000.00,
    'scheduled'
),
-- Flight 8: 4 days from now evening
(
    'ZN-402', 'Zenith Airlines',
    'BOM', 'Mumbai', 'India',
    'BKK', 'Bangkok', 'Thailand',
    (CURRENT_DATE + interval '4 days' + interval '17 hours')::timestamptz,
    (CURRENT_DATE + interval '4 days' + interval '21 hours 30 minutes')::timestamptz,
    4800.00, 16000.00, 37000.00,
    'scheduled'
);


-- ---------------------------------------------------------------------------
-- 2. GENERATE SEAT MAPS — 146 seats per flight × 8 flights = 1,168 rows
--
-- Layout:
--   First Class  : Rows 1-2,   Seats A,B,E,F         (2 × 4 =  8)
--   Business     : Rows 3-7,   Seats A,B,C,D,E,F     (5 × 6 = 30)
--   Economy      : Rows 8-25,  Seats A,B,C,D,E,F     (18× 6 =108)
--                                                      Total = 146
--
-- Prices are pulled from the parent flight row.
-- ~12% of seats are randomly marked unavailable via random() < 0.12.
-- ---------------------------------------------------------------------------
INSERT INTO seats (flight_id, seat_number, class, is_available, price)

-- First Class seats (rows 1-2, columns A/B/E/F)
SELECT
    f.id                                          AS flight_id,
    r.row_num::text || col.letter                 AS seat_number,
    'first'                                       AS class,
    (random() >= 0.12)                            AS is_available,   -- ~12% unavailable
    f.price_first                                 AS price
FROM flights f
CROSS JOIN generate_series(1, 2) AS r(row_num)
CROSS JOIN (VALUES ('A'),('B'),('E'),('F')) AS col(letter)

UNION ALL

-- Business Class seats (rows 3-7, columns A-F)
SELECT
    f.id,
    r.row_num::text || col.letter,
    'business',
    (random() >= 0.12),
    f.price_business
FROM flights f
CROSS JOIN generate_series(3, 7) AS r(row_num)
CROSS JOIN (VALUES ('A'),('B'),('C'),('D'),('E'),('F')) AS col(letter)

UNION ALL

-- Economy Class seats (rows 8-25, columns A-F)
SELECT
    f.id,
    r.row_num::text || col.letter,
    'economy',
    (random() >= 0.12),
    f.price_economy
FROM flights f
CROSS JOIN generate_series(8, 25) AS r(row_num)
CROSS JOIN (VALUES ('A'),('B'),('C'),('D'),('E'),('F')) AS col(letter);


-- ---------------------------------------------------------------------------
-- Quick sanity check (optional — remove in production)
-- ---------------------------------------------------------------------------
-- SELECT
--     f.flight_number,
--     s.class,
--     count(*)                                     AS total_seats,
--     count(*) FILTER (WHERE s.is_available)       AS available,
--     count(*) FILTER (WHERE NOT s.is_available)   AS occupied
-- FROM seats s
-- JOIN flights f ON f.id = s.flight_id
-- GROUP BY f.flight_number, s.class
-- ORDER BY f.flight_number, s.class;
