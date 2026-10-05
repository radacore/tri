-- Transaksi manual + bukti + rekap order. Idempoten.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliverables TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS note TEXT;
