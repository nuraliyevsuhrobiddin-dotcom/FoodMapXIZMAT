-- ============================================================
-- QR-Restoran: Supabase Database Setup (To'liq tuzatilgan)
-- Avval eski jadvallarni o'chiradi, keyin to'g'ri yaratadi
-- ============================================================

-- 1. Eski jadvallarni o'chirish (dependency tartibida)
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.staff_calls cascade;
drop table if exists public.table_sessions cascade;
drop table if exists public.feedbacks cascade;
drop table if exists public.dishes cascade;
drop table if exists public.settings cascade;

-- 2. UUID kengaytmasini yoqish
create extension if not exists "uuid-ossp";

-- 3. settings jadvali
create table public.settings (
    id integer primary key default 1,
    service_charge_percent integer not null default 10,
    table_sitting_fee numeric not null default 0,
    table_count integer not null default 12,
    constraint settings_only_one_row check (id = 1)
);

-- 4. dishes jadvali
create table public.dishes (
    id text primary key,
    name jsonb not null,
    description jsonb,
    price numeric not null,
    category text not null,
    image text,
    is_popular boolean default false,
    is_recommended boolean default false,
    preparation_time integer default 15,
    unit text default 'pcs',
    created_at timestamptz default now()
);

-- 5. orders jadvali (id -> uuid)
create table public.orders (
    id uuid primary key default uuid_generate_v4(),
    table_number integer not null,
    session_id text not null,
    total_amount numeric not null,
    status text not null default 'new',
    notes text,
    service_charge numeric default 0,
    table_sitting_fee numeric default 0,
    payment_status text not null default 'unpaid',
    created_at timestamptz default now()
);

-- 6. order_items jadvali (order_id -> uuid, orders.id bilan mos)
create table public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade,
    dish_id text,
    dish_name jsonb not null,
    price numeric not null,
    quantity numeric not null
);

-- 7. staff_calls jadvali
create table public.staff_calls (
    id uuid primary key default uuid_generate_v4(),
    table_number integer not null,
    type text not null,
    status text not null default 'pending',
    created_at timestamptz default now()
);

-- 8. table_sessions jadvali
create table public.table_sessions (
    table_number integer primary key,
    session_id text not null,
    updated_at timestamptz default now()
);

-- 9. feedbacks jadvali
create table public.feedbacks (
    id uuid primary key default uuid_generate_v4(),
    table_number integer not null,
    rating integer not null,
    comment text,
    created_at timestamptz default now()
);

-- 10. Disable Row Level Security (RLS) so that public client can access them
alter table public.settings disable row level security;
alter table public.dishes disable row level security;
alter table public.orders disable row level security;
alter table public.order_items disable row level security;
alter table public.staff_calls disable row level security;
alter table public.table_sessions disable row level security;
alter table public.feedbacks disable row level security;

-- 11. Realtime yoqish
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.staff_calls;
alter publication supabase_realtime add table public.table_sessions;
alter publication supabase_realtime add table public.feedbacks;
alter publication supabase_realtime add table public.dishes;
alter publication supabase_realtime add table public.settings;

-- 12. Standart sozlamalar
insert into public.settings (id, service_charge_percent, table_sitting_fee, table_count)
values (1, 10, 5000, 12)
on conflict (id) do nothing;

-- 13. Standart taomlar (apostrof '' bilan escaped)
insert into public.dishes (id, name, description, price, category, image, is_popular, is_recommended, preparation_time, unit)
values 
(
  'dish-1',
  '{"uz": "Onlayn Maxsus Palov", "ru": "Особый Плов Onlayn", "en": "Onlayn Special Pilaf"}',
  '{"uz": "Premium mayin qo''zi go''shti, devzira guruchi, sariq sabzi va maxsus ziravorlar bilan tayyorlangan shohona palov.", "ru": "Королевский плов из нежной премиальной ягнятины, риса девзира, отборной желтой моркови и фирменных специй.", "en": "Royal pilaf prepared with premium tender lamb, devzira rice, golden yellow carrots, and exclusive house spices."}',
  85000, 'national',
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop',
  true, true, 20, 'pcs'
),
(
  'dish-2',
  '{"uz": "Xon Mantisi (4 dona)", "ru": "Ханские Манты (4 шт)", "en": "Khan Manti (4 pcs)"}',
  '{"uz": "Mayda to''g''ralgan sarxil buzoq go''shti va dumg''aza yog''i bilan tayyorlangan yupqa xamirdagi manti.", "ru": "Манты из мелко рубленой свежей телятины и курдючного жира в тончайшем тесте.", "en": "Steamed thin-dough dumplings filled with finely hand-chopped veal, tail fat, and sweet onions."}',
  48000, 'national',
  'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=600&auto=format&fit=crop',
  false, true, 25, 'pcs'
),
(
  'dish-3',
  '{"uz": "Gijduvon Shashlik Assorti", "ru": "Ассорти Гиждыванских Шашлыков", "en": "Gijduvon Shashlik Assorted"}',
  '{"uz": "Charxin ko''mirida pishirilgan yumshoq qiyma, barra go''sht va sershira mol go''shtidan tayyorlangan dasta shashlik.", "ru": "Сочный ассорти-сет шашлыков из рубленого мяса, нежной баранины и говядины, приготовленных на углях саксаула.", "en": "A premium platter of succulent skewered minced kebabs, fresh lamb, and tender beef grilled over natural charcoal."}',
  110000, 'national',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop',
  true, false, 15, 'pcs'
),
(
  'dish-4',
  '{"uz": "Black Angus Gold Burger", "ru": "Бургер Black Angus Gold", "en": "Black Angus Gold Burger"}',
  '{"uz": "Tender Black Angus kotleti, erigan cheddor pishlog''i, qora bulochka va oltin kukunli maxsus sous.", "ru": "Сочная котлета из мраморной говядины Black Angus, сыр чеддер, карамелизованный лук и соус с добавлением золотой пыли.", "en": "Juicy Black Angus beef patty, melted cheddar, signature sauce dusted with culinary gold on a soft dark brioche bun."}',
  65000, 'fastfood',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
  true, true, 12, 'pcs'
),
(
  'dish-5',
  '{"uz": "Anor Barra Sharbati", "ru": "Свежевыжатый Гранатовый Сок", "en": "Fresh Pomegranate Juice"}',
  '{"uz": "Yangi siqilgan shirin va nordon anor sharbati, muz bo''laklari bilan serviz qilinadi.", "ru": "Натуральный свежевыжатый гранатовый сок премиум сортов с добавлением кубиков льда.", "en": "Freshly squeezed sweet and tart pomegranate juice served over clear ice blocks."}',
  32000, 'drinks',
  'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=600&auto=format&fit=crop',
  true, false, 5, 'pcs'
),
(
  'dish-6',
  '{"uz": "Gold Leaf Limonad", "ru": "Золотой Лимонад", "en": "Gold Leaf Lemonade"}',
  '{"uz": "Laym, sarxil yalpiz, ehtiros mevasi va yeyishli oltin barglari qo''shilgan tetiklashtiruvchi limonad.", "ru": "Освежающий лимонад с лаймом, свежей мятой, маракуйей и лепестками пищевого золота.", "en": "Refreshing mocktail with lime, fresh mint, passion fruit, and delicate edible gold flakes."}',
  35000, 'drinks',
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop',
  false, true, 5, 'pcs'
),
(
  'dish-7',
  '{"uz": "Zaytun O''rta Yer Salat", "ru": "Средиземноморский Салат Зайтун", "en": "Olive Mediterranean Salad"}',
  '{"uz": "Sarxil pomidor, bodring, grek zaytunlari, premium feta pishlog''i va maxsus zaytun moyi sousi.", "ru": "Свежие черри, хрустящие огурцы, греческие оливки Каламата, премиальный сыр фета и оливковое масло холодного отжима.", "en": "Fresh cherry tomatoes, crispy cucumbers, Kalamata olives, premium feta cheese, and cold-pressed olive oil dressing."}',
  38000, 'salads',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
  false, false, 8, 'pcs'
),
(
  'dish-8',
  '{"uz": "Tandir non", "ru": "Горячая Тандырная Лепешка", "en": "Hot Tandoor Bread"}',
  '{"uz": "Loy tandirda an''anaviy usulda yopilgan, ustiga kunjut sepilgan issiq, qarsillagan non.", "ru": "Традиционная лепешка, испеченная в глиняном тандыре, с золотистой хрустящей корочкой и кунжутом.", "en": "Traditional flatbread baked in a clay tandoor oven, crispy, hot, and sprinkled with sesame seeds."}',
  7000, 'national',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
  false, false, 5, 'pcs'
),
(
  'dish-9',
  '{"uz": "Royal Pistach Baklava", "ru": "Королевская Фисташковая Пахлава", "en": "Royal Pistachio Baklava"}',
  '{"uz": "Qat-qat yupqa xamir, maydalangan sifatli pista, asalli sirop va quyuq qaymoq bilan birga.", "ru": "Хрустящие слои слоеного теста, много отборных фисташек, медовый сироп. Подается со сливочным каймаком.", "en": "Flaky pastry layers filled with premium crushed pistachios, organic honey syrup, served with rich clotted cream."}',
  45000, 'desserts',
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=600&auto=format&fit=crop',
  true, true, 10, 'pcs'
),
(
  'dish-10',
  '{"uz": "Asalli Oltin Tort", "ru": "Медовик Золотой", "en": "Golden Honey Cake"}',
  '{"uz": "Tog'' asali va mayin smetana kremi qo''shib tayyorlangan qadimiy uslubdagi asalli tort parchasi.", "ru": "Классический нежнейший медовик на горном меду со сметанным кремом и карамельным декором.", "en": "Classic ultra-soft layered honey cake made with organic mountain honey and silky sour cream frosting."}',
  40000, 'desserts',
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop',
  false, false, 5, 'pcs'
),
(
  'dish-11',
  '{"uz": "Sulton Shohona Kombosi", "ru": "Комбо Султан Шахский", "en": "Sultan Royal Combo"}',
  '{"uz": "Onlayn Maxsus palovi, Achichuk salati, tandir non va choynakda ko''k choy to''plami.", "ru": "Комплексный сет: Специальный плов, салат Ачичук, горячая тандырная лепешка и фирменный зеленый чай.", "en": "Complete royal set: Special pilaf, Achichuk tomato salad, hot tandoor bread, and a pot of green tea."}',
  115000, 'combo',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  true, true, 20, 'pcs'
),
(
  'dish-12',
  '{"uz": "Tandirda pishgan qo''y go''shti (kg)", "ru": "Баранина запеченная в тандыре (кг)", "en": "Lamb baked in Tandoor (kg)"}',
  '{"uz": "Tog'' archalari bilan tandirda dimlab pishirilgan, sershira barra qo''y go''shti. Kilogrammda sotiladi.", "ru": "Нежнейшая сочная баранина, запеченная в тандыре с горной арчой. Продается на килограмм.", "en": "Succulent lamb meat slow-cooked in a tandoor with mountain juniper. Sold per kilogram."}',
  180000, 'national',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  true, true, 30, 'kg'
),
(
  'dish-13',
  '{"uz": "Maxsus Qozon Kabob (kg)", "ru": "Особый Казан Кабоб (кг)", "en": "Special Kazan Kabob (kg)"}',
  '{"uz": "Qozonda qovurilgan barra qo''y qovurg''alari va oltinrang qizartirilgan kartoshka. Kilogrammda sotiladi.", "ru": "Обжаренные в казане сочные бараньи ребрышки с золотистым хрустящим картофелем. Продается на килограмм.", "en": "Crisp, golden-brown baby potatoes and tender lamb ribs fried in a traditional kazan. Sold per kilogram."}',
  180000, 'national',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  true, true, 25, 'kg'
)
on conflict (id) do nothing;
