#!/bin/bash

DB_NAME="legodb"
DB_USER="postgres"

echo "Creating database \"$DB_NAME\"..."

# Create the database (if it doesn't already exist)
psql -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

echo "Creating tables in \"$DB_NAME\"..."

psql -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS pieces (
  piece_id SERIAL PRIMARY KEY,
  part_num VARCHAR,
  name TEXT,
  color TEXT,
  image_url TEXT,
  UNIQUE (part_num, name, color)
);

CREATE TABLE IF NOT EXISTS lego_sets (
  set_id SERIAL PRIMARY KEY,
  set_number VARCHAR UNIQUE,
  name TEXT
);

CREATE TABLE IF NOT EXISTS set_pieces (
  set_id INT REFERENCES lego_sets(set_id),
  piece_id INT REFERENCES pieces(piece_id),
  required_qty INT,
  UNIQUE (set_id, piece_id)
);

-- USERS
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR UNIQUE NOT NULL
);

-- USER'S BUILDS (a user can have multiple instances of the same set)
CREATE TABLE user_builds (
  build_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id),
  set_id INT NOT NULL REFERENCES lego_sets(set_id),
  instance_number INT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW()
);
 
-- TRACK PIECES FOUND FOR EACH BUILD
CREATE TABLE build_pieces (
  build_piece_id SERIAL PRIMARY KEY,
  build_id INT NOT NULL REFERENCES user_builds(build_id) ON DELETE CASCADE,
  piece_id INT NOT NULL REFERENCES pieces(piece_id),
  quantity_found INT DEFAULT 0,
  UNIQUE (build_id, piece_id)
);
EOF

echo "✅ Database and tables created successfully."
