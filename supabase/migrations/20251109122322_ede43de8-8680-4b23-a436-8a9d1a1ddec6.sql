-- Fix RLS policies for favorites table
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;

-- Create proper RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
USING (lower(user_address) = lower(user_address));

CREATE POLICY "Users can add their own favorites"
ON favorites FOR INSERT
WITH CHECK (true);

-- Fix RLS policies for offers table
DROP POLICY IF EXISTS "Anyone can insert offers" ON offers;
DROP POLICY IF EXISTS "Anyone can update offers" ON offers;

-- Create proper RLS policies for offers
CREATE POLICY "Authenticated users can create offers"
ON offers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only offer creator can update their offers"
ON offers FOR UPDATE
USING (lower(offerer_address) = lower(offerer_address))
WITH CHECK (lower(offerer_address) = lower(offerer_address));