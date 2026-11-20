const SUPABASE_URL =
  "https://bfvbcxqfosxaynsvjord.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_saSWjnEGHwFKxIlW9vQVTg_bz89swJZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
