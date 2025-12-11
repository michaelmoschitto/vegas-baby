-- Create vendors table for POS system
CREATE TABLE vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    default_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendor_name_unique UNIQUE (name)
);

-- Index for faster lookups by name
CREATE INDEX idx_vendor_name ON vendors(name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on update
CREATE TRIGGER update_vendor_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_updated_at();

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON vendors
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users" ON vendors
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON vendors
    FOR UPDATE
    USING (true)
    WITH CHECK (true); 