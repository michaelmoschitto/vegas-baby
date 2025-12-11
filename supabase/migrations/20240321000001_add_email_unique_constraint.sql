-- Add unique constraint to email field
ALTER TABLE card_activations
ADD CONSTRAINT unique_email UNIQUE (email);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT unique_email ON card_activations IS 'Ensures that each email address can only be used once in the system'; 