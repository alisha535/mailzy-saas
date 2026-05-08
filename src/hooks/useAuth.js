import { useState, useCallback } from 'react'
import { db, seedData } from '../lib/storage'

export function useAuth() {
  const [user, setUser] = useState(() => db.get('im_session', null))

  const login = useCallback((u) => {
    db.set('im_session', u)
    setUser(u)
    seedData()
  }, [])

  const logout = useCallback(() => {
    db.del('im_session')
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch }
      db.set('im_session', updated)
      const users = db.get('im_users', {})
      if (users[prev.email]) { users[prev.email] = updated; db.set('im_users', users) }
      return updated
    })
  }, [])

  return { user, login, logout, updateUser }
}
