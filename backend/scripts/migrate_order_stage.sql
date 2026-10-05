-- Pisah tahap desain dari status bayar. Idempoten.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stage VARCHAR(50) NOT NULL DEFAULT 'brief';
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS stage_to VARCHAR(50);
-- Backfill tahap dari status lama.
UPDATE orders SET stage='concepts' WHERE status='in_progress' AND stage='brief';
UPDATE orders SET stage='revision' WHERE status='revision' AND stage='brief';
UPDATE orders SET stage='delivery' WHERE status='completed' AND stage='brief';
UPDATE orders SET stage='done' WHERE status='delivered' AND stage='brief';
