-- Skema dasar (idempoten). Dijalankan pertama oleh deploy.sh.

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)




--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text,
    category character varying(100),
    thumbnail_url text,
    meta_title character varying(255),
    meta_description text,
    published boolean DEFAULT false,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: case_studies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.case_studies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    industry character varying(100),
    hero_image text,
    content text,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    client character varying(255),
    result character varying(255),
    excerpt text,
    logo text,
    mockup text,
    year character varying(16),
    website text
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_logos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.client_logos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    logo_url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    from_status character varying(50),
    to_status character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    note text,
    stage_to character varying(50)
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_email character varying(255) NOT NULL,
    package_tier character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    brief jsonb,
    amount integer NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    stripe_session character varying(255),
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    customer_phone text,
    notes text,
    payment_proof text,
    deliverables text[] DEFAULT '{}'::text[] NOT NULL,
    stage character varying(50) DEFAULT 'brief'::character varying NOT NULL
);


--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100),
    image_url text NOT NULL,
    description text,
    featured boolean DEFAULT false,
    published boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.site_settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    "position" character varying(255),
    company character varying(255),
    photo_url text,
    quote text NOT NULL,
    rating smallint DEFAULT 5,
    featured boolean DEFAULT false,
    published boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255),
    role character varying(50) DEFAULT 'admin'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_pkey;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_key;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: case_studies case_studies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE case_studies DROP CONSTRAINT IF EXISTS case_studies_pkey;
ALTER TABLE case_studies ADD CONSTRAINT case_studies_pkey PRIMARY KEY (id);


--
-- Name: case_studies case_studies_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE case_studies DROP CONSTRAINT IF EXISTS case_studies_slug_key;
ALTER TABLE case_studies ADD CONSTRAINT case_studies_slug_key UNIQUE (slug);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: client_logos client_logos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE client_logos DROP CONSTRAINT IF EXISTS client_logos_pkey;
ALTER TABLE client_logos ADD CONSTRAINT client_logos_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_pkey;
ALTER TABLE order_status_history ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_pkey;
ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_pkey;
ALTER TABLE site_settings ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_pkey;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_blog_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_blog_slug ON public.blog_posts USING btree (slug);


--
-- Name: idx_case_studies_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON public.case_studies USING btree (slug);


--
-- Name: idx_orders_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders USING btree (customer_email);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_order_id_fkey;
ALTER TABLE order_status_history ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--



