-- ==========================================
-- 0001_workspaces.sql
-- ==========================================

-- 1. Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- 3. Update transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'fixed'));

-- 4. Update bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'fixed'));

-- 5. Update tasks table (optional but good practice to scope under workspace)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 6. Row Level Security Policies Refactor

-- Drop old constraints/policies if needed (Assuming old rules were based on user_id)
-- Example: DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

-- Enable RLS on all relevant tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies: Users can view their workspace
CREATE POLICY "Users can view their own workspace" 
ON public.workspaces FOR SELECT 
USING (
  id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Profiles Policies Refactored
CREATE POLICY "Users can view profiles in the same workspace"
ON public.profiles FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
  OR id = auth.uid()
);

-- Transactions Policies
CREATE POLICY "Users can view transactions in their workspace"
ON public.transactions FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert transactions in their workspace"
ON public.transactions FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update transactions in their workspace"
ON public.transactions FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete transactions in their workspace"
ON public.transactions FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Bills Policies
CREATE POLICY "Users can view bills in their workspace"
ON public.bills FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert bills in their workspace"
ON public.bills FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update bills in their workspace"
ON public.bills FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete bills in their workspace"
ON public.bills FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Tasks Policies
CREATE POLICY "Users can view tasks in their workspace"
ON public.tasks FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert tasks in their workspace"
ON public.tasks FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks in their workspace"
ON public.tasks FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks in their workspace"
ON public.tasks FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);
