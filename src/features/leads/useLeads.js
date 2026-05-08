import { useCallback, useState } from 'react'
import { supabase }     from '../../lib/supabase'
import { useWorkspace } from '../../providers/WorkspaceProvider'
import { useToast }     from '../../providers/ToastProvider'
import { safeQuery }    from '../../lib/utils'
import { sanitizeLeadRow, rateLimit } from '../../lib/security'
import { PAGE_SIZE }    from '../../lib/constants'

export function useLeads() {
  const { workspace }               = useWorkspace()
  const { success, error: showErr } = useToast()
  const [leads,   setLeads]         = useState([])
  const [loading, setLoading]       = useState(false)
  const [total,   setTotal]         = useState(0)
  const [page,    setPage]          = useState(0)

  const load = useCallback(async ({ search = '', status = '', page: pg = 0 } = {}) => {
    if (!workspace) return
    setLoading(true)
    let q = supabase.from('leads')
      .select('*, lead_tags(tag)', { count: 'exact' })
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1)
    if (search) q = q.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,company.ilike.%${search}%`)
    if (status) q = q.eq('status', status)
    const { data, error, count } = await q
    if (error) { showErr('Failed to load leads'); setLoading(false); return }
    setLeads(data ?? [])
    setTotal(count ?? 0)
    setPage(pg)
    setLoading(false)
  }, [workspace])

  const create = useCallback(async (lead) => {
    if (!workspace) return null
    const { data, error } = await safeQuery(() =>
      supabase.from('leads').insert({ ...lead, workspace_id: workspace.id }).select().single()
    )
    if (error) { showErr('Failed to create lead'); return null }
    setLeads(prev => [data, ...prev])
    success('Lead created')
    return data
  }, [workspace])

  const update = useCallback(async (id, patch) => {
    const { data, error } = await safeQuery(() =>
      supabase.from('leads').update(patch).eq('id', id).select().single()
    )
    if (error) { showErr('Failed to update lead'); return null }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
    return data
  }, [])

  const remove = useCallback(async (id) => {
    const { error } = await safeQuery(() =>
      supabase.from('leads').delete().eq('id', id)
    )
    if (!error) { setLeads(prev => prev.filter(l => l.id !== id)); success('Lead deleted') }
  }, [])

  const bulkImport = useCallback(async (rows) => {
    if (!workspace || !rows.length) return 0

    // Rate limit: max 5 imports per minute
    const { allowed, retryAfter } = rateLimit(`import-${workspace.id}`, 5, 60)
    if (!allowed) { showErr(`Too many imports. Wait ${retryAfter}s and try again.`); return 0 }

    // Sanitize + validate each row — drops invalid emails automatically
    const mapped = rows
      .map(r => sanitizeLeadRow(r))
      .filter(Boolean)                       // null = invalid row, filtered out
      .map(r => ({ ...r, workspace_id: workspace.id }))

    if (!mapped.length) { showErr('No valid leads found in CSV. Check email column.'); return 0 }

    const { data, error } = await safeQuery(() =>
      supabase.from('leads').upsert(mapped, { onConflict: 'workspace_id,email', ignoreDuplicates: true }).select()
    )
    if (error) { showErr('Import failed'); return 0 }
    success(`${data?.length ?? 0} leads imported (${rows.length - mapped.length} invalid rows skipped)`)
    await load()
    return data?.length ?? 0
  }, [workspace, load])

  return { leads, loading, total, page, load, create, update, remove, bulkImport }
}
