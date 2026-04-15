-- A/B Testing tables for Elevate integration
-- Run this SQL in Supabase SQL Editor to create the required tables

-- Main test registry
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id text NOT NULL,
  brand_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  type text,
  status text NOT NULL DEFAULT 'running',
  goal text DEFAULT 'REVENUE_PER_VISITOR',

  winner_variation_id text,
  winner_variation_name text,
  is_winner boolean DEFAULT false,

  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  traffic_percentage integer,

  control_visitors integer,
  control_sessions integer,
  control_conversions integer,
  control_cr numeric,
  control_rpv numeric,
  control_aov numeric,
  control_revenue numeric,
  control_add_to_cart_rate numeric,
  control_checkout_start_rate numeric,

  variant_variation_id text,
  variant_variation_name text,
  variant_visitors integer,
  variant_sessions integer,
  variant_conversions integer,
  variant_cr numeric,
  variant_rpv numeric,
  variant_aov numeric,
  variant_revenue numeric,
  variant_add_to_cart_rate numeric,
  variant_checkout_start_rate numeric,

  lift_cr_pct numeric,
  lift_rpv_pct numeric,
  lift_aov_pct numeric,

  statistical_status text,
  statistical_significance jsonb,

  raw_list_data jsonb,
  raw_results_data jsonb,
  raw_significance_data jsonb,
  last_synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT ab_tests_pkey PRIMARY KEY (id, brand_id),
  CONSTRAINT fk_ab_tests_brand FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_brand ON public.ab_tests(brand_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_finished ON public.ab_tests(finished_at);

-- Metric snapshots (historical)
CREATE TABLE IF NOT EXISTS public.ab_test_snapshots (
  id serial PRIMARY KEY,
  test_id text NOT NULL,
  brand_id text NOT NULL,

  control_cr numeric,
  control_rpv numeric,
  control_aov numeric,
  control_revenue numeric,
  control_visitors integer,
  variant_cr numeric,
  variant_rpv numeric,
  variant_aov numeric,
  variant_revenue numeric,
  variant_visitors integer,
  lift_cr_pct numeric,
  lift_rpv_pct numeric,
  lift_aov_pct numeric,
  statistical_status text,

  collected_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT fk_ab_snapshots_test FOREIGN KEY (test_id, brand_id)
    REFERENCES public.ab_tests(id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_snapshots_test ON public.ab_test_snapshots(test_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_ab_snapshots_date ON public.ab_test_snapshots(collected_at);

-- User annotations per test
CREATE TABLE IF NOT EXISTS public.ab_test_notes (
  id serial PRIMARY KEY,
  test_id text NOT NULL,
  brand_id text NOT NULL,
  content text NOT NULL DEFAULT '',
  tags text[] DEFAULT '{}',
  author text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT fk_ab_notes_test FOREIGN KEY (test_id, brand_id)
    REFERENCES public.ab_tests(id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_notes_test ON public.ab_test_notes(test_id, brand_id);

-- Sync execution log
CREATE TABLE IF NOT EXISTS public.ab_sync_log (
  id serial PRIMARY KEY,
  brand_id text NOT NULL,
  trigger_type text DEFAULT 'cron',
  tests_fetched integer DEFAULT 0,
  tests_updated integer DEFAULT 0,
  tests_skipped integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  status text DEFAULT 'running'
);

-- RLS policies (allow authenticated users full access)
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ab_tests" ON public.ab_tests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ab_tests" ON public.ab_tests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ab_tests" ON public.ab_tests
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read ab_test_snapshots" ON public.ab_test_snapshots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ab_test_snapshots" ON public.ab_test_snapshots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can manage ab_test_notes" ON public.ab_test_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage ab_sync_log" ON public.ab_sync_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
