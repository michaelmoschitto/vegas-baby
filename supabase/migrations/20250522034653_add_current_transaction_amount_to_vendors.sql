-- Add current_transaction_amount column to vendors table
-- This allows the POS to set the current price that will be used for the next transaction
ALTER TABLE vendors 
ADD COLUMN current_transaction_amount DECIMAL(10,2);

-- Set initial value to be the same as default_price
UPDATE vendors 
SET current_transaction_amount = default_price 
WHERE current_transaction_amount IS NULL; 