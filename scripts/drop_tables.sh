#!/bin/bash

DB_NAME="legodb"
DB_USER="postgres"

echo "Dropping tables in \"$DB_NAME\"..."

psql -U "$DB_USER" -d "$DB_NAME" <<EOF
DROP TABLE IF EXISTS user_set_pieces CASCADE;
DROP TABLE IF EXISTS set_pieces CASCADE;
DROP TABLE IF EXISTS lego_pieces CASCADE;
DROP TABLE IF EXISTS lego_sets CASCADE;
EOF

echo "✅ Tables dropped successfully."
