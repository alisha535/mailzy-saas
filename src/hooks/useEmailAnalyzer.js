import { useCallback } from 'react'

export function useEmailAnalyzer() {
  const analyze = useCallback(async (subject, body, fromName, fromEmail) => {
    await new Promise(r => setTimeout(r, 1800))
    const spamWords=['free','guarantee','click here','buy now','limited time','act now','winner','cash prize','urgent','dear friend','congratulations','selected','earn money','make money','no obligation','risk free','special offer','claim your']
    const sl=subject.toLowerCase(), bl=body.toLowerCase()
    const foundSpam=spamWords.filter(w=>sl.includes(w)||bl.includes(w))
    const allCaps=((subject+' '+body).match(/\b[A-Z]{4,}\b/g)||[])
    const exclamations=(subject+body).split('!').length-1
    const links=(body.match(/https?:\/\//g)||[]).length
    const words=body.split(/\s+/).filter(Boolean).length
    let spamScore=0
    spamScore+=foundSpam.length*9; spamScore+=allCaps.length*6
    spamScore+=exclamations*4; spamScore+=links>3?(links-3)*6:0
    spamScore+=subject.length>60?12:0; spamScore=Math.min(spamScore,100)
    const checks=[
      {pass:subject.length<=60,   label:'Subject ≤ 60 chars',        tip:`${subject.length} chars`},
      {pass:foundSpam.length===0, label:'No spam trigger words',      tip:foundSpam.length>0?`Found: ${foundSpam.slice(0,3).join(', ')}`:'Clean ✓'},
      {pass:allCaps.length===0,   label:'No ALL-CAPS words',          tip:allCaps.length>0?allCaps.slice(0,2).join(', '):'None found ✓'},
      {pass:exclamations<=1,      label:'Minimal exclamation marks',  tip:`${exclamations} found`},
      {pass:links<=2,             label:'Link count ≤ 2',             tip:`${links} links`},
      {pass:words>=20,            label:'Body has enough content',     tip:`${words} words`},
      {pass:body.includes('{{'),  label:'Personalization variables',   tip:body.includes('{{')?'{{firstName}} etc found ✓':'Add {{firstName}}'},
      {pass:bl.includes('?')||bl.includes('call')||bl.includes('chat'), label:'Clear call-to-action', tip:'Include a question or meeting ask'},
      {pass:fromName.length>0,    label:'From name is set',            tip:fromName||'Set a sender name'},
      {pass:fromEmail.includes('@')&&!['gmail','yahoo','hotmail','outlook'].some(f=>fromEmail.includes(f)), label:'Business email sender', tip:fromEmail||'Use company email'},
    ]
    const delivScore=Math.round((checks.filter(c=>c.pass).length/checks.length)*100)
    const inbox={
      gmail:   {folder:spamScore>45?'Spam':spamScore>22?'Promotions':'Primary',conf:spamScore>45?86:spamScore>22?72:91},
      outlook: {folder:spamScore>38?'Junk':'Inbox',                            conf:spamScore>38?82:89},
      yahoo:   {folder:spamScore>50?'Spam':'Inbox',                            conf:spamScore>50?88:84},
    }
    return { spamScore, delivScore, checks, foundSpam, allCaps, exclamations, links, words, inbox }
  }, [])
  return { analyze }
}
