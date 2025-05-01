-- =============================================================================
-- Fix Data for Tour ID 3: "Все включено в Турции"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Update the Tour's City
-- -----------------------------------------------------------------------------
-- Assumption: The correct city for this tour is Antalya, and its ID in the
-- `cities` table is 6. Verify this ID if necessary by running:
-- SELECT id FROM cities WHERE name = 'Анталья';
--
-- Update the `city_id` for Tour ID 3 to point to Antalya (assumed ID 6).
UPDATE tours
SET city_id = 6
WHERE id = 3;

-- -----------------------------------------------------------------------------
-- Step 2: Clean Up Existing Invalid Dates
-- -----------------------------------------------------------------------------
-- Remove any potentially invalid or incorrect date records associated with
-- Tour ID 3 before inserting new, valid ones.
DELETE FROM tour_dates
WHERE tour_id = 3;

-- -----------------------------------------------------------------------------
-- Step 3: Insert Valid Tour Dates
-- -----------------------------------------------------------------------------
-- Add several valid date ranges for Tour ID 3 with varying price modifiers
-- to ensure different pricing options are available.
-- Adjust dates, availability, and modifiers as needed for realism.
-- The schema uses 'availability' for available seats, not 'total_seats' or 'available_seats'.
INSERT INTO tour_dates (tour_id, start_date, end_date, availability, price_modifier)
VALUES
    (3, '2025-06-15', '2025-06-25', 50, 1.0),  -- Standard price
    (3, '2025-07-01', '2025-07-10', 48, 1.1),  -- High season price (+10%)
    (3, '2025-07-15', '2025-07-25', 45, 1.1),  -- High season price (+10%)
    (3, '2025-08-10', '2025-08-20', 40, 1.05), -- Late summer price (+5%)
    (3, '2025-09-05', '2025-09-15', 60, 0.95); -- Shoulder season price (-5%)

-- -----------------------------------------------------------------------------
-- Step 4: Verify Hotel Availability (Manual Check Recommended)
-- -----------------------------------------------------------------------------
-- After updating the city_id, ensure there are active hotels available in
-- Antalya (city_id = 6) and that they have rooms defined.
--
-- Check for active hotels in the correct city:
-- SELECT id, name, is_active FROM hotels WHERE city_id = 6 AND is_active = true;
--
-- If active hotels exist, check if they have rooms:
-- SELECT * FROM rooms WHERE hotel_id IN (SELECT id FROM hotels WHERE city_id = 6 AND is_active = true);
--
-- If no active hotels or rooms are found for Antalya, you may need to add
-- hotel/room data or activate existing hotels (`UPDATE hotels SET is_active = true WHERE ...`).

-- =============================================================================
-- General Guidance for Other Tours
-- =============================================================================
-- To fix similar issues (incorrect location, missing/invalid dates) for other
-- tours, follow a similar process:
-- 1. Identify the correct `city_id` for the tour's intended location.
-- 2. Update the `tours` table with the correct `city_id` for that tour's `id`.
-- 3. Delete any existing incorrect `tour_dates` for that `tour_id`.
-- 4. Insert valid `tour_dates` records with appropriate start/end dates,
--    seat counts, and price modifiers.
-- 5. Manually verify that active hotels and rooms exist for the corrected city.
-- =============================================================================
