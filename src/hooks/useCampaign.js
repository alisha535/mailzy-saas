import { useState, useCallback } from 'react'
import { db } from '../lib/storage'

export function useCampaign() {
  const [campaigns, setCampaigns] = useState(() => db.get('im_campaigns', []))

  const refresh = useCallback(() => setCampaigns(db.get('im_campaigns', [])), [])

  const save = useCallback((campaign) => {
    const all = db.get('im_campaigns', [])
    const idx = all.findIndex(c => c.id === campaign.id)
    if (idx >= 0) all[idx] = campaign; else all.unshift(campaign)
    db.set('im_campaigns', all)
    setCampaigns([...all])
    return campaign
  }, [])

  const remove = useCallback((id) => {
    const all = db.get('im_campaigns', []).filter(c => c.id !== id)
    db.set('im_campaigns', all)
    setCampaigns(all)
  }, [])

  const simulateSend = useCallback(async (id, onTick) => {
    const all = db.get('im_campaigns', [])
    const idx = all.findIndex(c => c.id === id)
    if (idx < 0) return
    await new Promise(r => setTimeout(r, 1800))
    all[idx] = {
      ...all[idx],
      sent:     (all[idx].sent     || 0) + Math.floor(Math.random() * 12 + 5),
      replied:  (all[idx].replied  || 0) + (Math.random() > 0.6 ? 1 : 0),
      clicked:  (all[idx].clicked  || 0) + Math.floor(Math.random() * 4),
      progress: Math.min(100, (all[idx].progress || 0) + 5),
    }
    db.set('im_campaigns', all)
    setCampaigns([...all])
    if (onTick) onTick(all[idx])
  }, [])

  return { campaigns, refresh, save, remove, simulateSend }
}
