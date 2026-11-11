#!/bin/sh
set -eu

if [ -z "${USERS_DB_BACKUP_USER:-}" ] || [ -z "${USERS_DB_BACKUP_PASSWORD:-}" ]; then
    printf '%s\n' "USERS_DB_BACKUP_USER/PASSWORD are unset; skipping backup role creation."
else
    psql \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --set=ON_ERROR_STOP=1 \
        --set=backup_user="$USERS_DB_BACKUP_USER" \
        --set=backup_password="$USERS_DB_BACKUP_PASSWORD" \
        --set=app_user="$POSTGRES_USER" \
        --set=database_name="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'backup_user', :'backup_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'backup_user')
\gexec
ALTER ROLE :"backup_user" PASSWORD :'backup_password';
GRANT CONNECT ON DATABASE :"database_name" TO :"backup_user";
GRANT USAGE ON SCHEMA public TO :"backup_user";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"backup_user";
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO :"backup_user";
ALTER DEFAULT PRIVILEGES FOR ROLE :"app_user" IN SCHEMA public
    GRANT SELECT ON TABLES TO :"backup_user";
ALTER DEFAULT PRIVILEGES FOR ROLE :"app_user" IN SCHEMA public
    GRANT SELECT ON SEQUENCES TO :"backup_user";
SQL
fi
