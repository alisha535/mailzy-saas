import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../providers/WorkspaceProvider';

export function useUnibox() {
  const { workspace: currentWorkspace } = useWorkspace();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;
    fetchEmails();
  }, [currentWorkspace]);

  async function fetchEmails() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select(`
          id, to_email, to_name, subject, body_html, body_text,
          from_email, from_name, opened, clicked, replied, sent_at,
          leads ( id, first_name, last_name, email, company, status )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'SENT')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEmails(data || []);
    } catch (err) {
      console.error('Unibox fetch error:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateLeadStatus(leadId, status) {
    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) throw error;
    // refresh
    await fetchEmails();
  }

  return { emails, loading, updateLeadStatus, refresh: fetchEmails };
}
