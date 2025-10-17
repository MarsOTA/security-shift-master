-- Creazione tabella profili utente
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  operator_id TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Creazione tabella operatori
CREATE TABLE public.operators (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators are viewable by authenticated users"
ON public.operators FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Operators can be inserted by authenticated users"
ON public.operators FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Operators can be updated by authenticated users"
ON public.operators FOR UPDATE
USING (auth.role() = 'authenticated');

-- Creazione tabella turni
CREATE TABLE public.shifts (
  id TEXT NOT NULL PRIMARY KEY,
  event_id TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  activity_type TEXT,
  role TEXT,
  pause_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shifts are viewable by authenticated users"
ON public.shifts FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Shifts can be managed by authenticated users"
ON public.shifts FOR ALL
USING (auth.role() = 'authenticated');

-- Creazione tabella assegnazioni turni
CREATE TABLE public.shift_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shift assignments are viewable by authenticated users"
ON public.shift_assignments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Shift assignments can be managed by authenticated users"
ON public.shift_assignments FOR ALL
USING (auth.role() = 'authenticated');

-- Creazione tabella check-in turni
CREATE TABLE public.shift_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  location_lat NUMERIC,
  location_lng NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins"
ON public.shift_checkins FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own checkins"
ON public.shift_checkins FOR ALL
USING (auth.role() = 'authenticated');

-- Creazione tabella notifiche
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their operator_id"
ON public.notifications FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.role() = 'authenticated');

-- Creazione tabella sottoscrizioni push
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.role() = 'authenticated');

-- Trigger per creare automaticamente un profilo quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'operator');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();