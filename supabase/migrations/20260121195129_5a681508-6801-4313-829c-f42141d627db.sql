-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Create invitations table
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role app_role NOT NULL DEFAULT 'member',
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Admins can view all invitations" 
ON public.invitations 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update invitations" 
ON public.invitations 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete invitations" 
ON public.invitations 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Allow checking invitation by email (for signup)
CREATE POLICY "Anyone can check their own invitation" 
ON public.invitations 
FOR SELECT 
USING (lower(email) = lower(current_setting('request.jwt.claims', true)::json->>'email'));

-- Function to check if email is invited
CREATE OR REPLACE FUNCTION public.is_email_invited(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations
    WHERE lower(email) = lower(_email)
      AND used = false
      AND expires_at > now()
  )
$$;

-- Function to mark invitation as used and assign role
CREATE OR REPLACE FUNCTION public.use_invitation(_user_id UUID, _email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO _invitation
  FROM public.invitations
  WHERE lower(email) = lower(_email)
    AND used = false
    AND expires_at > now()
  LIMIT 1;
  
  IF _invitation IS NOT NULL THEN
    -- Mark invitation as used
    UPDATE public.invitations
    SET used = true
    WHERE id = _invitation.id;
    
    -- Assign role to user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _invitation.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Trigger to auto-use invitation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_with_invitation()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Use invitation if exists
    PERFORM public.use_invitation(NEW.id, NEW.email);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_with_invitation();

-- Update quarterly_reports policies to use role check
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.quarterly_reports;
CREATE POLICY "Members and admins can insert reports" 
ON public.quarterly_reports 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by 
  AND (public.has_role(auth.uid(), 'member') OR public.has_role(auth.uid(), 'admin'))
);