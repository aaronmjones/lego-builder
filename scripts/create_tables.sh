#!/bin/bash

DB_NAME="legodb"
DB_USER="postgres"

echo "Creating database \"$DB_NAME\"..."

# Create the database (if it doesn't already exist)
psql -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

echo "Creating tables in \"$DB_NAME\"..."

psql -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS lego_sets (
  set_id SERIAL PRIMARY KEY,
  set_number VARCHAR UNIQUE,
  name TEXT
  CONSTRAINT unique_set_number UNIQUE (set_number)
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

CREATE TABLE IF NOT EXISTS user_set_pieces (
  user_id INT,
  set_id INT,
  piece_id INT,
  owned_qty INT,
  PRIMARY KEY (user_id, set_id, piece_id)
);
EOF

echo "✅ Database and tables created successfully."
