import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://rkrmyhnboaoslczdnsxi.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcm15aG5ib2Fvc2xjemRuc3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDU4OTAsImV4cCI6MjEwNjQyMTg5MH0.OrY0rrmxicLpsjrRfp2ciAA0mJbk01L4tfO1BMsoZms';

const authStorage =
  Platform.OS === 'web' && typeof window !== 'undefined' ? localStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
