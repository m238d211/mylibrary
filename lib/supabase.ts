import { createClient } from "@supabase/supabase-js";

export function createPublicClient() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null; }
export function createServiceClient() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) throw new Error("Supabase server configuration is missing"); return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
