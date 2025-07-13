/*
  ClaMax DTRIS Database Setup
  Copy and paste this entire file into your Supabase SQL Editor
*/

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('owner', 'inspector', 'admin');
CREATE TYPE vehicle_status AS ENUM ('active', 'expired', 'suspended');
CREATE TYPE document_type AS ENUM ('insurance', 'license', 'registration', 'other');
CREATE TYPE inspection_status AS ENUM ('pass', 'fail', 'conditional');
CREATE TYPE incident_type AS ENUM ('accident', 'violation', 'theft', 'other');
CREATE TYPE incident_status AS ENUM ('reported', 'investigating', 'resolved');
CREATE TYPE payment_type AS ENUM ('registration', 'inspection', 'insurance', 'fine');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role NOT NULL DEFAULT 'owner',
    phone text,
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_plate text UNIQUE NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    color text NOT NULL,
    vin text UNIQUE NOT NULL,
    registration_date timestamptz DEFAULT now(),
    expiration_date timestamptz NOT NULL,
    status vehicle_status DEFAULT 'active',
    barcode text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT vehicles_year_check CHECK (year >= 1900 AND year <= EXTRACT(year FROM now()) + 1)
);

-- Vehicle documents table
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type text,
    expiration_date timestamptz,
    uploaded_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspector_id uuid NOT NULL REFERENCES users(id),
    inspector_name text NOT NULL,
    date timestamptz DEFAULT now(),
    status inspection_status NOT NULL,
    notes text,
    violations text[] DEFAULT '{}',
    next_inspection_due timestamptz,
    location text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
    reporter_id uuid NOT NULL REFERENCES users(id),
    type incident_type NOT NULL,
    description text NOT NULL,
    location text NOT NULL,
    date timestamptz DEFAULT now(),
    photos text[] DEFAULT '{}',
    status incident_status DEFAULT 'reported',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    type payment_type NOT NULL,
    status payment_status DEFAULT 'pending',
    date timestamptz DEFAULT now(),
    description text NOT NULL,
    transaction_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Device tokens table for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL,
    platform text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, token)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    date timestamptz DEFAULT now(),
    priority priority_level DEFAULT 'medium',
    target_role user_role,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
CREATE INDEX IF NOT EXISTS idx_incidents_vehicle_id ON incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_vehicle_id ON payments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Admins can create users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Vehicles policies
CREATE POLICY "Vehicle owners can read own vehicles" ON vehicles
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Vehicle owners can update own vehicles" ON vehicles
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Vehicle owners can create own vehicles" ON vehicles
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Inspectors and admins can read all vehicles" ON vehicles
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

CREATE POLICY "Inspectors and admins can update vehicles" ON vehicles
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

-- Vehicle documents policies
CREATE POLICY "Vehicle owners can manage own vehicle documents" ON vehicle_documents
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM vehicles 
        WHERE vehicles.id = vehicle_documents.vehicle_id AND vehicles.owner_id = auth.uid()
    ));

CREATE POLICY "Inspectors and admins can read all documents" ON vehicle_documents
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

-- Inspections policies
CREATE POLICY "Vehicle owners can read own vehicle inspections" ON inspections
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM vehicles 
        WHERE vehicles.id = inspections.vehicle_id AND vehicles.owner_id = auth.uid()
    ));

CREATE POLICY "Inspectors can read all inspections" ON inspections
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

CREATE POLICY "Inspectors can create inspections" ON inspections
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

CREATE POLICY "Inspectors can update own inspections" ON inspections
    FOR UPDATE TO authenticated
    USING (inspector_id = auth.uid());

-- Incidents policies
CREATE POLICY "Users can read own incidents" ON incidents
    FOR SELECT TO authenticated
    USING (reporter_id = auth.uid());

CREATE POLICY "Users can create incidents" ON incidents
    FOR INSERT TO authenticated
    WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Inspectors and admins can read all incidents" ON incidents
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

CREATE POLICY "Inspectors and admins can update incidents" ON incidents
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('inspector', 'admin')
    ));

-- Payments policies
CREATE POLICY "Users can read own payments" ON payments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all payments" ON payments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Device tokens policies
CREATE POLICY "Users can manage own device tokens" ON device_tokens
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Announcements policies
CREATE POLICY "All authenticated users can read announcements" ON announcements
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_documents_updated_at
    BEFORE UPDATE ON vehicle_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
    BEFORE UPDATE ON inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_tokens_updated_at
    BEFORE UPDATE ON device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 