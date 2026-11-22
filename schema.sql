create extension if not exists pgcrypto;
create table if not exists public.products(
 id uuid primary key default gen_random_uuid(),name text not null,category text default '',image_url text default '',
 purchase_price numeric(12,2) not null default 0,profit_type text not null check(profit_type in('amount','percent')),
 profit_value numeric(12,2) not null default 0,selling_price numeric(12,2) not null default 0,
 unit_label text not null default 'kg',stock numeric(12,3) not null default 0,low_stock numeric(12,3) not null default 0,
 active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,address text default '',
 items jsonb not null,total numeric(12,2) not null default 0,status text not null default 'New',created_at timestamptz not null default now());
alter table public.products enable row level security;alter table public.orders enable row level security;
create or replace function public.place_store_order(p_customer_name text,p_phone text,p_address text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare it jsonb; p public.products%rowtype; q numeric; line numeric; arr jsonb:='[]'::jsonb; tot numeric:=0; o public.orders%rowtype;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
 for it in select value from jsonb_array_elements(p_items) loop
  q:=(it->>'quantity')::numeric;
  select * into p from public.products where id=(it->>'product_id')::uuid and active=true for update;
  if not found then raise exception 'Product unavailable'; end if;
  if q<=0 or q>p.stock then raise exception 'Not enough stock for %',p.name; end if;
  line:=round(q*p.selling_price,2);tot:=tot+line;
  arr:=arr||jsonb_build_array(jsonb_build_object('product_id',p.id,'name',p.name,'quantity',q,'unit_label',p.unit_label,'unit_price',p.selling_price,'line_total',line));
  update public.products set stock=stock-q where id=p.id;
 end loop;
 insert into public.orders(customer_name,phone,address,items,total,status) values(p_customer_name,p_phone,p_address,arr,round(tot,2),'New') returning * into o;
 return to_jsonb(o);
end $$;
revoke all on function public.place_store_order(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.place_store_order(text,text,text,jsonb) to service_role;
