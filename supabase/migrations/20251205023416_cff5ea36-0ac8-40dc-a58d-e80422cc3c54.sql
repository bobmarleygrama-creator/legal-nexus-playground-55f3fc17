-- Add cidade and estado columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN cidade text,
ADD COLUMN estado text;