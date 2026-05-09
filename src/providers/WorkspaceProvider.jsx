import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspace,   setWorkspace]   = useState(null)
  const [workspaces,  setWorkspaces]  = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (user) loadWorkspaces()
    else { setWorkspace(null); setWorkspaces([]); setLoading(false) }
  }, [user])

  async function loadWorkspaces() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', user.id)

      const ws = data?.map(m => ({ ...m.workspaces, role: m.role })) ?? []
      setWorkspaces(ws)

      // Load last selected or default to first
      const savedId = localStorage.getItem('mailzy_workspace')
      const active  = ws.find(w => w.id === savedId) ?? ws[0] ?? null
      setWorkspace(active)
    } catch (e) {
      console.error('[Workspace] Load failed:', e)
      setWorkspace(null)
      setWorkspaces([])
    } finally {
      setLoading(false)
    }
  }

  function switchWorkspace(ws) {
    if (ws) {
      setWorkspace(ws)
      localStorage.setItem('mailzy_workspace', ws.id)
    }
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaces, loading, switchWorkspace, reload: loadWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
