-- Drop the existing constraint
ALTER TABLE card_activations DROP CONSTRAINT IF EXISTS valid_mezo_id;

-- Add the new constraint with improved RFC1034 patterns and required .mezo suffix
ALTER TABLE card_activations ADD CONSTRAINT valid_mezo_id CHECK (
  mezo_id ~* '^[A-Za-z]([A-Za-z0-9-]*[A-Za-z0-9])?\.mezo$' AND  -- Start with letter, optionally followed by more chars ending in alphanumeric
  mezo_id !~ '0x' AND                           -- No 0x
  mezo_id !~ '^(?:bc1|tb1|[a-z]pub|[a-z]priv)' AND  -- No Bitcoin magic strings
  mezo_id !~ '^m[0-9]+' AND                     -- No m + numeric string
  length(regexp_replace(mezo_id, '\.mezo$', '')) <= 15  -- Max 15 chars before .mezo
);