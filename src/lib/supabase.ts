import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ximmktvbqsijgpawhcee.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbW1rdHZicXNpamdwYXdoY2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzkxMzcsImV4cCI6MjEwMzE1NTEzN30.-NR4rVrqrK7TvtMow0n5jbZNZcvR-7Re9MOt_-6yXU8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
