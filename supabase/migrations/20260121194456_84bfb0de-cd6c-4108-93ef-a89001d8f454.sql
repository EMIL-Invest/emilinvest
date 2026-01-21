-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create quarterly_reports table
CREATE TABLE public.quarterly_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    quarter TEXT NOT NULL,
    year INTEGER NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quarterly_reports
ALTER TABLE public.quarterly_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can view reports
CREATE POLICY "Anyone can view reports" 
ON public.quarterly_reports 
FOR SELECT 
USING (true);

-- Only authenticated users can insert reports
CREATE POLICY "Authenticated users can insert reports" 
ON public.quarterly_reports 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- Only the uploader can delete their reports
CREATE POLICY "Users can delete their own reports" 
ON public.quarterly_reports 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true);

-- Storage policies for reports bucket
CREATE POLICY "Anyone can view report files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'reports');

CREATE POLICY "Authenticated users can upload report files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own report files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamp
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();