-- 20260301000001_project_documents.sql
-- Add project-level document context sources (DOCX, pasted text).
-- Slides/decks remain on existing deck flow; this adds non-slide sources.

-- project_documents: metadata for each uploaded/pasted document
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('word_doc', 'plain_text')),
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  error_message text,
  file_url text,
  file_size_bytes bigint,
  is_default_context boolean not null default true,
  block_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_documents_project_id
  on project_documents(project_id);
create index if not exists idx_project_documents_user_project
  on project_documents(user_id, project_id, created_at desc);
create index if not exists idx_project_documents_default_context
  on project_documents(project_id, is_default_context) where status = 'ready';

-- project_document_blocks: normalized text chunks with locator metadata
create table if not exists project_document_blocks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references project_documents(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  block_index integer not null,
  block_text text not null,
  locator jsonb not null default '{}'::jsonb,
  word_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_document_blocks_document_id
  on project_document_blocks(document_id, block_index);
create index if not exists idx_project_document_blocks_project_id
  on project_document_blocks(project_id);
-- Full-text search index for lexical retrieval
create index if not exists idx_project_document_blocks_text_search
  on project_document_blocks using gin(to_tsvector('english', block_text));

-- Triggers for updated_at
create or replace function set_project_documents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_project_documents_updated_at on project_documents;
create trigger trg_project_documents_updated_at
before update on project_documents
for each row
execute function set_project_documents_updated_at();

-- RLS policies
alter table project_documents enable row level security;
alter table project_document_blocks enable row level security;

do $$ begin
  create policy "project_documents_select_own" on project_documents
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_documents_insert_own" on project_documents
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_documents_update_own" on project_documents
    for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_documents_delete_own" on project_documents
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Blocks inherit access through document ownership
do $$ begin
  create policy "project_document_blocks_select_own" on project_document_blocks
    for select using (
      exists (
        select 1 from project_documents pd
        where pd.id = project_document_blocks.document_id
          and pd.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_document_blocks_insert_own" on project_document_blocks
    for insert with check (
      exists (
        select 1 from project_documents pd
        where pd.id = project_document_blocks.document_id
          and pd.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_document_blocks_delete_own" on project_document_blocks
    for delete using (
      exists (
        select 1 from project_documents pd
        where pd.id = project_document_blocks.document_id
          and pd.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

-- Storage bucket for document files (DOCX)
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-documents', 'project-documents', false, 52428800)
on conflict (id) do nothing;

-- Storage policies for project documents
do $$ begin
  create policy "project_docs_storage_select" on storage.objects
    for select using (
      bucket_id = 'project-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_docs_storage_insert" on storage.objects
    for insert with check (
      bucket_id = 'project-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "project_docs_storage_delete" on storage.objects
    for delete using (
      bucket_id = 'project-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;
