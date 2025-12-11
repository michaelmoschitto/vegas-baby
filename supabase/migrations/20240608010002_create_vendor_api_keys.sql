-- Create vendor_api_keys table
CREATE TABLE vendor_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    key_id TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT valid_key_id CHECK (key_id ~* '^[A-Za-z0-9]{32}$')
);

-- Create indexes for faster lookups
CREATE INDEX idx_vendor_api_keys_vendor_id ON vendor_api_keys(vendor_id);
CREATE INDEX idx_vendor_api_keys_key_id ON vendor_api_keys(key_id);

-- Enable Row Level Security
ALTER TABLE vendor_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can only see their own API keys"
    ON vendor_api_keys
    FOR SELECT
    USING (auth.uid() = vendor_id);

CREATE POLICY "Service role has full access"
    ON vendor_api_keys
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create function to update last_used_at
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_used_at
CREATE TRIGGER update_vendor_api_keys_last_used
    BEFORE UPDATE ON vendor_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_last_used(); 