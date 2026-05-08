import { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { Card, Btn, Ic, ICONS, Inp, ToastBar } from '../../components/ui';

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toasts, success, error: showErr } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    groq_key: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        groq_key: profile.groq_key || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile({
        name: form.name,
        groq_key: form.groq_key
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      success('Settings saved!');
    } catch (err) {
      showErr('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <ToastBar toasts={toasts} />
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">Account Settings</h1>
          <p className="text-[#86868B] font-semibold mt-1">Manage your profile and platform preferences</p>
        </div>

        <div className="space-y-6">
          <Card cls="p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/5">
              <div className="w-10 h-10 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]">
                <Ic d={ICONS.users} s={20} />
              </div>
              <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">Profile Details</h3>
            </div>

            <div className="space-y-6">
              <Inp label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="John Appleseed" />
              <Inp label="Email Address" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="john@example.com" />
              <Inp
                label="Workspace"
                value={profile?.workspaces?.[0]?.name || 'Personal Workspace'}
                onChange={() => { }}
                disabled
                hint="Workspace names are managed by administrators"
              />
            </div>
          </Card>

          <Card cls="p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/5">
              <div className="w-10 h-10 bg-[#AF52DE]/10 rounded-xl flex items-center justify-center text-[#AF52DE]">
                <Ic d={ICONS.cpu} s={20} />
              </div>
              <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">AI & Connectivity</h3>
            </div>

            <p className="text-[#86868B] text-[13px] font-medium mb-6">Connect your Groq account to power AI features like Copilot and cold email generation.</p>

            <div className="relative">
              <Inp
                label="Groq API Key"
                value={form.groq_key}
                onChange={v => setForm(f => ({ ...f, groq_key: v }))}
                placeholder="gsk_..."
                type="password"
                hint="Get a free key at console.groq.com"
              />
            </div>
          </Card>

          <Card cls="p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF9500]/10 rounded-xl flex items-center justify-center text-[#FF9500]">
                  <Ic d={ICONS.star} s={20} />
                </div>
                <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">Subscription Plan</h3>
              </div>
              <div className="px-4 py-1.5 bg-[#F5F5F7] rounded-full text-[#1D1D1F] text-sm font-black uppercase tracking-wider">
                {profile?.plan || 'Free'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 bg-[#FF9500] text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-orange-500/20">
                  <Ic d={ICONS.star} s={16} />
                  <span className="font-black text-sm">{profile?.coins || 0} Coins Available</span>
                </div>
                <p className="text-[#86868B] text-sm font-bold">Renewal on June 1, 2026</p>
              </div>
              <Btn v="secondary" sz="sm">Upgrade Plan</Btn>
            </div>
          </Card>

          <div className="pt-6">
            <Btn
              onClick={handleSave}
              disabled={loading}
              sz="lg"
              cls="w-full justify-center shadow-blue-500/25"
              icon={saved ? "check" : "bolt"}
            >
              {loading ? "Saving changes..." : saved ? "Changes Saved!" : "Update Account Settings"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
