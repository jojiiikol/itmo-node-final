#!/bin/sh
set -eu

psql --set=ON_ERROR_STOP=1 \
  --set=app_user="$POSTGRES_APP_USER" \
  --set=app_password="$POSTGRES_APP_PASSWORD" \
  --set=teacher_user="$POSTGRES_TEACHER_USER" \
  --set=teacher_password="$POSTGRES_TEACHER_PASSWORD" \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user') \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'teacher_user', :'teacher_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'teacher_user') \gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_user') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'teacher_user') \gexec
SELECT format('GRANT USAGE, CREATE ON SCHEMA public TO %I', :'app_user') \gexec
SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'teacher_user') \gexec
SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
  :'app_user', :'teacher_user'
) \gexec
SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
  :'app_user', :'teacher_user'
) \gexec
SQL
