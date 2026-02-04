-- Create instagram_posts table for manual Instagram feed management
CREATE TABLE public.instagram_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- Public can view all posts
CREATE POLICY "Anyone can view instagram posts"
ON public.instagram_posts
FOR SELECT
USING (true);

-- Admins can insert posts
CREATE POLICY "Admins can insert instagram posts"
ON public.instagram_posts
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update posts
CREATE POLICY "Admins can update instagram posts"
ON public.instagram_posts
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete posts
CREATE POLICY "Admins can delete instagram posts"
ON public.instagram_posts
FOR DELETE
USING (is_admin(auth.uid()));