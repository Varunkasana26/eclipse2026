const { createClient } = require("@supabase/supabase-js");

const env = require("../config/env");

function createSupabaseClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

module.exports = {
  createSupabaseClient,
};
