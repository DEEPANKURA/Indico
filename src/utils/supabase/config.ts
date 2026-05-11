'use client';

let supabaseUrl: string | null = null;
let supabaseAnonKey: string | null = null;
export function setSupabaseConfig(url: string, anonKey: string) {
  supabaseUrl = url;
  supabaseAnonKey = anonKey;
}

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  };
}
