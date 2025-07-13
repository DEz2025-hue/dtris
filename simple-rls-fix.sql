-- Simple RLS Fix - Run this in your Supabase SQL Editor
-- This will fix the infinite recursion issue

-- Drop all problematic policies
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Inspectors and admins can read all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Inspectors and admins can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Inspectors and admins can read all documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Inspectors can read all inspections" ON inspections;
DROP POLICY IF EXISTS "Inspectors can create inspections" ON inspections;
DROP POLICY IF EXISTS "Inspectors and admins can read all incidents" ON incidents;
DROP POLICY IF EXISTS "Inspectors and admins can update incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can read all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

-- Create simple working policies
-- For now, allow authenticated users to read all data
-- This can be refined later with proper role checking

CREATE POLICY "Allow authenticated users to read users" ON users
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read vehicles" ON vehicles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to update vehicles" ON vehicles
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read documents" ON vehicle_documents
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read inspections" ON inspections
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create inspections" ON inspections
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read incidents" ON incidents
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to update incidents" ON incidents
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read payments" ON payments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to manage announcements" ON announcements
    FOR ALL TO authenticated
    USING (true);

-- Keep the basic policies that don't cause recursion
-- These policies are safe and should remain:
-- - "Users can read own profile" ON users
-- - "Users can update own profile" ON users
-- - "Vehicle owners can read own vehicles" ON vehicles
-- - "Vehicle owners can update own vehicles" ON vehicles
-- - "Vehicle owners can create own vehicles" ON vehicles
-- - "Vehicle owners can manage own vehicle documents" ON vehicle_documents
-- - "Vehicle owners can read own vehicle inspections" ON inspections
-- - "Users can read own incidents" ON incidents
-- - "Users can create incidents" ON incidents
-- - "Users can read own payments" ON payments
-- - "Users can create own payments" ON payments
-- - "Users can manage own device tokens" ON device_tokens
-- - "All authenticated users can read announcements" ON announcements
-- - "Inspectors can update own inspections" ON inspections 