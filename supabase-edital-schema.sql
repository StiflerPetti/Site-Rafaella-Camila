-- NOVO RECURSO: editais e checklist de tópicos.
-- Execute este arquivo UMA vez no Supabase > SQL Editor > New query > Run.
-- Não substitui nem exige recriar a tabela study_sessions existente.

create table if not exists public.study_editals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  role text check (role is null or char_length(role) <= 160),
  exam_board text check (exam_board is null or char_length(exam_board) <= 120),
  source_filename text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.study_edital_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  edital_id uuid not null references public.study_editals(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 160),
  topic text not null check (char_length(topic) between 1 and 500),
  status text not null default 'pending' check (status in ('pending','studying','done','review')),
  notes text,
  sort_order integer not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.study_sessions add column if not exists edital_topic_id uuid references public.study_edital_topics(id) on delete set null;
create index if not exists study_editals_user_idx on public.study_editals(user_id, created_at desc);
create index if not exists study_edital_topics_edital_idx on public.study_edital_topics(edital_id, sort_order);
create index if not exists study_sessions_edital_topic_idx on public.study_sessions(edital_topic_id);

alter table public.study_editals enable row level security;
alter table public.study_edital_topics enable row level security;
drop policy if exists "Read own editals" on public.study_editals;
create policy "Read own editals" on public.study_editals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Insert own editals" on public.study_editals;
create policy "Insert own editals" on public.study_editals for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Update own editals" on public.study_editals;
create policy "Update own editals" on public.study_editals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Delete own editals" on public.study_editals;
create policy "Delete own editals" on public.study_editals for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Read own edital topics" on public.study_edital_topics;
create policy "Read own edital topics" on public.study_edital_topics for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Insert own edital topics" on public.study_edital_topics;
create policy "Insert own edital topics" on public.study_edital_topics for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.study_editals e where e.id = edital_id and e.user_id = auth.uid()));
drop policy if exists "Update own edital topics" on public.study_edital_topics;
create policy "Update own edital topics" on public.study_edital_topics for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.study_editals e where e.id = edital_id and e.user_id = auth.uid()));
drop policy if exists "Delete own edital topics" on public.study_edital_topics;
create policy "Delete own edital topics" on public.study_edital_topics for delete to authenticated using (auth.uid() = user_id);

-- O usuário só pode vincular uma sessão a tópico que pertence à própria conta.
drop policy if exists "Insert own study sessions" on public.study_sessions;
create policy "Insert own study sessions" on public.study_sessions for insert to authenticated
with check (auth.uid() = user_id and (edital_topic_id is null or exists (select 1 from public.study_edital_topics t where t.id = edital_topic_id and t.user_id = auth.uid())));
drop policy if exists "Update own study sessions" on public.study_sessions;
create policy "Update own study sessions" on public.study_sessions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and (edital_topic_id is null or exists (select 1 from public.study_edital_topics t where t.id = edital_topic_id and t.user_id = auth.uid())));

revoke all on public.study_editals, public.study_edital_topics from anon;
grant select, insert, update, delete on public.study_editals, public.study_edital_topics to authenticated;
