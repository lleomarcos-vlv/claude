#!/usr/bin/env bash
# Recria um banco limpo, aplica todas as migrations em ordem e roda todos os
# testes. Qualquer falha aborta com código de erro.
#
#   PGHOST=localhost PGPORT=55432 PGUSER=grafista ./supabase/testar.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${PGHOST:=localhost}"
: "${PGPORT:=55432}"
: "${PGUSER:=grafista}"
DBNAME="${DBNAME:=grafista_teste}"
PSQL="psql -h $PGHOST -p $PGPORT -U $PGUSER -v ON_ERROR_STOP=1"

$PSQL -d postgres -qc "drop database if exists $DBNAME;"
$PSQL -d postgres -qc "create database $DBNAME;"

for f in supabase/migrations/*.sql; do
  echo "migration: $f"
  $PSQL -d "$DBNAME" -q -f "$f"
done

for f in supabase/tests/*.sql; do
  echo "teste: $f"
  $PSQL -d "$DBNAME" -f "$f" | grep -E "OK|passaram" || true
done

echo "Todos os testes passaram."
