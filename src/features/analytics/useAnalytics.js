import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../providers/WorkspaceProvider';

export function useAnalytics() {
  const { workspace: currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalSent: 0,
    openRate: 0,
    replyRate: 0,
    opportunities: 0,
    monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    queueHealth: { pending: 0, failed: 0, sent: 0 }
  });
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (!currentWorkspace) return;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        // Fetch campaigns
        const { data: campaignData, error: campErr } = await supabase
          .from('campaigns')
          .select('id, name, status, total_sent, total_opened, total_replied')
          .eq('workspace_id', currentWorkspace.id);

        if (campErr) throw campErr;

        // Fetch leads
        const { data: leadData, error: leadErr } = await supabase
          .from('leads')
          .select('id, status')
          .eq('workspace_id', currentWorkspace.id);

        if (leadErr) throw leadErr;

        const camps = campaignData || [];
        const lds = leadData || [];

        const totalSent = camps.reduce((acc, c) => acc + (c.total_sent || 0), 0);
        const totalOpened = camps.reduce((acc, c) => acc + (c.total_opened || 0), 0);
        const totalReplied = camps.reduce((acc, c) => acc + (c.total_replied || 0), 0);

        const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
        const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : 0;
        const opportunities = lds.filter(l => ['WON', 'MEETING_BOOKED', 'INTERESTED'].includes(l.status)).length;

        // Build a simple 12-month distribution from total sent
        const monthly = Array(12).fill(0);
        const perMonth = Math.floor(totalSent / 12);
        camps.forEach((_, idx) => {
          monthly[idx % 12] += Math.floor((camps[idx]?.total_sent || 0) / Math.max(camps.length, 1));
        });
        // Always show at least some data for current month
        monthly[new Date().getMonth()] = Math.max(monthly[new Date().getMonth()], totalSent);

        // Fetch queue health
        const { data: queueData } = await supabase
          .from('email_queue')
          .select('status')
          .eq('workspace_id', currentWorkspace.id);

        const qHealth = { pending: 0, failed: 0, sent: 0 };
        if (queueData) {
          queueData.forEach(q => {
            if (q.status === 'PENDING') qHealth.pending++;
            else if (q.status === 'FAILED' || q.status === 'PERMANENTLY_FAILED') qHealth.failed++;
            else if (q.status === 'SENT') qHealth.sent++;
          });
        }

        setData({ totalSent, openRate, replyRate, opportunities, monthly, queueHealth: qHealth });

        // Map campaigns to the structure expected by the UI
        setCampaigns(camps.map(c => ({
          id: c.id,
          name: c.name,
          sent: c.total_sent,
          replied: c.total_replied,
          progress: c.status === 'COMPLETED' ? 100 : (c.total_sent > 0 ? 50 : 0) // rough mock
        })));

        setLeads(lds);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [currentWorkspace]);

  return { loading, data, campaigns, leads };
}
