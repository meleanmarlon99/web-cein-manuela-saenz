const SUPABASE_URL = "https://xuufqmfftpawgkryiweq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ypl_GKIjWougJGT3Ulhr4Q_ws-fDBux";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("Cliente de Supabase creado correctamente.");