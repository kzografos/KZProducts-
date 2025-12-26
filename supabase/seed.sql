-- KZProducts Seed Data
-- Run this after creating your database tables to populate with test products
-- Uses gen_random_uuid() for proper UUID generation

-- First, ensure categories exist (using ON CONFLICT with slug since IDs are auto-generated)
INSERT INTO categories (id, name, slug, description, sort_order, image_url) VALUES
  (gen_random_uuid(), 'Processors', 'cpu', 'High-performance CPUs for gaming and workstation builds', 1, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'),
  (gen_random_uuid(), 'Graphics Cards', 'gpu', 'Powerful GPUs for gaming, rendering, and AI workloads', 2, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800'),
  (gen_random_uuid(), 'Memory', 'ram', 'High-speed DDR5 memory modules for maximum performance', 3, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800'),
  (gen_random_uuid(), 'Storage', 'ssd', 'NVMe SSDs with blazing fast read/write speeds', 4, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order;

-- Insert products using a CTE to reference category IDs by slug
WITH cat_ids AS (
  SELECT id, slug FROM categories
)
INSERT INTO products (id, name, slug, description, price, compare_at_price, images, category_id, stock_quantity, is_active, metadata)
SELECT
  gen_random_uuid(),
  p.name,
  p.slug,
  p.description,
  p.price,
  p.compare_at_price,
  p.images,
  c.id,
  p.stock_quantity,
  p.is_active,
  p.metadata
FROM (VALUES
  -- CPU Products
  (
    'Intel Core i9-14900K',
    'intel-i9-14900k',
    'The Intel Core i9-14900K is the flagship processor of Intel''s 14th generation Raptor Lake Refresh lineup. Featuring 24 cores (8 Performance + 16 Efficient), 32 threads, and boost clocks up to 6.0 GHz, this CPU delivers exceptional performance for gaming, content creation, and demanding workloads.',
    589.99::numeric,
    649.99::numeric,
    ARRAY['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800'],
    'cpu',
    15,
    true,
    '{"cores": "24 (8P + 16E)", "threads": "32", "base_clock": "3.2 GHz", "boost_clock": "6.0 GHz", "cache": "36MB L3", "tdp": "125W", "socket": "LGA 1700"}'::jsonb
  ),
  (
    'AMD Ryzen 9 7950X',
    'amd-ryzen-9-7950x',
    'The AMD Ryzen 9 7950X represents the pinnacle of AMD''s Zen 4 architecture. With 16 cores, 32 threads, and boost speeds reaching 5.7 GHz, this processor excels in both single-threaded and multi-threaded workloads.',
    549.99::numeric,
    699.99::numeric,
    ARRAY['https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'],
    'cpu',
    12,
    true,
    '{"cores": "16", "threads": "32", "base_clock": "4.5 GHz", "boost_clock": "5.7 GHz", "cache": "64MB L3", "tdp": "170W", "socket": "AM5"}'::jsonb
  ),
  -- GPU Products
  (
    'NVIDIA GeForce RTX 4090',
    'nvidia-rtx-4090',
    'The NVIDIA GeForce RTX 4090 is the most powerful consumer graphics card ever made. Powered by the Ada Lovelace architecture with 16,384 CUDA cores and 24GB GDDR6X memory.',
    1599.99::numeric,
    1999.99::numeric,
    ARRAY['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'],
    'gpu',
    5,
    true,
    '{"cuda_cores": "16384", "memory": "24GB GDDR6X", "memory_bus": "384-bit", "boost_clock": "2.52 GHz", "tdp": "450W", "ray_tracing": "3rd Gen RT Cores", "dlss": "DLSS 3.0"}'::jsonb
  ),
  (
    'NVIDIA GeForce RTX 4080 SUPER',
    'nvidia-rtx-4080-super',
    'The RTX 4080 SUPER brings enhanced performance with 10,240 CUDA cores and 16GB GDDR6X memory. Built on the Ada Lovelace architecture for exceptional 4K gaming.',
    999.99::numeric,
    1199.99::numeric,
    ARRAY['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800'],
    'gpu',
    10,
    true,
    '{"cuda_cores": "10240", "memory": "16GB GDDR6X", "memory_bus": "256-bit", "boost_clock": "2.55 GHz", "tdp": "320W", "ray_tracing": "3rd Gen RT Cores", "dlss": "DLSS 3.0"}'::jsonb
  ),
  (
    'AMD Radeon RX 7900 XTX',
    'amd-rx-7900-xtx',
    'AMD''s flagship RDNA 3 graphics card delivers outstanding performance with 96 compute units, 24GB GDDR6 memory, and innovative chiplet design.',
    899.99::numeric,
    999.99::numeric,
    ARRAY['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800'],
    'gpu',
    8,
    true,
    '{"compute_units": "96", "stream_processors": "6144", "memory": "24GB GDDR6", "memory_bus": "384-bit", "boost_clock": "2.5 GHz", "tdp": "355W", "ray_accelerators": "96"}'::jsonb
  )
) AS p(name, slug, description, price, compare_at_price, images, category_slug, stock_quantity, is_active, metadata)
JOIN cat_ids c ON c.slug = p.category_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  images = EXCLUDED.images,
  category_id = EXCLUDED.category_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Verify the data was inserted
SELECT name, slug, price, is_active FROM products WHERE is_active = true;
SELECT name, slug FROM categories ORDER BY sort_order;
