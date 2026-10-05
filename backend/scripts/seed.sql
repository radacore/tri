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
INSERT INTO case_studies (title, slug, industry, hero_image, content, published, client, result, excerpt, year, website) VALUES
  ('Nexora doubles signup conversion', 'nexora-rebrand', 'SaaS', 'https://picsum.photos/seed/nexora-mockup/600/450.webp', 'A 48-hour rebrand that turned a generic SaaS mark into a conversion asset.', TRUE, 'Nexora', '+112% signup conversion', 'A 48-hour rebrand that turned a generic SaaS mark into a conversion asset.', '2026', '#'),
  ('Kopi Lantai brews a franchise-ready brand', 'kopi-lantai', 'F&B', 'https://picsum.photos/seed/kopi-mockup/600/450.webp', 'Warm, memorable identity built for cups, signage, and social.', TRUE, 'Kopi Lantai', '3 new outlets in 90 days', 'Warm, memorable identity built for cups, signage, and social.', '2026', '#'),
  ('Maison Rue goes premium', 'maison-rue', 'Fashion', 'https://picsum.photos/seed/maison-mockup/600/450.webp', 'Serif wordmark and system that lifted perceived value overnight.', TRUE, 'Maison Rue', '+68% average order value', 'Serif wordmark and system that lifted perceived value overnight.', '2026', '#'),
  ('VitalCare earns patient trust', 'vitalcare', 'Health', 'https://picsum.photos/seed/vital-mockup/600/450.webp', 'Calm, clinical identity designed for trust at first glance.', TRUE, 'VitalCare', '4.9 rating across 2k reviews', 'Calm, clinical identity designed for trust at first glance.', '2026', '#')
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
 ('media', '{"logo_url":"","og_image":"","favicon":""}'),
 ('footer', '{"tagline":"Custom logo & brand identity for startups. Ready in 48 hours, guaranteed.","x_url":"https://x.com","instagram_url":"https://instagram.com","dribbble_url":"https://dribbble.com","linkedin_url":"https://linkedin.com","rating":"★ 4.9/5 from 500+ verified reviews","copyright":"© 2026 LogoPulse. All rights reserved. Made for founders who ship."}')
ON CONFLICT (key) DO NOTHING;

-- Website Identity: pricing penuh + how steps (upsert agar ikut update)
INSERT INTO site_settings (key, value) VALUES
 ('pricing', '{"currency": "USD", "tiers": [{"id": "starter", "name": "Starter", "price_cents": 4900, "tag": "Logo only", "cta": "Start with Starter", "features": ["1 original logo concept", "2 revision rounds", "48-hour delivery", "PNG + JPG files", "100% money-back"]}, {"id": "professional", "name": "Professional", "price_cents": 14900, "tag": "Most popular", "cta": "Choose Professional", "features": ["3 original logo concepts", "Unlimited revisions (7 days)", "48-hour delivery", "Full vector kit (AI, SVG, EPS, PDF)", "Brand mini-guide (colors + fonts)", "Social media pack", "100% money-back"], "popular": true}, {"id": "premium", "name": "Premium", "price_cents": 39900, "tag": "Full identity", "cta": "Go Premium", "features": ["Everything in Professional", "Complete brand identity system", "Stationery + mockup suite", "Brand guideline book (12+ pages)", "Priority 24-hour support", "100% money-back"]}]}'),
 ('how_steps', '[{"t": "Brief", "d": "Tell us about your business, style, and competitors in a 5-minute form."}, {"t": "Concepts", "d": "Get 2\u20133 original logo concepts within 48 hours. No templates, ever."}, {"t": "Revisions", "d": "Unlimited-tweak rounds until it feels exactly right (most finish in 1\u20132)."}, {"t": "Delivery", "d": "Full brand kit: vector files, colors, fonts, mockups, social pack."}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Website Identity: highlight + teks kecil (upsert)

-- Website Identity: nav, contact, pages (upsert)
INSERT INTO site_settings (key, value) VALUES
 ('nav', '{"cta": "View Pricing"}'),
 ('contact', '{"email": "hello@logopulse.co", "wa_number": "6281241525485", "order_email": "hello@logopulse.co", "hours": "Mon\u2013Fri, 9:00\u201318:00 UTC"}'),
 ('pages', '{"order_kicker": "Order", "order_title": "Start your logo", "order_sub": "Fill a short brief, then send it straight via WhatsApp or email \u2014 no upfront payment.", "order_s1": "1 \u00b7 Brief", "order_s2": "2 \u00b7 Review", "order_s3": "3 \u00b7 Send", "order_f_name": "Your name", "order_ph_name": "Full name", "order_f_biz": "Company / brand name", "order_ph_biz": "Acme Inc.", "order_f_ind": "Industry", "order_ph_ind": "SaaS, caf\u00e9, fashion\u2026", "order_f_target": "Target market", "order_ph_target": "E.g. young moms 25\u201335, Jakarta", "order_f_contact": "Email or WhatsApp number", "order_ph_contact": "you@company.com / 0812\u2026", "order_f_vibe": "Style / vibe", "order_vibe_hint": "Pick up to 3 \u2014 this replaces the discovery call.", "order_f_color": "Color references", "order_f_custom": "Custom", "order_f_notes": "References / things to avoid", "order_ph_notes": "Links you love, styles to avoid\u2026", "order_review": "Review my brief \u2192", "order_review_title": "Review your order", "order_back": "\u2190 Back", "order_continue": "Continue to send \u2192", "order_send_title": "Send your order", "order_send_sub": "Pick how to send \u2014 your brief arrives neatly formatted. 100% money-back guarantee.", "order_wa": "Send via WhatsApp \u2192", "order_mail": "Send via Email \u2192", "contact_kicker": "Contact", "contact_title": "Say hello", "contact_sub": "Average reply time: under 4 business hours.", "about_kicker": "About", "about_title": "Designers who ship as fast as you do", "about_p1": "LogoPulse is a senior-only design team obsessed with one thing: giving startups a brand they are proud of \u2014 in 48 hours, not 6 weeks. Since 2022 we have delivered 2,400+ identities across SaaS, F&B, fashion, and health.", "about_p2": "No templates, no contests, no junior outsourcing. Every concept is drawn from scratch, and every order is backed by a 100% money-back guarantee.", "blog_title": "Branding advice for founders", "cases_title": "Results, not just pretty marks", "terms_title": "Terms of Service", "privacy_title": "Privacy Policy", "n404_title": "This page went off-brand", "n404_text": "The link you followed doesn''t exist. Let''s get you back to good design.", "n404_home": "Back home", "n404_pricing": "View pricing"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
UPDATE site_settings SET value = value || '{"order_r_plan": "Plan"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_name": "Name"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_biz": "Company"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_ind": "Industry"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_target": "Target"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_vibe": "Vibe"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_color": "Colors"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_contact": "Contact"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_r_notes": "References"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_alert": "Please fill in your name and company/brand first."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_alert_vibe": "Pick at least 1 vibe."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_greet": "Hello LogoPulse! I want to order a logo:"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_name": "Name"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_biz": "Company"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_plan": "Plan"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_ind": "Industry"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_target": "Target"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_vibe": "Vibe"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_color": "Colors"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_contact": "Contact"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"wa_notes": "References"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"mail_subj": "Logo order"}' WHERE key='pages';
INSERT INTO site_settings (key, value) VALUES ('pages', '{}') ON CONFLICT DO NOTHING;

-- Website Identity: color picker labels
UPDATE site_settings SET value = value || '{"order_cp_title": "Pick a custom color"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_cp_use": "Use this color"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_cp_cancel": "Cancel"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"order_cp_remove": "Remove"}' WHERE key='pages';

-- Website Identity: contact display + form labels
UPDATE site_settings SET value = value || '{"email": "hello@logopulse.co"}' WHERE key='contact';
UPDATE site_settings SET value = value || '{"email_href": "mailto:hello@logopulse.co"}' WHERE key='contact';
UPDATE site_settings SET value = value || '{"hours": "Mon\u2013Fri, 9:00\u201318:00 UTC"}' WHERE key='contact';
UPDATE site_settings SET value = value || '{"contact_else": "Elsewhere"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"contact_fname": "Name"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"contact_femail": "Email"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"contact_fmsg": "Message"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"contact_ph_msg": "Tell us about your project\u2026"}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"contact_send": "Send message"}' WHERE key='pages';

-- Website Identity: legal clauses
UPDATE site_settings SET value = value || '{"priv_b1": "Privacy questions: "}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_h1": "4. Contact."}' WHERE key='pages';
-- Website Identity: legal clauses (underscore keys)
UPDATE site_settings SET value = value || '{"pages.priv_b1": "Contact details and brief inputs needed to deliver your project. Orders are confirmed via WhatsApp or email, and payment is arranged manually \u2014 we never store card numbers."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_b2": "We use your data to deliver designs, provide support, and improve our service. No sale of personal data, ever."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_b3": "Project files are kept for 12 months for re-delivery, then archived. Contact us anytime to request deletion."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_b4": "Privacy questions: "}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_h1": "1. Data we collect."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_h2": "2. Use."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_h3": "3. Retention."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.priv_h4": "4. Contact."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_b1": "LogoPulse provides custom logo and brand-identity design with first concepts delivered within 48 hours of a complete brief."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_b2": "Starter includes 2 revision rounds; Professional includes unlimited rounds for 7 days; Premium includes unlimited rounds for 14 days plus priority support."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_b3": "If you are unhappy with the first concepts, request a full refund within 7 days of delivery. Refunded orders grant no license to use the concepts."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_b4": "Full ownership of the final approved artwork transfers to you upon final delivery (and completed payment), including vector source files."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_b5": "You agree not to request designs that infringe third-party trademarks or contain unlawful content."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_h1": "1. Service."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_h2": "2. Revisions."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_h3": "3. Refunds."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_h4": "4. Ownership."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"pages.terms_h5": "5. Acceptable use."}' WHERE key='pages';

-- Website Identity: hero collage images
INSERT INTO site_settings (key, value) VALUES ('hero_images', '{"images": ["/hero/leo-1.jpg", "https://picsum.photos/seed/lp-c0-1/400/266.webp", "https://picsum.photos/seed/lp-c0-2/400/350.webp", "https://picsum.photos/seed/lp-c0-3/400/266.webp", "https://picsum.photos/seed/lp-c1-0/400/350.webp", "https://picsum.photos/seed/lp-c1-1/400/266.webp", "https://picsum.photos/seed/lp-c1-2/400/350.webp", "https://picsum.photos/seed/lp-c1-3/400/266.webp", "https://picsum.photos/seed/lp-c2-0/400/350.webp", "https://picsum.photos/seed/lp-c2-1/400/266.webp", "https://picsum.photos/seed/lp-c2-2/400/350.webp", "https://picsum.photos/seed/lp-c2-3/400/266.webp"]}') ON CONFLICT DO NOTHING;

-- Website Identity: legal clauses fallback
UPDATE site_settings SET value = value || '{"priv_b1": "Contact details and brief inputs needed to deliver your project. Orders are confirmed via WhatsApp or email, and payment is arranged manually \u2014 we never store card numbers."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_b2": "We use your data to deliver designs, provide support, and improve our service. No sale of personal data, ever."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_b3": "Project files are kept for 12 months for re-delivery, then archived. Contact us anytime to request deletion."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_b4": "Privacy questions: "}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_h1": "1. Data we collect."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_h2": "2. Use."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_h3": "3. Retention."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"priv_h4": "4. Contact."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_b1": "LogoPulse provides custom logo and brand-identity design with first concepts delivered within 48 hours of a complete brief."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_b2": "Starter includes 2 revision rounds; Professional includes unlimited rounds for 7 days; Premium includes unlimited rounds for 14 days plus priority support."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_b3": "If you are unhappy with the first concepts, request a full refund within 7 days of delivery. Refunded orders grant no license to use the concepts."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_b4": "Full ownership of the final approved artwork transfers to you upon final delivery (and completed payment), including vector source files."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_b5": "You agree not to request designs that infringe third-party trademarks or contain unlawful content."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_h1": "1. Service."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_h2": "2. Revisions."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_h3": "3. Refunds."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_h4": "4. Ownership."}' WHERE key='pages';
UPDATE site_settings SET value = value || '{"terms_h5": "5. Acceptable use."}' WHERE key='pages';
