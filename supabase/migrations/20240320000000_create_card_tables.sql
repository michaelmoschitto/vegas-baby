-- Create card_activations table
CREATE TABLE card_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_uid TEXT NOT NULL UNIQUE,
    mezo_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    activated BOOLEAN DEFAULT false,
    balance DECIMAL(10,2) DEFAULT 0.00,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_mezo_id CHECK (mezo_id ~* '^[A-Za-z0-9]{3,}$')
);

-- Create indexes for faster lookups
CREATE INDEX idx_card_activations_card_uid ON card_activations(card_uid);
CREATE INDEX idx_card_activations_mezo_id ON card_activations(mezo_id);
CREATE INDEX idx_card_activations_email ON card_activations(email);

-- Create function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_modified
CREATE TRIGGER update_card_activations_last_modified
    BEFORE UPDATE ON card_activations
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

-- Enable Row Level Security
ALTER TABLE card_activations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON card_activations
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON card_activations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON card_activations
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create view for public card status (without sensitive data)
CREATE VIEW public.card_status AS
SELECT 
    card_uid,
    mezo_id,
    activated,
    balance,
    last_modified
FROM card_activations;

-- Grant access to the view
GRANT SELECT ON public.card_status TO anon, authenticated; 