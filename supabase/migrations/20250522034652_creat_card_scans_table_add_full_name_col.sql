-- Add full_name column to card_activations table
ALTER TABLE card_activations 
ADD COLUMN full_name TEXT,
ADD CONSTRAINT valid_full_name CHECK (full_name ~* '^[A-Za-z\s-]{2,100}$');

-- Update the public view to include full_name
DROP VIEW IF EXISTS public.card_status;
CREATE VIEW public.card_status AS
SELECT 
    card_uid,
    mezo_id,
    full_name,
    activated,
    balance,
    last_modified
FROM card_activations;

-- Grant access to the view
GRANT SELECT ON public.card_status TO anon, authenticated;
