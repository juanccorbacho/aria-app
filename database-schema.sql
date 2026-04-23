-- ========== Extensions prerequisites (in case not already present) ==========
-- Safe to keep if already enabled; harmless if already installed.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- for uuid_generate_v4()

-- ========== Table: public.categories ==========
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['income'::text, 'expense'::text])),
  color text NULL,
  icon text NULL,
  created_by uuid NULL,
  created_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ========== RLS: public.categories ==========
CREATE POLICY "Usuários autenticados veem categorias"
ON public.categories
FOR SELECT TO public
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Usuário vê próprios todos ou compartilhados"
ON public.categories
FOR SELECT TO public
USING ((auth.uid() = created_by) OR (is_shared = true));

CREATE POLICY "Usuário cria próprios todos"
ON public.categories
FOR INSERT TO public
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuário atualiza próprios todos"
ON public.categories
FOR UPDATE TO public
USING (auth.uid() = created_by);

-- ========== Table: public.todos ==========
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  is_done boolean NULL DEFAULT false,
  due_date date NULL,
  recurrent boolean NULL DEFAULT false,
  recurrence_interval text NULL CHECK (recurrence_interval = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  responsible_id uuid NULL,
  is_shared boolean NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ========== RLS: public.todos ==========
CREATE POLICY "Usuário vê próprias metas ou compartilhadas"
ON public.todos
FOR SELECT TO public
USING ((auth.uid() = created_by) OR (is_shared = true));

CREATE POLICY "Usuário cria próprias metas"
ON public.todos
FOR INSERT TO public
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuário atualiza próprias metas"
ON public.todos
FOR UPDATE TO public
USING (auth.uid() = created_by);

-- ========== Table: public.goals ==========
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NULL DEFAULT 0,
  deadline date NULL,
  is_shared boolean NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- ========== RLS: public.goals ==========
CREATE POLICY "Usuário vê próprias metas ou compartilhadas"
ON public.goals
FOR SELECT TO public
USING ((auth.uid() = created_by) OR (is_shared = true));

CREATE POLICY "Usuário cria próprias metas"
ON public.goals
FOR INSERT TO public
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuário atualiza próprias metas"
ON public.goals
FOR UPDATE TO public
USING (auth.uid() = created_by);

-- ========== Table: public.tasks ==========
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  due_date date NULL,
  created_at timestamptz NULL DEFAULT now(),
  workspace_id uuid NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users (id);

-- ========== RLS: public.tasks ==========
CREATE POLICY "users can manage own tasks"
ON public.tasks
FOR ALL TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workspace Members Access"
ON public.tasks
FOR ALL TO public
USING (
  workspace_id = (
    SELECT profiles.workspace_id
    FROM public.profiles
    WHERE (profiles.id = auth.uid())
  )
)
WITH CHECK (
  workspace_id = (
    SELECT profiles.workspace_id
    FROM public.profiles
    WHERE (profiles.id = auth.uid())
  )
);

-- ========== Table: public.workspaces ==========
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  slug text NULL UNIQUE,
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- (RLS policies not returned for this table via metadata tool)

-- ========== Table: public.profiles ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  workspace_id uuid NULL,
  full_name text NULL,
  avatar_url text NULL,
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces (id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users (id);

-- ========== Table: public.transactions ==========
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  description text NULL,
  category text NULL,
  amount_cents bigint NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['INCOME'::text, 'EXPENSE'::text])),
  occurred_at date NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces (id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles (id);

-- ========== Table: public.bills ==========
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  name text NOT NULL,
  amount_cents bigint NULL,
  due_date date NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['PENDING'::text, 'PAID'::text])),
  priority text NOT NULL CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text])),
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bills
  ADD CONSTRAINT bills_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces (id);

ALTER TABLE public.bills
  ADD CONSTRAINT bills_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles (id);