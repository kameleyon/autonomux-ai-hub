-- Enable realtime for profiles table (needed by useRealtimeProfile hook)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;