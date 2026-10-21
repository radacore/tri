-- Meta title/description blog tidak lagi diisi manual: judul memakai `title`,
-- description diturunkan dari `content` saat build. Kolom lama dibuang agar
-- tidak ada jalur tulis yang tak terbaca. Idempoten: aman dijalankan ulang.
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description;
