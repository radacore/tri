CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Tech', 'tech', 1),
  ('F&B', 'fnb', 2),
  ('Fashion', 'fashion', 3),
  ('Health', 'health', 4);
