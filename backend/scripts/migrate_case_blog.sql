-- Samakan kontrak case_studies dengan kebutuhan landing (result, logo, mockup,
-- year, website, client, excerpt). Idempoten: aman dijalankan ulang.
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS client VARCHAR(255);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS result VARCHAR(255);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS mockup TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS year VARCHAR(16);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS website TEXT;

-- Isi data seed lama agar kartu landing tidak kosong.
UPDATE case_studies SET client='Nexora', result='+112% signup conversion', excerpt=content, mockup=hero_image, year='2026', website='#' WHERE slug='nexora-rebrand' AND client IS NULL;
UPDATE case_studies SET client='Kopi Lantai', result='3 new outlets in 90 days', excerpt=content, mockup=hero_image, year='2026', website='#' WHERE slug='kopi-lantai' AND client IS NULL;
UPDATE case_studies SET client='Maison Rue', result='+68% average order value', excerpt=content, mockup=hero_image, year='2026', website='#' WHERE slug='maison-rue' AND client IS NULL;
UPDATE case_studies SET client='VitalCare', result='4.9 rating across 2k reviews', excerpt=content, mockup=hero_image, year='2026', website='#' WHERE slug='vitalcare' AND client IS NULL;
