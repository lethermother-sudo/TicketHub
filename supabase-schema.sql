-- Banco inicial para a plataforma.
create table if not exists events (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 city text,
 venue text,
 event_date timestamptz,
 category text,
 image_url text,
 description text,
 published boolean default true,
 created_at timestamptz default now()
);
create table if not exists listings (
 id uuid primary key default gen_random_uuid(),
 event_id uuid references events(id) on delete cascade,
 seller_id uuid,
 sector text,
 quantity integer not null default 1,
 price_cents integer not null,
 status text not null default 'available',
 created_at timestamptz default now()
);
create index if not exists listings_event_idx on listings(event_id,status);
