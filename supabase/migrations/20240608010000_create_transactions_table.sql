-- Create transactions table for POS system
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_uid TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    vendor_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_card_uid FOREIGN KEY (card_uid) REFERENCES card_activations(card_uid) ON DELETE RESTRICT,
    CONSTRAINT fk_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT
);

-- Indexes for faster lookups
CREATE INDEX idx_transactions_card_uid ON transactions(card_uid);
CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON transactions
    FOR SELECT
    USING (true);

-- Remove the old insert policy if it exists
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;

-- Add a new policy to allow all users to insert
CREATE POLICY "Enable insert for all users" ON transactions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for service role only" ON transactions
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); 