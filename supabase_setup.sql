-- COPY AND PASTE THIS INTO YOUR SUPABASE SQL EDITOR
-- Link: https://havxdwfrnpyytmjgvtlj.supabase.co/project/sql

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  role text,
  goals text[],
  ai_level text,
  learning_style text,
  xp int DEFAULT 0,
  level int DEFAULT 1,
  streak int DEFAULT 1,
  last_visit timestamp with time zone DEFAULT now()
);

-- Ensure name column exists if table was already created
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE users ADD COLUMN name text;
  END IF; 
END $$;

-- 2. Model Guides Table (Backend for MasterGuides)
CREATE TABLE IF NOT EXISTS model_guides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name text UNIQUE NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_model_guides_name ON model_guides(model_name);