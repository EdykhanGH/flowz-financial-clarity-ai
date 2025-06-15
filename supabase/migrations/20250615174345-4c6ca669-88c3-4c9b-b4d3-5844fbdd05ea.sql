
-- Enable replica identity for real-time updates
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.transactions;
