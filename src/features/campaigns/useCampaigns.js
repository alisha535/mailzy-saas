import { useCallback, useState } from 'react'
import { supabase }     from '../../lib/supabase'
import { useWorkspace } from '../../providers/WorkspaceProvider'
import { useToast }     from '../../providers/ToastProvider'
import { safeQuery }    from '../../lib/utils'

export function useCampaigns() {
  const { workspace }               = useWorkspace()
  const { success, error: showErr } = useToast()
  const [campaigns, setCampaigns]   = useState([])
  const [loading,   setLoading]     = useState(false)

  const load = useCallback(async () => {
    if (!workspace) return
    setLoading(true)
    const { data, error } = await safeQuery(() =>
      supabase.from('campaigns')
        .select('*, campaign_steps(*), smtp_accounts(name, email)')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
    )
    if (error) showErr('Failed to load campaigns')
    else setCampaigns(data ?? [])
    setLoading(false)
  }, [workspace])

  const create = useCallback(async (campaign) => {
    if (!workspace) return null
    const { steps, ...rest } = campaign
    const { data, error } = await safeQuery(() =>
      supabase.from('campaigns').insert({ ...rest, workspace_id: workspace.id }).select().single()
    )
    if (error) { showErr('Failed to create campaign'); return null }
    if (steps?.length) {
      await supabase.from('campaign_steps').insert(
        steps.map((s, i) => ({ ...s, campaign_id: data.id, step_number: i + 1 }))
      )
    }
    success('Campaign created')
    await load()
    return data
  }, [workspace, load])

  const update = useCallback(async (id, patch) => {
    const { steps, ...rest } = patch
    const { data, error } = await safeQuery(() =>
      supabase.from('campaigns').update(rest).eq('id', id).select().single()
    )
    if (error) { showErr('Failed to update campaign'); return null }
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    return data
  }, [])

  const remove = useCallback(async (id) => {
    const { error } = await safeQuery(() =>
      supabase.from('campaigns').delete().eq('id', id)
    )
    if (!error) { setCampaigns(prev => prev.filter(c => c.id !== id)); success('Campaign deleted') }
  }, [])

  const setStatus = useCallback(async (id, status) => {
    const { data } = await safeQuery(() =>
      supabase.from('campaigns').update({ status }).eq('id', id).select().single()
    )
    if (data) setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }, [])

  return { campaigns, loading, load, create, update, remove, setStatus }
}
