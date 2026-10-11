BEGIN;

-- =========================================================
-- USERS
-- =========================================================

INSERT INTO users (
    name,
    email,
    profile_picture,
    role,
    password_hash
)
SELECT
    'User ' || i,
    'user' || i || '@example.com',
    'http://localhost:3000/images/' || ((i - 1) % 50 + 1) || '.jpg',
    'USER',
    '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890'
FROM generate_series(1, 200000) AS i;


-- =========================================================
-- CATEGORIES
-- =========================================================

INSERT INTO categories (
    name,
    slug
)
SELECT
    'Category ' || i,
    'category-' || i
FROM generate_series(1, 20) AS i;


-- =========================================================
-- PRODUCTS
-- =========================================================

INSERT INTO products (
    name,
    slug,
    sku,
    description
)
SELECT
    'Product ' || i,
    'product-' || i,
    'PROD-' || i,
    jsonb_build_object(
        'brand', 'Brand ' || ((i - 1) % 20 + 1),
        'description', 'Description for product ' || i
    )
FROM generate_series(1, 200000) AS i;


-- =========================================================
-- PRODUCT CATEGORIES
-- 3 categories per product
-- =========================================================

INSERT INTO product_categories (
    product_id,
    category_id
)
SELECT
    p.id,
    c.id
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY id) AS product_number
    FROM products
) AS p
JOIN categories c
    ON c.id IN (
        SELECT id
        FROM categories
        ORDER BY id
        OFFSET ((p.product_number - 1) % 18)
        LIMIT 3
    );


-- =========================================================
-- PRODUCT VARIANTS
-- 3 variants per product
-- =========================================================

INSERT INTO product_variants (
    product_id,
    sku,
    price,
    images,
    attributes,
    stock
)
SELECT
    p.id,
    'VAR-' || v.variant_number,
    (100 + ((p.product_number * v.variant_number) % 90000))::DECIMAL(8,2),
    ARRAY[
        'http://localhost:3000/images/' ||
        (((p.product_number + v.variant_number - 2) % 50) + 1) ||
        '.jpg'
    ],
    jsonb_build_object(
        'color',
        CASE ((v.variant_number - 1) % 5)
            WHEN 0 THEN 'Black'
            WHEN 1 THEN 'White'
            WHEN 2 THEN 'Red'
            WHEN 3 THEN 'Blue'
            ELSE 'Green'
        END,
        'size',
        CASE v.variant_number
            WHEN 1 THEN 'S'
            WHEN 2 THEN 'M'
            ELSE 'L'
        END
    ),
    (p.product_number * v.variant_number) % 500
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY id) AS product_number
    FROM products
) AS p
CROSS JOIN generate_series(1, 3) AS v(variant_number);


COMMIT;