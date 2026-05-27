import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || "")
  .replace(/\.supabase\.com$/, ".supabase.co");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: { name?: string; avatar_url?: string };
};
