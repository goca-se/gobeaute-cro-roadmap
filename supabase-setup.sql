-- ============================================================
-- Gobeaute CRO — Setup do Supabase
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Criar a tabela principal
create table if not exists public.cro_data (
  id      text primary key,
  data    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Criar registro inicial vazio
insert into public.cro_data (id, data, updated_at)
values ('main', '{}'::jsonb, now())
on conflict (id) do nothing;

-- 3. Habilitar Row Level Security
alter table public.cro_data enable row level security;

-- 4. Política: acesso total sem autenticação (uso interno de equipe)
--    Se quiser restringir por IP ou usuário autenticado, ajuste aqui.
create policy "team_access" on public.cro_data
  for all
  using (true)
  with check (true);

-- 5. Habilitar Realtime para a tabela
--    No painel Supabase: Database → Replication → adicionar cro_data
--    Ou via SQL:
alter publication supabase_realtime add table public.cro_data;

-- ============================================================
-- Após executar: copie .env.example para .env e preencha com
-- sua URL e anon key do projeto Supabase.
-- ============================================================
