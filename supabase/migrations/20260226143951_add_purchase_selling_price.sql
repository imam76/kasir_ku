/*
  # Add purchase_price and selling_price to products table

  1. Changes
    - Add purchase_price column to products table
    - Add selling_price column to products table
    - Drop old price column (migrate data to selling_price)
    - Update transaction_items to include purchase_price snapshot

  2. Migration Strategy
    - First add new columns
    - Migrate existing price to selling_price
    - Update transaction_items schema
*/

-- Add new price columns to products
ALTER TABLE products
ADD COLUMN purchase_price numeric(10, 2) DEFAULT 0,
ADD COLUMN selling_price numeric(10, 2) DEFAULT 0;

-- Migrate existing price data to selling_price
UPDATE products
SET selling_price = price,
    purchase_price = 0
WHERE selling_price = 0;

-- Add purchase_price column to transaction_items to track profit at time of transaction
ALTER TABLE transaction_items
ADD COLUMN purchase_price numeric(10, 2) DEFAULT 0,
ADD COLUMN profit numeric(10, 2) DEFAULT 0;

-- Drop old price column after data migration
ALTER TABLE products
DROP COLUMN price;

-- Create function to calculate profit when transaction item is inserted
CREATE OR REPLACE FUNCTION calculate_transaction_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profit := (NEW.price - NEW.purchase_price) * NEW.quantity;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction_items
DROP TRIGGER IF EXISTS trigger_calculate_transaction_profit ON transaction_items;
CREATE TRIGGER trigger_calculate_transaction_profit
  BEFORE INSERT ON transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_transaction_profit();
