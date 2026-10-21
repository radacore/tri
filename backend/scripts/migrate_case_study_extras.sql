-- Field tambahan case study agar setara halaman Logomint (service, deliverables,
-- galeri multi-gambar, dan testimoni). Idempoten: aman dijalankan ulang.
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS service VARCHAR(100);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS deliverables TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS testimonial_quote TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS testimonial_author VARCHAR(255);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS testimonial_role VARCHAR(255);

-- Backfill: case lama tampil persis seperti sebelumnya.
UPDATE case_studies SET service = 'Brand identity' WHERE service IS NULL;
UPDATE case_studies
   SET deliverables = ARRAY['Logo design','Logo variations','Typography','Color palette','Brand mockups','Social media kit']
 WHERE deliverables = '{}';
