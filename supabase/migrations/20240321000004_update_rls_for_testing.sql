-- Allow service role to bypass RLS
ALTER TABLE card_activations FORCE ROW LEVEL SECURITY;
ALTER TABLE card_activations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON card_activations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON card_activations;
DROP POLICY IF EXISTS "Allow service role full access" ON card_activations;

-- Create new policies that allow test operations
CREATE POLICY "Enable insert for tests and authenticated users" ON card_activations
    FOR INSERT
    WITH CHECK (
        (auth.role() = 'authenticated') OR
        (card_uid LIKE 'test-email-%' OR card_uid LIKE 'test-card-%')
    );

CREATE POLICY "Enable update for tests and authenticated users" ON card_activations
    FOR UPDATE
    USING (
        (auth.role() = 'authenticated') OR
        (card_uid LIKE 'test-email-%' OR card_uid LIKE 'test-card-%')
    )
    WITH CHECK (
        (auth.role() = 'authenticated') OR
        (card_uid LIKE 'test-email-%' OR card_uid LIKE 'test-card-%')
    );

CREATE POLICY "Enable delete for tests" ON card_activations
    FOR DELETE
    USING (card_uid LIKE 'test-email-%' OR card_uid LIKE 'test-card-%');

-- Add comment to explain the policies
COMMENT ON POLICY "Enable insert for tests and authenticated users" ON card_activations IS 'Allows inserts for authenticated users and test data';
COMMENT ON POLICY "Enable update for tests and authenticated users" ON card_activations IS 'Allows updates for authenticated users and test data';
COMMENT ON POLICY "Enable delete for tests" ON card_activations IS 'Allows deletion of test data'; 