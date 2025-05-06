import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

// Check if URL is valid before creating client
if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
  console.error('Invalid Supabase credentials. Please update your .env file with valid credentials.');
  
  // Provide fallback values for development to prevent app from crashing
  // This allows the app to load, but Supabase operations will fail until proper credentials are set
  const fallbackUrl = 'https://placeholder-project.supabase.co';
  const fallbackKey = 'placeholder-key';
  
  supabase = createClient(fallbackUrl, fallbackKey);
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
