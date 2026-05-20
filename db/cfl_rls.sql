-- ============================================================================
-- CFL ROW LEVEL SECURITY — Additional policies
-- Run after cfl_schema.sql
-- ============================================================================

-- Centres and villages are readable by all authenticated users
create policy cfl_centre_read   on cfl_centres        for select using (true);
create policy cfl_villages_read on cfl_villages        for select using (true);
create policy cfl_daily_read    on cfl_daily_summaries for select using (true);
create policy cfl_perf_read     on cfl_performance_scores for select using (true);
create policy cfl_live_read     on cfl_counselor_live_status for select using (true);
create policy cfl_live_upsert   on cfl_counselor_live_status for all using (true);
create policy cfl_assign_write  on cfl_assignments     for insert with check (true);
create policy cfl_assign_update on cfl_assignments     for update using (true);
create policy cfl_summary_write on cfl_daily_summaries for all using (true);

-- Storage bucket policy: counselors can upload to their own folder
-- Run in Supabase dashboard under Storage → Policies
-- insert: bucket_id = 'cfl-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
-- select: bucket_id = 'cfl-uploads' (public read)
