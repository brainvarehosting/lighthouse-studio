-- schema.sql
-- Run this in your Cloudflare Dashboard or via Wrangler: npx wrangler d1 execute lhs_db --local --file=./schema.sql

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    service_id TEXT,
    package_id TEXT,
    booking_date TEXT,
    start_hour REAL,
    end_hour REAL,
    duration REAL,
    total_amount REAL,
    payment_choice TEXT,
    advance_amount REAL,
    balance_amount REAL,
    status TEXT DEFAULT 'new-request',
    payment_status TEXT DEFAULT 'not-paid',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT,
    action TEXT,
    user TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    role TEXT DEFAULT 'customer',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_codes (
    email TEXT PRIMARY KEY,
    code TEXT,
    expires_at INTEGER
);
