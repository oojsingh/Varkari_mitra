CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT,
  kyc_status TEXT,
  kyc_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  location_sharing BOOLEAN DEFAULT TRUE,
  google_id TEXT,
  last_location JSONB
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  user_name TEXT,
  imei TEXT,
  name TEXT DEFAULT 'My Device',
  phone TEXT DEFAULT '',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family (
  id TEXT PRIMARY KEY,
  varkari_id TEXT NOT NULL REFERENCES users(id),
  varkari_name TEXT,
  email TEXT,
  name TEXT,
  relation TEXT DEFAULT 'Family',
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sevas (
  id TEXT PRIMARY KEY,
  sevak_id TEXT NOT NULL REFERENCES users(id),
  sevak_name TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  price INTEGER DEFAULT 0,
  location TEXT DEFAULT '',
  available_from TIMESTAMPTZ,
  available_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sanitation (
  id TEXT PRIMARY KEY,
  issue_type TEXT DEFAULT 'Unknown',
  location TEXT DEFAULT '',
  latitude FLOAT,
  longitude FLOAT,
  photo_base64 TEXT,
  reported_by TEXT DEFAULT 'Nirmal Wari Sanitation Hub',
  status TEXT DEFAULT 'DISPATCHED_TO_PANCHAYAT',
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lost_child (
  id TEXT PRIMARY KEY,
  child_name TEXT DEFAULT 'Unknown',
  age INTEGER,
  gender TEXT DEFAULT 'Unknown',
  last_seen_location TEXT DEFAULT '',
  last_seen_latitude FLOAT,
  last_seen_longitude FLOAT,
  description TEXT DEFAULT '',
  contact_number TEXT DEFAULT '',
  photo_base64 TEXT,
  reported_by TEXT DEFAULT 'Anonymous',
  reported_by_role TEXT DEFAULT 'varkari',
  status TEXT DEFAULT 'ACTIVE',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS traffic (
  key TEXT PRIMARY KEY,
  location geometry(Point, 4326),
  role TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency (
  id TEXT PRIMARY KEY,
  data JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast (
  id TEXT PRIMARY KEY,
  data JSONB,
  latitude FLOAT,
  longitude FLOAT,
  location geometry(Point, 4326),
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS palkhi_schedules (
  palkhi_key TEXT NOT NULL,
  year INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  palkhi_name TEXT,
  location_name TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  date DATE NOT NULL,
  PRIMARY KEY (palkhi_key, year, day_number)
);

ALTER TABLE palkhi_schedules ADD COLUMN IF NOT EXISTS palkhi_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days';
