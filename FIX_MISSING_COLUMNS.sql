-- Fix missing columns in user_settings table
-- Run this in your Supabase SQL Editor

-- Add missing columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS device_sync_enabled BOOLEAN DEFAULT true;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;