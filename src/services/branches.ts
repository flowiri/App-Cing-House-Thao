import { Branch } from '../types';
import { supabase } from '../lib/supabase';

type BranchRow = {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  sort_order: number;
};

const branchColumns = 'id, name, code, is_active, sort_order';

function toBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? undefined,
    isActive: row.is_active,
    sortOrder: row.sort_order
  };
}

export async function loadBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select(branchColumns)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as BranchRow[]).map(toBranch);
}
