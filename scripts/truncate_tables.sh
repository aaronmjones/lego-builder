#!/bin/bash

# Database connection details
DB_NAME="legodb"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# List of tables to truncate
TABLES="lego_sets, lego_pieces, set_pieces, user_set_pieces"

# Build TRUNCATE SQL
TRUNCATE_CMD="TRUNCATE $TABLES CASCADE;"

# Run the command
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$TRUNCATE_CMD"
