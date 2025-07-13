-- Fix RLS Policies to prevent infinite recursion
-- This script should be run in your Supabase SQL Editor

-- Drop existing policies that cause recursion
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

-- Create new policies that use auth.jwt() instead of querying users table
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can create users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    );

CREATE POLICY "Inspectors and admins can read all vehicles" ON vehicles
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Inspectors and admins can update vehicles" ON vehicles
    FOR UPDATE TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Inspectors and admins can read all documents" ON vehicle_documents
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Inspectors can read all inspections" ON inspections
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Inspectors can create inspections" ON inspections
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Inspectors and admins can read all incidents" ON incidents
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Inspectors and admins can update incidents" ON incidents
    FOR UPDATE TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
    );

CREATE POLICY "Admins can read all payments" ON payments
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL TO authenticated
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Alternative approach: Create a function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to use the function
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;

CREATE POLICY "Admins can read all users" ON users
    FOR SELECT TO authenticated
    USING (get_user_role() = 'admin');

CREATE POLICY "Admins can create users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() = 'admin');

-- Update other policies
DROP POLICY IF EXISTS "Inspectors and admins can read all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Inspectors and admins can update vehicles" ON vehicles;

CREATE POLICY "Inspectors and admins can read all vehicles" ON vehicles
    FOR SELECT TO authenticated
    USING (get_user_role() IN ('inspector', 'admin'));

CREATE POLICY "Inspectors and admins can update vehicles" ON vehicles
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('inspector', 'admin'));

-- Continue with other tables...
DROP POLICY IF EXISTS "Inspectors and admins can read all documents" ON vehicle_documents;
CREATE POLICY "Inspectors and admins can read all documents" ON vehicle_documents
    FOR SELECT TO authenticated
    USING (get_user_role() IN ('inspector', 'admin'));

DROP POLICY IF EXISTS "Inspectors can read all inspections" ON inspections;
DROP POLICY IF EXISTS "Inspectors can create inspections" ON inspections;

CREATE POLICY "Inspectors can read all inspections" ON inspections
    FOR SELECT TO authenticated
    USING (get_user_role() IN ('inspector', 'admin'));

CREATE POLICY "Inspectors can create inspections" ON inspections
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('inspector', 'admin'));

DROP POLICY IF EXISTS "Inspectors and admins can read all incidents" ON incidents;
DROP POLICY IF EXISTS "Inspectors and admins can update incidents" ON incidents;

CREATE POLICY "Inspectors and admins can read all incidents" ON incidents
    FOR SELECT TO authenticated
    USING (get_user_role() IN ('inspector', 'admin'));

CREATE POLICY "Inspectors and admins can update incidents" ON incidents
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('inspector', 'admin'));

DROP POLICY IF EXISTS "Admins can read all payments" ON payments;
CREATE POLICY "Admins can read all payments" ON payments
    FOR SELECT TO authenticated
    USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin'); 