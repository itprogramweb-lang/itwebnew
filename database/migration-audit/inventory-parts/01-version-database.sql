select
  'version_database' as section,
  version() as postgres_version,
  current_database() as database_name,
  pg_database_size(current_database()) as database_size_bytes,
  pg_size_pretty(pg_database_size(current_database())) as database_size_pretty;