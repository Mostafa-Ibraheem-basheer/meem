BEGIN;

-- product tables --
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description JSONB
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    price DECIMAL(8,2) NOT NULL CHECK (price > 0),
    images TEXT[],
    attributes JSONB,
    stock INT NOT NULL CHECK (stock >= 0)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE product_categories (
    product_id UUID REFERENCES products ON DELETE CASCADE,
    category_id UUID REFERENCES categories ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- user tables --
CREATE TYPE ROLES AS ENUM ('ADMIN', 'USER');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_picture TEXT,
    role ROLES DEFAULT 'USER',
    password_hash TEXT NOT NULL
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
);

-- order tables --
CREATE TYPE STATUSES AS ENUM ('PENDING', 'COMPLETED','CANCELLED');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users ON DELETE SET NULL,
    total DECIMAL(8,2) NOT NULL CHECK (total >= 0),
    status STATUSES DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    uses_left INT NOT NULL CHECK (uses_left >= 0)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(8,2) NOT NULL CHECK (purchase_price > 0)
);

-- triggers --
CREATE OR REPLACE FUNCTION generate_variant_sku()
RETURNS TRIGGER AS $$
BEGIN
    SELECT p.sku || '-' || NEW.sku
    INTO NEW.sku
    FROM products p
    WHERE p.id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_variant_sku
BEFORE INSERT ON product_variants
FOR EACH ROW
EXECUTE FUNCTION generate_variant_sku();


-- indexes --
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_products_name_search
ON products
USING GIN (name gin_trgm_ops);

CREATE INDEX idx_product_variants_product_id
ON product_variants(product_id);

CREATE INDEX idx_orders_user_id
ON orders(user_id);

CREATE INDEX idx_order_items_order_id
ON order_items(order_id);

CREATE INDEX idx_order_items_variant_id
ON order_items(variant_id);

CREATE INDEX idx_product_categories_category_id
ON product_categories(category_id);

COMMIT;