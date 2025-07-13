-- User Policies for ClaMax DTRIS
-- Run this in your Supabase SQL Editor

-- Allow admins to delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Allow admins to update users (for suspend/activate functionality)
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Check if policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname IN ('Admins can delete users', 'Admins can update users'); 