#!/bin/bash

DB_NAME="legodb"
DB_USER="postgres"

echo "Creating database \"$DB_NAME\"..."

# Create the database (if it doesn't already exist)
psql -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

echo "Creating tables in \"$DB_NAME\"..."

psql -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT * FROM lego_sets;

SELECT * FROM pieces;

SELECT * FROM set_pieces;

SELECT * FROM user_set_pieces;

SELECT * FROM user_lego_sets;
EOF
