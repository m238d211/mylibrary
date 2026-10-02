insert into public.categories (slug, name) values ('frameworks', 'Frameworks')
on conflict (name) do nothing;
