import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Temporarily use direct values
const supabaseUrl = 'https://djakcvrikzghcnywhlzv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYWtjdnJpa3pnaGNueXdobHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4ODI3NjcsImV4cCI6MjA1NTQ1ODc2N30.wzsi9UCvpNefVqBIenFA3KK65l82HCQWDi3GGKSUyn4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Initializes and configures the Supabase client for all database operations 