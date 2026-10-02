import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Afip from "npm:@afipsdk/afip.js@1.2.3";

async function main() {
  const supabase = createClient(
    Deno.env.get("VITE_SUPABASE_URL") || process.env.VITE_SUPABASE_URL || "https://wpfcpfrtasfqlqlxhgvl.supabase.co",
    Deno.env.get("VITE_SUPABASE_ANON_KEY") || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Wait, I need the actual service_role key, but I don't have it.
  );
}
main();
