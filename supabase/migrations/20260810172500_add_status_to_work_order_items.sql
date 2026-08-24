ALTER TABLE public.work_order_items
ADD COLUMN status text NOT NULL DEFAULT 'pending';
