#!/bin/bash

DB_NAME="legodb"
DB_USER="postgres"

echo "Creating database \"$DB_NAME\"..."

# Create the database (if it doesn't already exist)
psql -U "$DB_USER" -h localhost -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U "$DB_USER" -h localhost -c "CREATE DATABASE $DB_NAME"

echo "Creating tables in \"$DB_NAME\"..."

psql -U "$DB_USER" -h localhost -d "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS lego_sets (
  set_id SERIAL PRIMARY KEY,
  set_number VARCHAR UNIQUE,
  name TEXT
);

CREATE TABLE IF NOT EXISTS lego_pieces (
  piece_id SERIAL PRIMARY KEY,
  part_num VARCHAR,
  name TEXT,
  color TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS set_pieces (
  set_id INT REFERENCES lego_sets(set_id),
  piece_id INT REFERENCES lego_pieces(piece_id),
  required_qty INT
);

# Change set_id to user_set_id for user-specific sets
CREATE TABLE IF NOT EXISTS user_set_pieces (
  user_id VARCHAR,
  user_set_id INT,
  piece_id INT,
  owned_qty INT,
  PRIMARY KEY (user_id, user_set_id, piece_id)
);

CREATE TABLE IF NOT EXISTS user_lego_sets (
  user_set_id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  set_id INT REFERENCES lego_sets(set_id),
  acquired_date DATE
);
EOF

echo "✅ Database and tables created successfully."
