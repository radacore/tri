-- Seed dummy yang selaras dengan konten fallback frontend (localhost:4321).
-- Jalankan: PGPASSWORD=logopulse_dev psql -h localhost -U logopulse -d logopulse -f backend/scripts/seed.sql

-- Admin (password: admin123)
INSERT INTO users (email, password, name, role) VALUES
  ('admin@logopulse.co', '$2a$10$Z13qfm.DhRIMBVMJbSqyE.Q1qRoOvkGFWB9uAn9xxSgCM3CLAhBQe', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Portfolio (8 item, sama seperti homepage)
INSERT INTO portfolio_items (title, category, image_url, description, featured, published, sort_order) VALUES
  ('Nexora SaaS', 'Tech', 'https://picsum.photos/seed/nexora/600/450.webp', 'SaaS rebrand', TRUE, TRUE, 1),
  ('Kopi Lantai', 'F&B', 'https://picsum.photos/seed/kopi/600/450.webp', 'Coffee brand', TRUE, TRUE, 2),
  ('Maison Rue', 'Fashion', 'https://picsum.photos/seed/maison/600/450.webp', 'Fashion identity', TRUE, TRUE, 3),
  ('VitalCare', 'Health', 'https://picsum.photos/seed/vital/600/450.webp', 'Health identity', TRUE, TRUE, 4),
  ('Cloudgrid', 'Tech', 'https://picsum.photos/seed/cloudgrid/600/450.webp', 'Cloud logo', FALSE, TRUE, 5),
  ('Saffron House', 'F&B', 'https://picsum.photos/seed/saffron/600/450.webp', 'Restaurant brand', FALSE, TRUE, 6),
  ('Atelier Nord', 'Fashion', 'https://picsum.photos/seed/atelier/600/450.webp', 'Atelier mark', FALSE, TRUE, 7),
  ('PulseFit', 'Health', 'https://picsum.photos/seed/pulsefit/600/450.webp', 'Fitness brand', FALSE, TRUE, 8)
ON CONFLICT DO NOTHING;

-- Case studies (4)
INSERT INTO case_studies (title, slug, industry, hero_image, content, published) VALUES
  ('Nexora doubles signup conversion', 'nexora-rebrand', 'SaaS', 'https://picsum.photos/seed/nexora-mockup/600/450.webp', 'A 48-hour rebrand that turned a generic SaaS mark into a conversion asset.', TRUE),
  ('Kopi Lantai brews a franchise-ready brand', 'kopi-lantai', 'F&B', 'https://picsum.photos/seed/kopi-mockup/600/450.webp', 'Warm, memorable identity built for cups, signage, and social.', TRUE),
  ('Maison Rue goes premium', 'maison-rue', 'Fashion', 'https://picsum.photos/seed/maison-mockup/600/450.webp', 'Serif wordmark and system that lifted perceived value overnight.', TRUE),
  ('VitalCare earns patient trust', 'vitalcare', 'Health', 'https://picsum.photos/seed/vital-mockup/600/450.webp', 'Calm, clinical identity designed for trust at first glance.', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Blog (3)
INSERT INTO blog_posts (title, slug, content, category, thumbnail_url, published, published_at) VALUES
  ('How much does a logo cost in 2026?', 'logo-design-cost-2026', 'Freelancer vs agency vs LogoPulse — honest numbers.', 'Pricing', 'https://picsum.photos/seed/blog-cost/800/450.webp', TRUE, NOW() - INTERVAL '20 days'),
  ('The 10-point rebrand checklist', 'rebrand-checklist', 'Know exactly when your startup has outgrown its logo.', 'Guides', 'https://picsum.photos/seed/blog-checklist/800/450.webp', TRUE, NOW() - INTERVAL '38 days'),
  ('7 logo mistakes that scare customers away', 'logo-mistakes', 'Fix these before your next launch.', 'Guides', 'https://picsum.photos/seed/blog-mistakes/800/450.webp', TRUE, NOW() - INTERVAL '60 days')
ON CONFLICT (slug) DO NOTHING;

-- Testimonials (6, sama seperti hanging marquee)
INSERT INTO testimonials (name, position, company, photo_url, quote, rating, featured, published) VALUES
  ('Sarah Chen', 'Founder', 'Nexora', 'https://i.pravatar.cc/96?img=47', 'Two concepts on day one, final files on day two. Our signup page finally looks like the product we built.', 5, TRUE, TRUE),
  ('Daniel Okafor', 'CEO', 'Cloudgrid', 'https://i.pravatar.cc/96?img=12', 'The money-back guarantee sold me. The quality kept me. Best $149 I have spent on this company.', 5, TRUE, TRUE),
  ('Maria Santos', 'Owner', 'Saffron House', 'https://i.pravatar.cc/96?img=32', 'Customers photograph our cups now. The logo paid for itself within a month.', 5, FALSE, TRUE),
  ('James Wright', 'CMO', 'VitalCare', 'https://i.pravatar.cc/96?img=59', 'Professional process, zero chasing. Revisions came back fast and actually better.', 5, FALSE, TRUE),
  ('Aisha Rahman', 'Founder', 'Atelier Nord', 'https://i.pravatar.cc/96?img=45', 'It feels like a $5k agency identity. Investors noticed immediately.', 5, FALSE, TRUE),
  ('Tom Becker', 'Founder', 'PulseFit', 'https://i.pravatar.cc/96?img=68', 'Delivered in 48 hours as promised. The brand kit saved our designer weeks.', 5, FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Client logos (8, marquee homepage)
INSERT INTO client_logos (name, logo_url, sort_order) VALUES
  ('NEXORA', 'https://picsum.photos/seed/logo-nexora/200/80.webp', 1),
  ('Cloudgrid', 'https://picsum.photos/seed/logo-cloud/200/80.webp', 2),
  ('Saffron&Co', 'https://picsum.photos/seed/logo-saffron/200/80.webp', 3),
  ('VitalCare', 'https://picsum.photos/seed/logo-vital/200/80.webp', 4),
  ('Atelier Nord', 'https://picsum.photos/seed/logo-atelier/200/80.webp', 5),
  ('PulseFit', 'https://picsum.photos/seed/logo-pulse/200/80.webp', 6),
  ('Kopi Lantai', 'https://picsum.photos/seed/logo-kopi/200/80.webp', 7),
  ('Maison Rue', 'https://picsum.photos/seed/logo-maison/200/80.webp', 8)
ON CONFLICT DO NOTHING;

-- Orders contoh di tiap status
INSERT INTO orders (customer_name, customer_email, package_tier, status, brief, amount, currency, paid_at) VALUES
  ('Sarah Chen', 'sarah@nexora.io', 'professional', 'completed',
   '{"name":"Sarah Chen","business":"Nexora","industry":"SaaS","vibes":["minimalis","berani"],"colors":["Blue"],"notes":"Modern fintech look"}',
   14900, 'USD', NOW() - INTERVAL '5 days'),
  ('Daniel Okafor', 'dan@cloudgrid.io', 'professional', 'paid',
   '{"name":"Daniel Okafor","business":"Cloudgrid","industry":"Tech","vibes":["futuristis"],"colors":["Black","Blue"]}',
   14900, 'USD', NOW() - INTERVAL '1 day'),
  ('Maria Santos', 'maria@saffronhouse.id', 'starter', 'in_progress',
   '{"name":"Maria Santos","business":"Saffron House","industry":"F&B","vibes":["elegan","mewah"],"colors":["Emas"]}',
   4900, 'USD', NOW() - INTERVAL '2 hours'),
  ('Tom Becker', 'tom@pulsefit.co', 'premium', 'pending',
   '{"name":"Tom Becker","business":"PulseFit","industry":"Health","vibes":["berani","futuristis"],"colors":["Green","Black"]}',
   39900, 'USD', NULL)
ON CONFLICT DO NOTHING;

-- Website Identity defaults (dikelola dari admin /identity, dibaca landing)
INSERT INTO site_settings (key, value) VALUES
 ('hero', '{"badge":"ACCEPTING NEW PROJECTS — 3 SLOTS LEFT THIS WEEK","t1":"A logo that sells,","t2":"ready in 48 hours","t3":" — or your ","t4":"money back","sub":"Custom logo & brand identity for startups. From $49. No templates, no contests, no waiting weeks.","cta1":"View Pricing — from $49","cta2":"See Our Work","s1v":"48h","s1l":"avg. delivery","s2v":"2,400+","s2l":"logos delivered","s3v":"100%","s3l":"money-back promise"}'),
 ('sections', '{"logos_heading":"Trusted by 2,400+ startups","cases_kicker":"Case studies","cases_title":"Logos that moved the numbers","cases_all":"All case studies →","pf_kicker":"Portfolio","pf_title":"Fresh work, shipped weekly","how_kicker":"How it works","how_title":"From brief to brand in 4 steps","price_kicker":"Pricing","price_title":"One payment. Yours forever.","price_sub":"No subscriptions. 100% money-back guarantee on every plan.","rev_kicker":"Reviews","rev_title":"Loved by founders worldwide","rev_sub":"★ 4.9 average across 500+ verified orders","guar_title":"100% money-back guarantee","guar_text":"If the first concepts don''t excite you, we refund every cent within 7 days. No forms, no hard feelings.","faq_kicker":"FAQ","faq_title":"Questions, answered","cta_kicker":"100% money-back guarantee","cta_t1":"Your new logo is ","cta_t2":"48 hours","cta_t3":" away","cta_sub":"Join 2,400+ founders who stopped worrying about branding and got back to building.","cta_b1":"Start My Logo — $149","cta_b2":"Browse Case Studies"}'),
 ('faqs', '[{"q":"How fast is delivery, really?","a":"First concepts land within 48 hours of your brief. Most projects finalize within 3–5 days including revisions."},{"q":"What if I hate the designs?","a":"Then you pay nothing. Every plan carries a 100% money-back guarantee — just tell us within 7 days and we refund you in full."},{"q":"Do I own the logo?","a":"Yes. Full ownership transfers to you on delivery, including vector source files and a signed transfer note on Premium."},{"q":"What files do I get?","a":"Starter: PNG + JPG. Professional and Premium add AI, SVG, EPS, PDF vectors plus color/font guides and social packs."},{"q":"How do revisions work?","a":"Reply with notes and we turn a new round around fast — usually same-day. Professional includes unlimited rounds for 7 days."},{"q":"Can you match my existing brand?","a":"Absolutely. Share your colors, fonts, or references in the brief and we design within (or evolve) your system."}]'),
 ('media', '{"logo_url":"","og_image":""}'),
 ('footer', '{"tagline":"Custom logo & brand identity for startups. Ready in 48 hours, guaranteed.","x_url":"https://x.com","instagram_url":"https://instagram.com","dribbble_url":"https://dribbble.com","linkedin_url":"https://linkedin.com","rating":"★ 4.9/5 from 500+ verified reviews","copyright":"© 2026 LogoPulse. All rights reserved. Made for founders who ship."}')
ON CONFLICT (key) DO NOTHING;

-- Website Identity: pricing penuh + how steps (upsert agar ikut update)
INSERT INTO site_settings (key, value) VALUES
 ('pricing', '{"currency": "USD", "tiers": [{"id": "starter", "name": "Starter", "price_cents": 4900, "tag": "Logo only", "cta": "Start with Starter", "features": ["1 original logo concept", "2 revision rounds", "48-hour delivery", "PNG + JPG files", "100% money-back"]}, {"id": "professional", "name": "Professional", "price_cents": 14900, "tag": "Most popular", "cta": "Choose Professional", "features": ["3 original logo concepts", "Unlimited revisions (7 days)", "48-hour delivery", "Full vector kit (AI, SVG, EPS, PDF)", "Brand mini-guide (colors + fonts)", "Social media pack", "100% money-back"], "popular": true}, {"id": "premium", "name": "Premium", "price_cents": 39900, "tag": "Full identity", "cta": "Go Premium", "features": ["Everything in Professional", "Complete brand identity system", "Stationery + mockup suite", "Brand guideline book (12+ pages)", "Priority 24-hour support", "100% money-back"]}]}'),
 ('how_steps', '[{"t": "Brief", "d": "Tell us about your business, style, and competitors in a 5-minute form."}, {"t": "Concepts", "d": "Get 2\u20133 original logo concepts within 48 hours. No templates, ever."}, {"t": "Revisions", "d": "Unlimited-tweak rounds until it feels exactly right (most finish in 1\u20132)."}, {"t": "Delivery", "d": "Full brand kit: vector files, colors, fonts, mockups, social pack."}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Website Identity: highlight + teks kecil (upsert)
INSERT INTO site_settings (key, value) VALUES
 ('highlight', '{"quote":"“We looked like a weekend project. Two days later we looked fundable — our demo-day deck finally matched our ambition.”","role":"Founder, Nexora — raised $1.2M after rebrand"}'),
 ('sections', '{"logos_heading":"Trusted by 2,400+ startups","badge_by":"by 500+ founders","price_popular":"Most Popular","price_onetime":" one-time"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value || (SELECT value FROM site_settings WHERE key = EXCLUDED.key), updated_at = NOW();
