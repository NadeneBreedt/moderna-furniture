import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';

// Create a single Supabase instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 