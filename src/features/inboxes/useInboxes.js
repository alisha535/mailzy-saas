import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useWorkspace } from '../../providers/WorkspaceProvider'
import { useToast } from '../../providers/ToastProvider'
import { safeQuery } from '../../lib/utils'

export function useInboxes() {
  const { workspace } = useWorkspace()
  const { success, error: showErr } = useToast()
  const [inboxes, setInboxes] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!workspace) return
    setLoading(true)
    const { data, error } = await safeQuery(() =>
      supabase.from('smtp_accounts')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
    )
    if (error) showErr('Failed to load email accounts')
    else setInboxes(data ?? [])
    setLoading(false)
  }, [workspace, showErr])

  const create = useCallback(async (accountData) => {
    if (!workspace) return null
    const { data, error } = await safeQuery(() =>
      supabase.from('smtp_accounts').insert({ ...accountData, workspace_id: workspace.id }).select().single()
    )
    if (error) { showErr('Failed to connect email account'); return null }
    setInboxes(prev => [data, ...prev])
    success('Email account connected successfully')
    return data
  }, [workspace, showErr, success])

  const update = useCallback(async (id, patch) => {
    const { data, error } = await safeQuery(() =>
      supabase.from('smtp_accounts').update(patch).eq('id', id).select().single()
    )
    if (error) { showErr('Failed to update email account'); return null }
    setInboxes(prev => prev.map(acc => acc.id === id ? { ...acc, ...data } : acc))
    success('Account updated')
    return data
  }, [showErr, success])

  const remove = useCallback(async (id) => {
    const { error } = await safeQuery(() =>
      supabase.from('smtp_accounts').delete().eq('id', id)
    )
    if (!error) { 
      setInboxes(prev => prev.filter(acc => acc.id !== id)); 
      success('Email account disconnected') 
    } else {
      showErr('Failed to disconnect account')
    }
  }, [showErr, success])

  return { inboxes, loading, load, create, update, remove }
}
