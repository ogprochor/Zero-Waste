CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(500),
    location VARCHAR(200),
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name) VALUES
    ('Jedzenie'),
    ('Elektronika'),
    ('Odzież'),
    ('Książki'),
    ('Meble'),
    ('Zabawki'),
    ('Wyposarzenie domu')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (username, email, hashed_password) VALUES
    ('test', 'test@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW') -- hasło: test123
ON CONFLICT (username) DO NOTHING;

-- 6. Daj uprawnienia użytkownikowi
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zerowaste_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zerowaste_user;