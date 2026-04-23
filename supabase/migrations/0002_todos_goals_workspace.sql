-- Adicionar workspace_id para as tabelas faltantes (se ainda não tiverem)
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS workspace_id uuid NULL REFERENCES public.workspaces(id);

ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS workspace_id uuid NULL REFERENCES public.workspaces(id);

-- Para a tabela tasks, remover user_id e usar profile_id para padronizar com transactions/bills
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE public.tasks
RENAME COLUMN user_id TO profile_id;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id);

-- Drop de RLS antigos
DROP POLICY IF EXISTS "Usuário vê próprias metas ou compartilhadas" ON public.todos;
DROP POLICY IF EXISTS "Usuário cria próprias metas" ON public.todos;
DROP POLICY IF EXISTS "Usuário atualiza próprias metas" ON public.todos;

DROP POLICY IF EXISTS "Usuário vê próprias metas ou compartilhadas" ON public.goals;
DROP POLICY IF EXISTS "Usuário cria próprias metas" ON public.goals;
DROP POLICY IF EXISTS "Usuário atualiza próprias metas" ON public.goals;

DROP POLICY IF EXISTS "users can manage own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workspace Members Access" ON public.tasks;

-- NOVAS POLÍTICAS BASEADAS NO WORKSPACE
-- ===============================
-- 1. TODOS RLS
-- ===============================
CREATE POLICY "Membros do workspace veem todos"
ON public.todos FOR SELECT TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace inserem todos"
ON public.todos FOR INSERT TO public
WITH CHECK (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace atualizam todos"
ON public.todos FOR UPDATE TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace deletam todos"
ON public.todos FOR DELETE TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);


-- ===============================
-- 2. GOALS RLS
-- ===============================
CREATE POLICY "Membros do workspace veem goals"
ON public.goals FOR SELECT TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace inserem goals"
ON public.goals FOR INSERT TO public
WITH CHECK (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace atualizam goals"
ON public.goals FOR UPDATE TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace deletam goals"
ON public.goals FOR DELETE TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);


-- ===============================
-- 3. TASKS RLS
-- ===============================
CREATE POLICY "Membros do workspace veem tasks"
ON public.tasks FOR SELECT TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace inserem tasks"
ON public.tasks FOR INSERT TO public
WITH CHECK (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace atualizam tasks"
ON public.tasks FOR UPDATE TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Membros do workspace deletam tasks"
ON public.tasks FOR DELETE TO public
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE profiles.id = auth.uid())
);
