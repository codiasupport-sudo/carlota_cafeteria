-- ETAPA 2 · Administración del catálogo — SQL PENDIENTE DE APROBACIÓN
-- NO SE HA EJECUTADO en ningún proyecto de Supabase. Revisar y aprobar antes de aplicar.
-- Supuestos: ya existen categories, category_sizes, products y product_prices (Etapa 1) con las
-- columnas que lee SupabaseMenuRepository, y product_prices tiene id (pk) y UNIQUE(product_id, size_id).
-- Precios: numeric(10,2), MXN, sin conversión.

-- 1) Historial de cambios de precio (RLS activo y sin políticas: el público con anon key no accede).
create table if not exists public.product_price_history (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id),   -- sin ON DELETE CASCADE: no se borra con historial
  price_key   text not null,                                   -- clave de talla o 'unico'
  old_price   numeric(10,2),
  new_price   numeric(10,2),
  changed_by  text not null,
  changed_at  timestamptz not null default now()
);
create index if not exists product_price_history_product_idx on public.product_price_history (product_id, changed_at desc);
alter table public.product_price_history enable row level security;

-- 2) Unicidad de talla por categoría (necesaria para el upsert de tallas).
create unique index if not exists category_sizes_category_key_uidx on public.category_sizes (category_id, key);

-- 3) Reemplazo atómico de precios + registro de historial. Solo service_role puede ejecutarlo.
create or replace function public.admin_set_product_prices(
  p_product_id uuid, p_prices jsonb, p_changed_by text, p_single_key text default 'unico'
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_category uuid;
  r record;
  v_size uuid;
  v_old numeric(10,2);
  v_new numeric(10,2);
begin
  select category_id into v_category from products where id = p_product_id for update;
  if v_category is null then raise exception 'Producto inexistente'; end if;

  -- altas y cambios
  for r in select key, value from jsonb_each_text(p_prices) loop
    v_new := r.value::numeric(10,2);
    if v_new <= 0 then raise exception 'Precio inválido para %', r.key; end if;
    if r.key = p_single_key then
      v_size := null;
      select price into v_old from product_prices where product_id = p_product_id and size_id is null;
    else
      select id into v_size from category_sizes where category_id = v_category and key = r.key;
      if v_size is null then raise exception 'Talla % no existe en la categoría', r.key; end if;
      select price into v_old from product_prices where product_id = p_product_id and size_id = v_size;
    end if;

    if v_old is distinct from v_new then
      if v_old is null then
        insert into product_prices (product_id, size_id, price) values (p_product_id, v_size, v_new);
      else
        update product_prices set price = v_new
         where product_id = p_product_id and size_id is not distinct from v_size;
      end if;
      insert into product_price_history (product_id, price_key, old_price, new_price, changed_by)
      values (p_product_id, r.key, v_old, v_new, p_changed_by);
    end if;
  end loop;

  -- bajas (talla que ya no tiene precio)
  for r in
    select pp.size_id, coalesce(cs.key, p_single_key) as key, pp.price
      from product_prices pp left join category_sizes cs on cs.id = pp.size_id
     where pp.product_id = p_product_id and not (p_prices ? coalesce(cs.key, p_single_key))
  loop
    delete from product_prices where product_id = p_product_id and size_id is not distinct from r.size_id;
    insert into product_price_history (product_id, price_key, old_price, new_price, changed_by)
    values (p_product_id, r.key, r.price, null, p_changed_by);
  end loop;
end $$;

revoke all on function public.admin_set_product_prices(uuid, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_product_prices(uuid, jsonb, text, text) to service_role;
