-- Create card_scans table
CREATE TABLE card_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    card_uid TEXT NOT NULL,
    reader_name TEXT,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    CONSTRAINT valid_card_uid CHECK (card_uid ~* '^[A-Za-z0-9]{1,}$')
);

-- Create indexes for faster lookups
CREATE INDEX idx_card_scans_vendor_id ON card_scans(vendor_id);
CREATE INDEX idx_card_scans_card_uid ON card_scans(card_uid);
CREATE INDEX idx_card_scans_created_at ON card_scans(created_at);
CREATE INDEX idx_card_scans_processed ON card_scans(processed);

-- Enable Row Level Security
ALTER TABLE card_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can only see their own scans"
    ON card_scans
    FOR SELECT
    USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can only insert their own scans"
    ON card_scans
    FOR INSERT
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can only update their own scans"
    ON card_scans
    FOR UPDATE
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE card_scans;

-- Create function to update processed_at timestamp
CREATE OR REPLACE FUNCTION update_processed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.processed = true AND OLD.processed = false THEN
        NEW.processed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update processed_at
CREATE TRIGGER update_card_scans_processed_at
    BEFORE UPDATE ON card_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_processed_at();

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON card_scans TO authenticated;

-- Disable RLS for development
ALTER TABLE card_scans DISABLE ROW LEVEL SECURITY; 