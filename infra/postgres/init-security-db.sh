#!/bin/sh
set -eu

psql \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --set=ON_ERROR_STOP=1 \
    --set=security_db="${SECURITY_DB_NAME:-aylzz_identity}" \
    --set=app_user="$POSTGRES_USER" <<'SQL'
SELECT format('CREATE DATABASE %I OWNER %I', :'security_db', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'security_db')
\gexec

SELECT format('ALTER DATABASE %I OWNER TO %I', :'security_db', :'app_user')
\gexec
SQL
