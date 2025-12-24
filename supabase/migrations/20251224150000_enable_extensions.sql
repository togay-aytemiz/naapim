-- Enable pg_net for HTTP requests
create extension if not exists pg_net with schema extensions;

-- Enable pg_cron for job scheduling
create extension if not exists pg_cron with schema extensions;

-- Grant usage to postgres role (default)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
