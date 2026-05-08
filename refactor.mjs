import fs from 'fs';
import path from 'path';

const SRC = 'c:/Users/Ritik/Downloads/mailzy/instantly-saas/src';
const ALL_PAGES = path.join(SRC, 'components/pages/AllPages.jsx');

const code = fs.readFileSync(ALL_PAGES, 'utf8');

// The file has clear sections.
// E.g. /* ═══════════════════════════════════════════════════════════════
//    SECTION 1 — SYSTEM CONFIG & CONSTANTS
// ═══════════════════════════════════════════════════════════════ */

const sections = code.split(/\/\* ═══════════════════════════════════════════════════════════════\s*\n\s*SECTION \d+ — [^\n]+\n\s*═══════════════════════════════════════════════════════════════ \*\//);

// Sections array:
// 0: top imports
// 1: SYSTEM CONFIG
// 2: STORAGE ENGINE
// 3: SEED DATA
// 4: CUSTOM HOOKS
// 5: ICON SYSTEM
// 6: UI COMPONENT LIBRARY
// 7: AUTH PAGE
// 8: LAYOUT COMPONENTS
// 9: COPILOT PAGE
// 10: AI AGENTS PAGE
// 11: SUPERSEARCH PAGE
// 12: UNIBOX PAGE
// 13: CAMPAIGNS PAGE
// 14: LEADS PAGE
// 15: ANALYTICS PAGE
// 16: EMAIL TRACKER
// 17: EMAIL VERIFIER
// 18: EMAIL TESTER
// 19: AUTOMATION + INBOXES + SETTINGS
// 20: MAIN APP ASSEMBLY (and generateFallbackEmail)

const hooksCode = sections[4];
const uiLibCode = sections[6];
const authPageCode = sections[7];
const layoutCode = sections[8];
const copilotPageCode = sections[9];
const agentsPageCode = sections[10];
const superSearchPageCode = sections[11];
const uniboxPageCode = sections[12];
const campaignsPageCode = sections[13];
const leadsPageCode = sections[14];
const analyticsPageCode = sections[15];
const emailTrackerPageCode = sections[16];
const emailVerifierPageCode = sections[17];
const emailTesterPageCode = sections[18];
const settingsCode = sections[19];
const mainAppCode = sections[20];

// Storage Engine & Seed Data
const storageCode = `
export const SYSTEM = {
  name:       "Mailzy",
  version:    "2.0.0",
  groqModel:  "llama3-8b-8192",
  groqUrl:    "https://api.groq.com/openai/v1/chat/completions",
  maxCoins:   1000,
  physics: {
    gravity:    0.52,
    bounce:     0.60,
    friction:   0.984,
    airDrag:    0.999,
    minVel:     0.35,
    fps:        60,
  },
};

export const db = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
  patch: (k, patch, d = {}) => { const cur = db.get(k, d); const next = { ...cur, ...patch }; db.set(k, next); return next; },
};

${sections[3].trim()}

export { seedData };
`;

fs.mkdirSync(path.join(SRC, 'lib'), { recursive: true });
fs.writeFileSync(path.join(SRC, 'lib/storage.js'), storageCode);

// ICONS
const iconsCode = `
export const ICONS = {
${sections[5].trim().replace(/^const ICONS = {/, '').replace(/};$/, '')}
};
`;

fs.mkdirSync(path.join(SRC, 'components/ui'), { recursive: true });
fs.writeFileSync(path.join(SRC, 'components/ui/icons.js'), iconsCode);

// Hooks - we'll split them or just dump them in index.js for hooks
// For ease, let's put them all in index.js or individual files.
// The app imports from './hooks/useAuth', so let's parse hooks.
const useAuthMatch = hooksCode.match(/function useAuth\(\) \{[\s\S]*?return \{.*?\};\n\}/);
if (useAuthMatch) fs.writeFileSync(path.join(SRC, 'hooks/useAuth.js'), `import { useState, useCallback } from 'react';\nimport { db, seedData } from '../lib/storage';\n\nexport ${useAuthMatch[0]}\n`);

const useAntigravityMatch = hooksCode.match(/function useAntigravity\(\) \{[\s\S]*?return \{ active, toggle, register \};\n\}/);
if (useAntigravityMatch) fs.writeFileSync(path.join(SRC, 'hooks/useAntigravity.js'), `import { useState, useRef, useCallback, useEffect } from 'react';\nimport { SYSTEM } from '../lib/storage';\n\nexport ${useAntigravityMatch[0]}\n`);

const useToastMatch = hooksCode.match(/function useToast\(\) \{[\s\S]*?return \{ toasts, toast \};\n\}/);
if (useToastMatch) fs.writeFileSync(path.join(SRC, 'hooks/useToast.js'), `import { useState, useCallback } from 'react';\n\nexport ${useToastMatch[0]}\n`);

const useCampaignMatch = hooksCode.match(/function useCampaign\(\) \{[\s\S]*?return \{ campaigns, refresh, save, remove, simulateSend \};\n\}/);
if (useCampaignMatch) fs.writeFileSync(path.join(SRC, 'hooks/useCampaign.js'), `import { useState, useCallback } from 'react';\nimport { db } from '../lib/storage';\n\nexport ${useCampaignMatch[0]}\n`);

const useAgentMatch = hooksCode.match(/function useAgent\(groqKey\) \{[\s\S]*?return \{.*?\};\n\}/);
const fallbackMatch = mainAppCode.match(/function generateFallbackEmail[\s\S]*?\}/);
if (useAgentMatch) fs.writeFileSync(path.join(SRC, 'hooks/useAgent.js'), `import { useState, useCallback } from 'react';\nimport { db, SYSTEM } from '../lib/storage';\n\n${fallbackMatch ? fallbackMatch[0] : ''}\n\nexport ${useAgentMatch[0]}\n`);

const useVerifierMatch = hooksCode.match(/function useVerifier\(\) \{[\s\S]*?return \{ verify \};\n\}/);
if (useVerifierMatch) fs.writeFileSync(path.join(SRC, 'hooks/useVerifier.js'), `import { useCallback } from 'react';\n\nexport ${useVerifierMatch[0]}\n`);

const useEmailAnalyzerMatch = hooksCode.match(/function useEmailAnalyzer\(\) \{[\s\S]*?return \{ analyze \};\n\}/);
if (useEmailAnalyzerMatch) fs.writeFileSync(path.join(SRC, 'hooks/useEmailAnalyzer.js'), `import { useCallback } from 'react';\n\nexport ${useEmailAnalyzerMatch[0]}\n`);


// UI Components
// UI lib code + an added Ic component
const uiComponentsCode = `
import React from 'react';
import { ICONS } from './icons';

export const Ic = ({ d, s = 16, c = "text-current" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d={d} /></svg>;

${uiLibCode.replace(/const Btn/g, 'export const Btn').replace(/const Card/g, 'export const Card').replace(/const Inp/g, 'export const Inp').replace(/const Sel/g, 'export const Sel').replace(/const Badge/g, 'export const Badge').replace(/const StatusBadge/g, 'export const StatusBadge').replace(/const Modal/g, 'export const Modal').replace(/const ToastBar/g, 'export const ToastBar').replace(/const Toggle/g, 'export const Toggle').replace(/const Spinner/g, 'export const Spinner')}
`;
fs.writeFileSync(path.join(SRC, 'components/ui/index.js'), uiComponentsCode);


// Helper for page imports
const PAGE_IMPORTS = `
import React, { useState, useEffect, useRef } from 'react';
import { db, SYSTEM } from '../../lib/storage';
import { ICONS } from '../ui/icons';
import { Btn, Card, Inp, Sel, Badge, StatusBadge, Modal, ToastBar, Toggle, Spinner, Ic } from '../ui';
import { useToast } from '../../hooks/useToast';
`;

// Helper to write component file
function writeComponent(filepath, code, extraImports = '') {
    const defaultExportMatch = code.match(/function ([A-Za-z0-9_]+)/);
    let finalCode = PAGE_IMPORTS + extraImports + "\n" + code;
    if (defaultExportMatch) {
        finalCode += \`\\nexport default \${defaultExportMatch[1]};\`;
    }
    fs.writeFileSync(path.join(SRC, filepath), finalCode);
}

writeComponent('components/pages/AuthPage.jsx', authPageCode);

// Layout
const sidebarMatch = layoutCode.match(/function Sidebar[\s\S]*?\n\}/);
if (sidebarMatch) writeComponent('components/layout/Sidebar.jsx', sidebarMatch[0]);

const topbarMatch = layoutCode.match(/function Topbar[\s\S]*?\n\}/);
if (topbarMatch) writeComponent('components/layout/Topbar.jsx', topbarMatch[0]);

const antigravityBarMatch = layoutCode.match(/function AntigravityBar[\s\S]*?\n\}/);
if (antigravityBarMatch) writeComponent('components/layout/AntigravityBar.jsx', antigravityBarMatch[0]);


// Pages
writeComponent('components/pages/CopilotPage.jsx', copilotPageCode);
writeComponent('components/pages/AgentsPage.jsx', agentsPageCode, \`import { useAgent } from '../../hooks/useAgent';\\n\`);
writeComponent('components/pages/SuperSearchPage.jsx', superSearchPageCode);
writeComponent('components/pages/UniboxPage.jsx', uniboxPageCode);
writeComponent('components/pages/CampaignsPage.jsx', campaignsPageCode, \`import { useCampaign } from '../../hooks/useCampaign';\\n\`);
writeComponent('components/pages/LeadsPage.jsx', leadsPageCode);
writeComponent('components/pages/AnalyticsPage.jsx', analyticsPageCode);
writeComponent('components/pages/EmailTrackerPage.jsx', emailTrackerPageCode);
writeComponent('components/pages/EmailVerifierPage.jsx', emailVerifierPageCode, \`import { useVerifier } from '../../hooks/useVerifier';\\n\`);
writeComponent('components/pages/EmailTesterPage.jsx', emailTesterPageCode, \`import { useEmailAnalyzer } from '../../hooks/useEmailAnalyzer';\\n\`);

// Automations / Inboxes / Settings are grouped in section 19
const autoMatch = settingsCode.match(/function AutomationPage[\s\S]*?\n\}/);
if (autoMatch) writeComponent('components/pages/AutomationPage.jsx', autoMatch[0]);

const inboxMatch = settingsCode.match(/function InboxesPage[\s\S]*?\n\}/);
if (inboxMatch) writeComponent('components/pages/InboxesPage.jsx', inboxMatch[0]);

const settingsMatch = settingsCode.match(/function SettingsPage[\s\S]*?\n\}/);
if (settingsMatch) writeComponent('components/pages/SettingsPage.jsx', settingsMatch[0]);


console.log('Refactor complete!');
