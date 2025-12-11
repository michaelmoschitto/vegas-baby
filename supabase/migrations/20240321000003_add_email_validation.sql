-- Add email format validation constraint
ALTER TABLE card_activations
ADD CONSTRAINT valid_email_format CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
  email !~ '\.{2,}' AND -- No consecutive dots
  email !~ '^\..*' AND -- Doesn't start with dot
  email !~ '.*@\.' AND -- No dot immediately after @
  email !~ '.*@@.*' -- No double @
);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT valid_email_format ON card_activations IS 'Ensures that email addresses follow a valid format';

-- Add index for email lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_card_activations_email ON card_activations(email); 