import React, { useState, useEffect } from 'react';
import { T, TECH, STR_COLORS, PAL } from './constants';
import { avatarColor, initials, techKey } from './utils';

export const CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
*{box-sizing:border-box}
input{background:#242424;border:1px solid #282828;border-radius:8px;padding:10px 14px;color:#fff;font-size:13px;outline:none;width:auto;}
input:focus{border-color:#1DB954;}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
.hc:hover{background:#242424!important;border-color:#3a3a3a!important;cursor:pointer}
`;

export function Spinner({ size=16, color=T.t2 }) {
  return <div style={{width:size,height:size,border:`2px solid ${T.bg4}`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>;
}

export function Loader({ text }) {
  return <div style={{display:"flex",alignItems:"center",gap:10,padding:"2rem 0",color:T.t2,fontSize:13}}><Spinner/>{text}</div>;
}

export function Btn({ children, onClick, variant="ghost", size="md", disabled, full, style={} }) {
  const vs = {
    ghost:  { background:"transparent", border:`1px solid ${T.bdr}`, color:T.t1 },
    accent: { background:T.acc, border:"none", color:"#000" },
    subtle: { background:T.bg3, border:`1px solid ${T.bdr}`, color:T.t1 },
  };
  const ss = {
    sm: { fontSize:12, padding:"5px 10px" },
    md: { fontSize:13, padding:"8px 16px" },
    lg: { fontSize:14, padding:"11px 22px", fontWeight:700 },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{...vs[variant],...ss[size],borderRadius:8,cursor:disabled?"default":"pointer",opacity:disabled?0.4:1,fontWeight:500,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,width:full?"100%":"auto",...style}}
    >{children}</button>
  );
}

export function Tag({ children, color=T.t2, bg=T.bg3 }) {
  return <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:bg,color,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>{children}</span>;
}

export function TechBadge({ t }) {
  const k = techKey(t); const c = TECH[k]||TECH.mixta;
  return <Tag color={c.c} bg={c.bg}>{c.i} {c.l}</Tag>;
}

export function DiffBadge({ d }) {
  const k = (d||"").toLowerCase();
  const M = {
    fácil:       { c:"#1DB954", bg:T.accBg },
    easy:        { c:"#1DB954", bg:T.accBg },
    intermedio:  { c:T.org, bg:"rgba(226,154,74,0.1)" },
    intermediate:{ c:T.org, bg:"rgba(226,154,74,0.1)" },
    avanzado:    { c:T.red, bg:"rgba(226,75,74,0.1)" },
    advanced:    { c:T.red, bg:"rgba(226,75,74,0.1)" },
  };
  const cfg = M[k]||M.intermedio;
  return <Tag color={cfg.c} bg={cfg.bg}>{d}</Tag>;
}

export function TuningWarn({ t }) {
  if (!t||["standard","Standard"].includes(t)) return null;
  return <Tag color={T.pur} bg="rgba(127,119,221,0.1)">⚠ {t}</Tag>;
}

export function UnverifiedNote() {
  return <div style={{fontSize:11,color:T.t2,marginTop:8}}>⚠ Información generada por IA — puede contener inexactitudes.</div>;
}

export function GearWarning({ issues }) {
  if (!issues?.length) return null;
  return (
    <div style={{background:"rgba(226,154,74,0.08)",border:"1px solid rgba(226,154,74,0.3)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.org,marginBottom:4}}>⚠ Advertencia de equipo</div>
      {issues.map((x,i)=><div key={i} style={{fontSize:12,color:T.t1}}>{x}</div>)}
    </div>
  );
}

export function Avatar({ profile, size=32, onClick }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [profile?.photo]);
  const base = { width:size, height:size, borderRadius:"50%", flexShrink:0, cursor:onClick?"pointer":"default" };
  if (profile?.photo && !err)
    return <img src={profile.photo} alt="" onError={()=>setErr(true)} onClick={onClick} style={{...base,objectFit:"cover",border:`2px solid ${T.bdr}`,display:"block"}}/>;
  if (profile?.avatarEmoji)
    return <div onClick={onClick} style={{...base,background:T.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.48,border:`2px solid ${T.bdr}`}}>{profile.avatarEmoji}</div>;
  return <div onClick={onClick} style={{...base,background:avatarColor(profile?.name||"?"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:"#000"}}>{initials(profile?.name||"?")}</div>;
}

export function TabDisplay({ tab, bpm, withPlayer, playing, pos, onPlay, onStop }) {
  return (
    <div>
      <div style={{background:"#0d0d0d",borderRadius:10,padding:"14px 18px",overflowX:"auto",border:`1px solid ${T.bdr}`}}>
        <pre style={{fontFamily:"'Courier New',monospace",fontSize:13,lineHeight:2,margin:0,whiteSpace:"pre"}}>
          {(tab||"").split("\n").map((ln,i) => {
            const m = ln.match(/^([GDAEgdae])(.*)/);
            if (!m) return <div key={i} style={{color:T.t2,fontSize:10}}>{ln}</div>;
            const [,sn,rest] = m;
            return (
              <div key={i} style={{display:"flex",alignItems:"center"}}>
                <span style={{color:STR_COLORS[sn]||T.t1,fontWeight:700,minWidth:16}}>{sn}</span>
                <span style={{color:"#333"}}>|</span>
                <span style={{color:"#c8c8c8",letterSpacing:1.5}}>{rest.replace(/\|$/,"")}</span>
                <span style={{color:"#333"}}>|</span>
              </div>
            );
          })}
        </pre>
      </div>
      {withPlayer && (
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:10}}>
          <button
            onClick={playing ? onStop : onPlay}
            style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${T.acc}`,background:playing?T.acc:"transparent",cursor:"pointer",color:playing?"#000":T.acc,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}
          >{playing?"⏹":"▶"}</button>
          <div style={{flex:1,height:3,background:T.bg4,borderRadius:2,overflow:"hidden"}}>
            <div style={{width:`${pos*100}%`,height:"100%",background:T.acc,transition:"width 0.1s linear"}}/>
          </div>
          <span style={{fontSize:11,color:T.t2}}>{Math.round(bpm||120)} BPM</span>
        </div>
      )}
    </div>
  );
}

export function BarChart({ data, nameKey, valueKey, color }) {
  const max = Math.max(...data.map(d=>d[valueKey]));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {data.map((d,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:12,color:T.t1,width:90,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d[nameKey]}</div>
          <div style={{flex:1,height:8,background:T.bg4,borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${Math.min(100,(d[valueKey]/max)*100)}%`,height:"100%",background:color||T.acc,borderRadius:4}}/>
          </div>
          <div style={{fontSize:11,color:T.t2,width:24,textAlign:"right"}}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

export function PieSimple({ data, nameKey, pctKey }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {data.map((d,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:12,color:T.t1,width:100,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d[nameKey]}</div>
          <div style={{flex:1,height:8,background:T.bg4,borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${d[pctKey]}%`,height:"100%",background:PAL[i%PAL.length],borderRadius:4}}/>
          </div>
          <div style={{fontSize:11,color:T.t2,width:32,textAlign:"right"}}>{d[pctKey]}%</div>
        </div>
      ))}
    </div>
  );
}
