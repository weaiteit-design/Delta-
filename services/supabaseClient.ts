import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://havxdwfrnpyytmjgvtlj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhdnhkd2ZybnB5eXRtamd2dGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDc0MDEsImV4cCI6MjA4NTUyMzQwMX0._-r-5rMRyksv6rfy_f7q0n_wBAOsXt3-1EUDdjT9qSs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);