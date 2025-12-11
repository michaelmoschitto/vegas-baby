-- Migration to update foreign key constraint to enable CASCADE deletion
-- This allows card_activations to be deleted along with their related transactions

-- Drop the existing foreign key constraint
ALTER TABLE transactions 
DROP CONSTRAINT fk_card_uid;

-- Re-create the foreign key constraint with ON DELETE CASCADE
ALTER TABLE transactions 
ADD CONSTRAINT fk_card_uid 
FOREIGN KEY (card_uid) 
REFERENCES card_activations(card_uid) 
ON DELETE CASCADE;

