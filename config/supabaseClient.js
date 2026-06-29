// config/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validasi agar error jelas jika kredensial kosong
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env!');
    process.exit(1);
}

// Buat client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client siap digunakan!');

// ============================================
// ⚠️ PERHATIAN: EKSPOR LANGSUNG (BUKAN OBJEK!)
// ============================================
module.exports = supabase; // <-- INI YANG BENAR!