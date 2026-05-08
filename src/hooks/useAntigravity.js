import { useCallback, useState } from 'react'

export function useAntigravity() {
  const [active, setActive] = useState(false)
  const toggle = useCallback(() => setActive(prev => !prev), [])
  const register = useCallback((ref, id) => {
    // Optional: add logic to register elements for the Antigravity system
  }, [])

  return { active, toggle, register }
}
