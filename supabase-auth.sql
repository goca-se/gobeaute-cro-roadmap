-- Tabela de perfis de usuários
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member',
  created_at  timestamptz not null default now(),
  last_login  timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Usuários autenticados podem ver todos os perfis"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Usuário pode atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: cria perfil automaticamente no primeiro login
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set last_login = now();
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
