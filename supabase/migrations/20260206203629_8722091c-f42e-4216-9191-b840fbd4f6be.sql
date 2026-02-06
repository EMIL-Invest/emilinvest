-- Fix 1: Storage bucket policy - restrict file deletion to file owner
-- Drop the insecure policy that allows any authenticated user to delete files
DROP POLICY IF EXISTS "Users can delete their own report files" ON storage.objects;

-- Create a secure policy that only allows the file uploader to delete their files
CREATE POLICY "Users can delete their own report files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'reports' 
  AND auth.uid() IN (
    SELECT uploaded_by 
    FROM public.quarterly_reports 
    WHERE file_url LIKE '%' || name
  )
);

-- Fix 2: Competition participants - restrict public access to protect user privacy
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view competition participants" ON public.competition_participants;

-- Create policy that only allows authenticated users to view participants
-- This is appropriate since the competition is for logged-in users only
CREATE POLICY "Authenticated users can view competition participants" 
ON public.competition_participants 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Also restrict competition_portfolios to authenticated users only
DROP POLICY IF EXISTS "Anyone can view competition portfolios" ON public.competition_portfolios;

CREATE POLICY "Authenticated users can view competition portfolios" 
ON public.competition_portfolios 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Also restrict competition_leaderboard to authenticated users only
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.competition_leaderboard;

CREATE POLICY "Authenticated users can view leaderboard" 
ON public.competition_leaderboard 
FOR SELECT 
USING (auth.role() = 'authenticated');