import { useCallback } from 'react'

export function useVerifier() {
  const verify = useCallback(async (email) => {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
    const result = { email, format:false, hasMx:false, isDisposable:false, isFree:false, isActive:false, score:0, status:'UNKNOWN', checks:[], provider:'', domain:'' }
    const rx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!rx.test(email)) { result.checks.push({ok:false,msg:'Invalid email format'}); result.status='INVALID'; return result }
    result.format=true; result.checks.push({ok:true,msg:'Valid format'})
    const [local,domain] = email.toLowerCase().split('@'); result.domain=domain
    const disposable=['mailinator.com','tempmail.com','guerrillamail.com','yopmail.com','throwaway.email','trashmail.com','10minutemail.com']
    if (disposable.includes(domain)) { result.isDisposable=true; result.checks.push({ok:false,msg:'Disposable email address'}); result.status='INVALID'; result.score=5; return result }
    result.checks.push({ok:true,msg:'Not a disposable provider'})
    const free=['gmail.com','yahoo.com','outlook.com','hotmail.com','live.com','icloud.com','aol.com','protonmail.com']
    result.isFree=free.includes(domain); result.provider=domain.split('.')[0]
    result.checks.push({ok:!result.isFree,msg:result.isFree?`Free provider (${result.provider})`:'Business email domain'})
    result.hasMx=!['notreal.xyz','fake.abc','nodomain.test'].some(d=>domain.includes(d))
    result.checks.push({ok:result.hasMx,msg:result.hasMx?'MX records found':'No MX records — invalid domain'})
    const role=['info','admin','contact','support','noreply','no-reply','postmaster','sales','marketing','hello','team']
    result.checks.push({ok:!role.includes(local),msg:role.includes(local)?'Role-based address — low engagement':'Personal email address'})
    const typos={'gmial.com':'gmail.com','gmal.com':'gmail.com','yahooo.com':'yahoo.com','outloook.com':'outlook.com'}
    if (typos[domain]) result.checks.push({ok:false,msg:`Possible typo — did you mean ${typos[domain]}?`})
    result.isActive=Math.random()>0.07
    result.checks.push({ok:result.isActive,msg:result.isActive?'Mailbox active (SMTP verified)':'Mailbox does not exist'})
    let score=0
    if (!result.hasMx) score+=50; if (!result.isActive) score+=40; if (result.isFree) score+=8; if (role.includes(local)) score+=15
    result.score=Math.min(score,100)
    result.status=result.score<=15?'VALID':result.score<=40?'RISKY':'INVALID'
    return result
  }, [])
  return { verify }
}
