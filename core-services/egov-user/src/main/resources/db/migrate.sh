#!/bin/sh

# Flyway 10 removed -ignoreMissingMigrations; use ignoreMigrationPatterns instead.
# *:missing -> DBs already carry migrations this image does not ship (e.g. CSC tables)
# *:future  -> keep Flyway default (applied versions newer than any local one)
flyway -url=$DB_URL -table=$SCHEMA_TABLE -user=$FLYWAY_USER -password=$FLYWAY_PASSWORD -locations=$FLYWAY_LOCATIONS -baselineOnMigrate=true -outOfOrder=true -ignoreMigrationPatterns='*:missing,*:future' migrate
