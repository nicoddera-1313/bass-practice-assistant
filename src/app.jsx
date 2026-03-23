import React, { useState, useRef, useCallback, useEffect } from 'react';
import { T, BASSES, TUNINGS, AVATARS } from './constants';
import { avatarColor, initials, ytUrl, ugUrl, cfUrl, techKey, gearCheck, parseCSV } from './utils';
import { fetchTab, fetchBassist, explore, suggest, diagnosis } from './api';
import { useAudio } from './useAudio';
import { CSS, Spinner, Loader, Btn, Tag, TechBadge, DiffBadge, TuningWarn, UnverifiedNote, GearWarning, Avatar, TabDisplay, BarChart, PieSimple } from './Atoms';

// ── TUTORIAL ──────────────────────────────────────────────────────────────────
function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const steps = [
    { e:"🎵", t:"Creá tu playlist en Spotify",   d:"Creá una playlist con los temas que sabés tocar en el bajo.", tip:"Incluí tanto los que tocás bien como los que estás aprendiendo." },
    { e:"💻", t:"Entrá a Exportify",              d:"Abrí exportify.net desde tu computadora. Gratuito, exporta playlists como CSV.", tip:"No funciona desde el celular." },
    { e:"🔑", t:"Autorizá el acceso",             d:"Hacé clic en 'Log in with Spotify'. Solo lectura — no modifica nada.", tip:"Exportify es open source y seguro." },
    { e:"📤", t:"Exportá tu playlist",            d:"Buscá tu playlist y hacé clic en 'Export'. Se descarga un archivo .csv.", tip:"Buscalo en tu carpeta Descargas." },
    { e:"📁", t:"Subí el archivo a la app",       d:"Tocá '+ Playlist' en la app y seleccioná el archivo .csv descargado.", tip:"¡Listo! La app analiza tu repertorio." },
  ];
  const s = steps[step];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:T.bg1,borderRadius:16,padding:28,maxWidth:420,width:"100%",border:`1px solid ${T.bdr}`,animation:"fadeUp 0.2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <span style={{fontSize:11,fontWeight:600,color:T.t2}}>TUTORIAL — {step+1}/{steps.length}</span>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:T.t2,fontSize:22}}>×</button>
        </div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:48,marginBottom:12}}>{s.e}</div>
          <div style={{fontSize:18,fontWeight:700,color:T.t0,marginBottom:8}}>{s.t}</div>
          <p style={{fontSize:14,color:T.t1,lineHeight:1.7,margin:0}}>{s.d}</p>
          {s.tip && <div style={{marginTop:12,padding:"10px 14px",background:T.accBg,borderRadius:8,fontSize:12,color:T.acc,textAlign:"left",border:`1px solid ${T.acc}33`}}>💡 {s.tip}</div>}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>
          {steps.map((_,i) => <div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,background:i===step?T.acc:T.bg4,transition:"width 0.2s"}}/>)}
        </div>
        <div style={{display:"flex",gap:8}}>
          {step > 0 && <Btn onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← Anterior</Btn>}
          {step < steps.length-1
            ? <Btn onClick={()=>setStep(s=>s+1)} variant="accent" style={{flex:2}}>Siguiente →</Btn>
            : <div style={{flex:2,display:"flex",flexDirection:"column",gap:8}}>
                <a href="https://exportify.net" target="_blank" rel="noopener noreferrer" style={{display:"block",background:T.acc,borderRadius:8,padding:"10px",textAlign:"center",textDecoration:"none",color:"#000",fontSize:13,fontWeight:700}}>Ir a Exportify ↗</a>
                <Btn onClick={onClose} full>Ya tengo el archivo</Btn>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboarding({ onLoad, onSkip, onTutorial }) {
  const [status, setStatus] = useState(null);
  const [error,  setError]  = useState("");
  const handle = useCallback(e => {
    const file = e.target.files[0]; if (!file) return;
    setStatus("loading"); setError("");
    const reader = new FileReader();
    const timer = setTimeout(() => { setStatus("error"); setError("El archivo tardó demasiado."); }, 10000);
    reader.onload = ev => {
      clearTimeout(timer);
      try {
        const p = parseCSV(ev.target.result);
        if (!p) { setStatus("error"); setError('Formato inválido. Necesitás "Track Name" y "Artist Name(s)".'); return; }
        setStatus("ok"); onLoad(p);
      } catch(err) { clearTimeout(timer); setStatus("error"); setError("Error: "+err.message); }
    };
    reader.onerror = () => { clearTimeout(timer); setStatus("error"); setError("No se pudo leer."); };
    reader.readAsText(file, "utf-8");
  }, [onLoad]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:T.bg1,borderRadius:16,padding:28,maxWidth:440,width:"100%",border:`1px solid ${T.bdr}`,animation:"fadeUp 0.2s ease"}}>
        <div style={{fontSize:40,textAlign:"center",marginBottom:12}}>🎸</div>
        <h2 style={{fontSize:20,fontWeight:700,color:T.t0,margin:"0 0 8px",textAlign:"center"}}>Cargá tu playlist de bajo</h2>
        <p style={{fontSize:13,color:T.t2,margin:"0 0 20px",textAlign:"center",lineHeight:1.6}}>Subí los temas que <strong style={{color:T.t1}}>sabés tocar</strong> en el bajo.</p>
        <div style={{background:T.bg2,borderRadius:10,padding:16,marginBottom:12,border:`1px solid ${status==="error"?T.red:T.bdr}`}}>
          <input type="file" accept=".csv" onChange={handle} style={{width:"100%",marginBottom:10}}/>
          {status==="loading" && <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:T.t1}}><Spinner size={13} color={T.t1}/>Leyendo...</div>}
          {status==="error"   && <div style={{fontSize:13,color:T.red,background:"rgba(226,75,74,0.1)",borderRadius:8,padding:"8px 12px"}}>{error}</div>}
        </div>
        <button onClick={onTutorial} style={{width:"100%",background:T.accBg,border:`1px solid ${T.acc}33`,borderRadius:8,padding:"10px",fontSize:13,color:T.acc,cursor:"pointer",fontWeight:600,marginBottom:8}}>📖 Ver tutorial: cómo exportar desde Spotify</button>
        <button onClick={onSkip} style={{background:"transparent",border:"none",cursor:"pointer",color:T.t2,fontSize:12,textDecoration:"underline",width:"100%",textAlign:"center",padding:"8px 0"}}>Explorar sin playlist</button>
      </div>
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ msg, actions, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 15000); return () => clearTimeout(t); }, []);
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:T.bg3,border:`1px solid ${T.bdr}`,borderRadius:12,padding:"14px 18px",zIndex:400,display:"flex",alignItems:"center",gap:14,maxWidth:"92vw",animation:"fadeUp 0.2s ease"}}>
      <span style={{fontSize:13,color:T.t1}}>{msg}</span>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        {actions?.map((a,i) => <Btn key={i} onClick={a.fn} variant={i===0?"accent":"ghost"} size="sm">{a.label}</Btn>)}
        <button onClick={onDismiss} style={{background:"transparent",border:"none",cursor:"pointer",color:T.t2,fontSize:18}}>×</button>
      </div>
    </div>
  );
}

// ── DISCOVER ──────────────────────────────────────────────────────────────────
function Discover({ profile, pushTrack }) {
  const [q,       setQ]       = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const search = useCallback(() => {
    if (!q.trim()) return;
    setLoading(true); setResults(null);
    explore(q, profile).then(d => { setResults(d); setLoading(false); }).catch(() => setLoading(false));
  }, [q, profile]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp 0.2s ease"}}>
      <div>
        <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 4px",color:T.t0}}>Explorar</h2>
        <p style={{fontSize:13,color:T.t2,margin:0}}>Buscá por artista, bajista, género o técnica</p>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Flea, jazz bass, Jaco, slap funk..." style={{flex:1}}/>
        <Btn onClick={search} variant="accent">Buscar</Btn>
      </div>
      {loading && <Loader text={`Buscando "${q}"...`}/>}
      {results && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {results.resultados?.map((r,i) => {
            const issues = gearCheck(profile, r.afinacion, r.cuerdas_necesarias);
            return (
              <div key={i} className="hc" style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:12,padding:"14px 16px",transition:"all 0.15s"}} onClick={()=>pushTrack({name:r.titulo,artist:r.artista,tempo:0,energy:0,popularity:0})}>
                <div style={{fontWeight:600,fontSize:14,color:T.t0,marginBottom:2}}>{r.titulo} <span style={{fontWeight:400,color:T.t2}}>— {r.artista}</span></div>
                <div style={{fontSize:12,color:T.t2,marginBottom:8}}>Bajista: <span style={{color:T.t1,fontWeight:500}}>{r.bajista}</span></div>
                <div style={{fontSize:13,color:T.t1,lineHeight:1.5,marginBottom:8}}>{r.por_que}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <TechBadge t={r.tecnica}/><DiffBadge d={r.dificultad}/><TuningWarn t={r.afinacion}/>
                  {issues && <span style={{fontSize:11,color:T.org}}>⚠ equipo</span>}
                  <span style={{marginLeft:"auto",fontSize:12,color:T.acc}}>Estudiar →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && !results && (
        <div style={{textAlign:"center",padding:"3rem 0",color:T.t2}}>
          <div style={{fontSize:44,marginBottom:12}}>🔍</div>
          <div style={{fontSize:14}}>Escribí cualquier cosa: artista, banda, estilo o técnica</div>
          <div style={{fontSize:12,marginTop:6,opacity:0.6}}>"Flea RHCP" · "jazz walking" · "slap funk" · "metal drop D"</div>
        </div>
      )}
    </div>
  );
}

// ── TAB WITH PLAYER ───────────────────────────────────────────────────────────
function TabWithPlayer({ tab, bpm }) {
  const { playing, pos, play, stop } = useAudio(tab, bpm);
  return <TabDisplay tab={tab} bpm={bpm} withPlayer playing={playing} pos={pos} onPlay={play} onStop={stop}/>;
}

// ── TRACK INFO ────────────────────────────────────────────────────────────────
function TrackInfo({ track, profile }) {
  const [info,    setInfo]    = useState(null);
  const [tabData, setTabData] = useState(null);
  const [loadI,   setLoadI]   = useState(false);
  const [loadT,   setLoadT]   = useState(false);
  const [sec,     setSec]     = useState(0);
  const prev  = useRef(null);
  const tcache = useRef({});
  const icache = useRef({});

  useEffect(() => {
    if (!track) return;
    const key = track.name + track.artist;
    if (key === prev.current) return;
    prev.current = key; setInfo(null); setTabData(null); setSec(0);
    if (icache.current[key]) { setInfo(icache.current[key]); }
    else { setLoadI(true); fetchBassist(track.name, track.artist).then(d=>{ icache.current[key]=d; setInfo(d); setLoadI(false); }).catch(()=>setLoadI(false)); }
    if (tcache.current[key]) { setTabData(tcache.current[key]); }
    else { setLoadT(true); fetchTab(track.name, track.artist, track.tempo).then(d=>{ tcache.current[key]=d; setTabData(d); setLoadT(false); }).catch(()=>setLoadT(false)); }
  }, [track]);

  const k = techKey(info?.tecnica);
  const cfg = { dedos:{l:"Dedos",i:"✋",c:"#4a8fe2",bg:"rgba(74,143,226,0.1)"}, pua:{l:"Púa",i:"🎯",c:"#E29A4a",bg:"rgba(226,154,74,0.1)"}, slap:{l:"Slap",i:"👊",c:"#1DB954",bg:"rgba(29,185,84,0.1)"}, mixta:{l:"Mixta",i:"🎵",c:"#7F77DD",bg:"rgba(127,119,221,0.1)"} }[k] || { l:"Mixta",i:"🎵",c:"#7F77DD",bg:"rgba(127,119,221,0.1)" };
  const bpm = parseFloat(tabData?.tempo) || track.tempo || 120;
  const gi = tabData?.encontrada ? gearCheck(profile, tabData.afinacion, tabData.cuerdas) : null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[
          ["▶ Original",    ytUrl(info?.yt_original || track.name+" "+track.artist)],
          ["🎸 Cover bajo", ytUrl(info?.yt_cover    || track.name+" "+track.artist+" bass cover")],
          ["CifraClub",     cfUrl(track.name, track.artist)],
          ["Ultimate Guitar",ugUrl(track.name, track.artist)],
        ].map(([l,u]) => (
          <a key={l} href={u} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:90,display:"flex",alignItems:"center",justifyContent:"center",padding:"9px 6px",borderRadius:8,border:`1px solid ${T.bdr}`,background:T.bg2,textDecoration:"none",color:T.t1,fontSize:11,fontWeight:600,textAlign:"center"}}>{l}</a>
        ))}
      </div>

      {loadI && <Loader text="Buscando info en Equipboard..."/>}
      {info && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:12,padding:14}}>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Bajista</div>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:avatarColor(info.bajista||"?"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#000",flexShrink:0}}>{initials(info.bajista||"?")}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:T.t0,marginBottom:4}}>{info.bajista}</div>
                  <TechBadge t={info.tecnica}/>
                </div>
              </div>
              <p style={{fontSize:12,color:T.t1,margin:0,lineHeight:1.5}}>{info.tecnica_desc}</p>
              <div style={{fontSize:10,color:T.t2,marginTop:6}}>Fuente: {info.fuente_gear||"estimado"}</div>
            </div>
            <div style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:12,padding:14}}>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Bajo</div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"4px 0 6px"}}>
                <div style={{fontSize:32}}>🎸</div>
                <div style={{fontWeight:600,fontSize:13,color:T.t0,textAlign:"center"}}>{info.bajo}</div>
                <div style={{fontSize:11,color:T.t2}}>{info.marca}</div>
              </div>
            </div>
          </div>
          <div style={{borderRadius:12,padding:"14px 16px",background:cfg.bg,border:`1px solid ${cfg.c}33`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:24}}>{cfg.i}</span>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:cfg.c,textTransform:"uppercase",letterSpacing:"0.08em"}}>Técnica</div>
                <div style={{fontSize:14,fontWeight:700,color:cfg.c}}>{cfg.l}</div>
              </div>
            </div>
            <p style={{fontSize:13,margin:0,lineHeight:1.6,color:T.t1}}>{info.sonido}</p>
          </div>
          {info.dato_curioso && (
            <div style={{borderLeft:`3px solid ${T.acc}`,paddingLeft:12}}>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Dato curioso</div>
              <p style={{fontSize:13,margin:0,lineHeight:1.6,color:T.t2,fontStyle:"italic"}}>{info.dato_curioso}</p>
            </div>
          )}
          <UnverifiedNote/>
        </>
      )}

      <div style={{paddingTop:8,borderTop:`1px solid ${T.bdr}`}}>
        <div style={{fontSize:11,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Tablatura</div>
        {loadT && <Loader text="Buscando en CifraClub, Songsterr..."/>}
        {tabData && !loadT && (tabData.encontrada ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <GearWarning issues={gi}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {tabData.tempo   && <Tag>{tabData.tempo} BPM</Tag>}
              {tabData.tonalidad && <Tag>{tabData.tonalidad}</Tag>}
              <TuningWarn t={tabData.afinacion}/>
              <span style={{fontSize:11,color:T.acc,fontWeight:600,marginLeft:"auto"}}>✓ {tabData.fuente}</span>
              {tabData.url && <a href={tabData.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:T.t2,textDecoration:"none"}}>ver original ↗</a>}
            </div>
            {tabData.secciones?.length > 1 && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {tabData.secciones.map((s,i) => (
                  <button key={i} onClick={()=>setSec(i)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${i===sec?T.acc:T.bdr}`,background:i===sec?T.accBg:"transparent",cursor:"pointer",fontSize:12,color:i===sec?T.acc:T.t2,fontWeight:i===sec?600:400}}>{s.nombre}</button>
                ))}
              </div>
            )}
            {tabData.secciones?.[sec] && (
              <div>
                {tabData.secciones.length > 1 && <div style={{fontSize:11,fontWeight:600,color:T.t2,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>{tabData.secciones[sec].nombre}</div>}
                <TabWithPlayer tab={tabData.secciones[sec].tab} bpm={bpm}/>
              </div>
            )}
            {tabData.notas && <p style={{fontSize:12,color:T.t2,margin:0,fontStyle:"italic"}}>{tabData.notas}</p>}
          </div>
        ) : (
          <div style={{background:"rgba(226,154,74,0.06)",borderRadius:10,padding:16,border:"1px solid rgba(226,154,74,0.25)"}}>
            <div style={{fontSize:13,color:T.org,fontWeight:600,marginBottom:8}}>No encontré la tablatura en la web</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <a href={cfUrl(track.name,track.artist)} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,border:`1px solid ${T.bdr}`,background:T.bg3,textDecoration:"none",color:T.t0,fontSize:12,fontWeight:600,textAlign:"center"}}>🎵 CifraClub ↗</a>
              <a href={ugUrl(track.name,track.artist)} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:120,padding:"10px",borderRadius:8,border:`1px solid ${T.bdr}`,background:T.bg3,textDecoration:"none",color:T.t0,fontSize:12,fontWeight:600,textAlign:"center"}}>🎸 Ultimate Guitar ↗</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SUGGEST ───────────────────────────────────────────────────────────────────
function SuggestView({ tracks, profile, pushTrack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    if (!tracks?.length || done.current) return;
    done.current = true; setLoading(true);
    suggest(tracks, profile).then(d=>{ setData(d); setLoading(false); }).catch(()=>setLoading(false));
  }, []);
  if (!tracks?.length) return <p style={{color:T.t2,fontSize:14}}>Cargá tu playlist para ver sugerencias.</p>;
  if (loading)          return <Loader text="Generando sugerencias..."/>;
  if (!data)            return null;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {data.categorias?.map((cat,ci) => (
        <div key={ci}>
          <div style={{fontSize:14,fontWeight:600,color:T.t0,marginBottom:2}}>{cat.nombre}</div>
          <div style={{fontSize:12,color:T.t2,marginBottom:10}}>{cat.desc}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {cat.canciones?.map((s,si) => {
              const issues = gearCheck(profile, s.afinacion, s.cuerdas_necesarias);
              return (
                <div key={si} className="hc" style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px 14px",transition:"all 0.15s"}} onClick={()=>pushTrack({name:s.titulo,artist:s.artista,tempo:0,energy:0,popularity:0})}>
                  <div style={{fontWeight:600,fontSize:13,color:T.t0,marginBottom:2}}>{s.titulo} <span style={{fontWeight:400,color:T.t2}}>— {s.artista}</span></div>
                  <div style={{fontSize:12,color:T.t1,lineHeight:1.5,marginBottom:6}}>{s.por_que}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <TechBadge t={s.tecnica}/><TuningWarn t={s.afinacion}/>
                    {issues && <span style={{fontSize:11,color:T.org}}>⚠ equipo incompatible</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <UnverifiedNote/>
    </div>
  );
}

// ── STUDY ─────────────────────────────────────────────────────────────────────
function Study({ track, tracks, profile, pushTrack }) {
  const [tab, setTab] = useState("info");
  if (!track) return (
    <div style={{textAlign:"center",padding:"4rem 0",color:T.t2,animation:"fadeUp 0.2s ease"}}>
      <div style={{fontSize:44,marginBottom:12}}>🎸</div>
      <div style={{fontSize:15,color:T.t1,marginBottom:4}}>Ninguna canción seleccionada</div>
      <div style={{fontSize:13}}>Buscá en Explorar o seleccioná desde Playlist</div>
    </div>
  );
  return (
    <div style={{animation:"fadeUp 0.2s ease"}}>
      <div style={{background:T.bg2,borderRadius:14,padding:"16px 18px",marginBottom:16,border:`1px solid ${T.bdr}`}}>
        <div style={{fontSize:22,fontWeight:700,color:T.t0,lineHeight:1.2,marginBottom:3}}>{track.name}</div>
        <div style={{fontSize:14,color:T.t1,marginBottom:track.tempo>0?10:0}}>{track.artist}</div>
        {track.tempo > 0 && <Tag>{Math.round(track.tempo)} BPM</Tag>}
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${T.bdr}`,marginBottom:20}}>
        {[{id:"info",l:"Info & Tablatura"},{id:"sug",l:"Canciones relacionadas"}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{fontSize:13,padding:"8px 16px",border:"none",borderBottom:`2px solid ${tab===t.id?T.acc:"transparent"}`,background:"transparent",cursor:"pointer",fontWeight:tab===t.id?600:400,color:tab===t.id?T.acc:T.t2}}>{t.l}</button>
        ))}
      </div>
      {tab==="info" && <TrackInfo track={track} profile={profile}/>}
      {tab==="sug"  && <SuggestView tracks={tracks} profile={profile} pushTrack={pushTrack}/>}
    </div>
  );
}

// ── PLAYLIST ──────────────────────────────────────────────────────────────────
function PlaylistView({ tracks, current, pushTrack, onLoad, onTutorial }) {
  const [search, setSearch] = useState("");
  const fRef = useRef(null);
  const filtered = tracks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase()));
  const handleFile = useCallback(e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { try { const p = parseCSV(ev.target.result); if(p) onLoad(p); } catch(e) {} };
    reader.readAsText(file,"utf-8"); e.target.value="";
  }, [onLoad]);

  if (!tracks.length) return (
    <div style={{textAlign:"center",padding:"3rem 0",color:T.t2,animation:"fadeUp 0.2s ease"}}>
      <div style={{fontSize:44,marginBottom:12}}>📋</div>
      <div style={{fontSize:15,color:T.t1,marginBottom:16}}>No hay playlist cargada</div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        <Btn onClick={()=>fRef.current?.click()} variant="accent">Cargar playlist</Btn>
        <Btn onClick={onTutorial}>Ver tutorial</Btn>
      </div>
      <input ref={fRef} type="file" accept=".csv" onChange={handleFile} style={{display:"none"}}/>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeUp 0.2s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 2px",color:T.t0}}>Mi playlist</h2>
          <div style={{fontSize:13,color:T.t2}}>{tracks.length} canciones</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onTutorial} size="sm">Tutorial</Btn>
          <Btn onClick={()=>fRef.current?.click()} size="sm">↻ Cambiar</Btn>
        </div>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar canción o artista..."/>
      <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:520,overflowY:"auto"}}>
        {filtered.map((t,i) => (
          <div key={i} onClick={()=>pushTrack(t)} className="hc" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:current?.name===t.name&&current?.artist===t.artist?T.bg3:T.bg2,border:`1px solid ${current?.name===t.name&&current?.artist===t.artist?T.acc:T.bdr}`,borderRadius:8,transition:"all 0.1s"}}>
            <div style={{width:34,height:34,borderRadius:6,background:avatarColor(t.artist),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#000",flexShrink:0}}>{initials(t.artist)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:T.t0}}>{t.name}</div>
              <div style={{fontSize:12,color:T.t2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.artist}</div>
            </div>
            <div style={{fontSize:11,color:T.t2,flexShrink:0}}>{Math.round(t.tempo)||"—"}</div>
          </div>
        ))}
      </div>
      <input ref={fRef} type="file" accept=".csv" onChange={handleFile} style={{display:"none"}}/>
    </div>
  );
}

// ── PROFILE PANEL ─────────────────────────────────────────────────────────────
function ProfilePanel({ profile, setProfile, tracks, diagnosis: diag, setDiagnosis, onLoad, onTutorial, onClose }) {
  const [ptab,    setPtab]    = useState("perfil");
  const [editing, setEditing] = useState(!profile);
  const [draft,   setDraft]   = useState(profile ? {...profile} : { name:"", avatarEmoji:"🎸", photo:null, basses:[], tunings:[], stringCounts:[4] });
  const [diagLoading, setDiagLoading] = useState(false);
  const photoRef = useRef(null);
  const fRef     = useRef(null);

  const toggleBass = b => setDraft(d => { const ex=d.basses.find(x=>x.id===b.id); return {...d, basses:ex?d.basses.filter(x=>x.id!==b.id):[...d.basses,{id:b.id,name:b.name}]}; });
  const toggleArr  = (k,v) => setDraft(d => { const ex=d[k].includes(v); return {...d, [k]:ex?d[k].filter(x=>x!==v):[...d[k],v]}; });
  const handlePhoto = e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setDraft(d=>({...d,photo:ev.target.result,avatarEmoji:null})); r.readAsDataURL(f); };
  const save    = () => { setProfile(draft); setEditing(false); };
  const canSave = draft.name && draft.basses.length>0 && draft.tunings.length>0;
  const runDiag = useCallback(() => {
    if (!tracks.length || diagLoading) return;
    setDiagLoading(true);
    diagnosis(tracks, profile||draft).then(d=>{ setDiagnosis(d); setDiagLoading(false); }).catch(()=>setDiagLoading(false));
  }, [tracks, profile, draft, diagLoading, setDiagnosis]);
  const handleFile = useCallback(e => {
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{ try{ const p=parseCSV(ev.target.result); if(p)onLoad(p); }catch(e){} };
    reader.readAsText(file,"utf-8"); e.target.value="";
  }, [onLoad]);

  const stats = diag?.stats;

  return (
    <div style={{position:"fixed",top:0,right:0,height:"100%",width:"min(460px,100vw)",background:T.bg1,borderLeft:`1px solid ${T.bdr}`,zIndex:100,display:"flex",flexDirection:"column",animation:"slideIn 0.25s ease-out"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.bdr}`,flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:700,color:T.t0}}>Mi perfil</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:T.t2,fontSize:22}}>×</button>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${T.bdr}`,flexShrink:0,paddingLeft:16}}>
        {[{id:"perfil",l:"Perfil"},{id:"stats",l:"Estadísticas"},{id:"diag",l:"Diagnóstico"}].map(t => (
          <button key={t.id} onClick={()=>setPtab(t.id)} style={{fontSize:12,padding:"10px 12px",border:"none",borderBottom:`2px solid ${ptab===t.id?T.acc:"transparent"}`,background:"transparent",cursor:"pointer",fontWeight:ptab===t.id?600:400,color:ptab===t.id?T.acc:T.t2}}>{t.l}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:20}}>

        {ptab==="perfil" && ((!editing && profile) ? (
          <>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <Avatar profile={profile} size={60}/>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:700,color:T.t0}}>{profile.name}</div>
                {diag && <div style={{fontSize:12,color:T.acc,fontWeight:600,marginTop:2}}>{diag.nivel}</div>}
                <div style={{fontSize:11,color:T.t2,marginTop:3}}>{profile.basses?.map(b=>b.name).join(" · ")}</div>
              </div>
              <Btn onClick={()=>setEditing(true)} size="sm">Editar</Btn>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Afinaciones</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(profile.tunings||[]).map(t => { const td=TUNINGS.find(x=>x.id===t); return td ? <Tag key={t} color={T.pur} bg="rgba(127,119,221,0.1)">{td.label} <span style={{opacity:0.5,fontSize:10}}>{td.notes}</span></Tag> : null; })}
              </div>
            </div>
            <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:16}}>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Playlist</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:T.t1}}>{tracks.length ? `${tracks.length} canciones` : "Sin playlist"}</span>
                <div style={{display:"flex",gap:8}}>
                  <Btn onClick={onTutorial} size="sm">Tutorial</Btn>
                  <Btn onClick={()=>fRef.current?.click()} size="sm">{tracks.length?"↻ Cambiar":"+ Cargar"}</Btn>
                </div>
              </div>
              <input ref={fRef} type="file" accept=".csv" onChange={handleFile} style={{display:"none"}}/>
            </div>
          </>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Nombre</div>
              <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="¿Cómo te llamás?" style={{width:"100%"}}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Foto de perfil</div>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <Avatar profile={draft} size={46}/>
                <Btn onClick={()=>photoRef.current?.click()} size="sm">📷 Subir foto</Btn>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{AVATARS.map(a => <button key={a} onClick={()=>setDraft(d=>({...d,avatarEmoji:a,photo:null}))} style={{width:34,height:34,borderRadius:8,border:`1px solid ${draft.avatarEmoji===a&&!draft.photo?T.acc:T.bdr}`,background:draft.avatarEmoji===a&&!draft.photo?T.accBg:T.bg3,cursor:"pointer",fontSize:17}}>{a}</button>)}</div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Mis bajos</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {BASSES.map(b => { const sel=draft.basses.find(x=>x.id===b.id); return <button key={b.id} onClick={()=>toggleBass(b)} style={{padding:"9px",borderRadius:8,border:`1px solid ${sel?T.acc:T.bdr}`,background:sel?T.accBg:T.bg3,cursor:"pointer",textAlign:"left",color:sel?T.acc:T.t1,fontSize:12,fontWeight:sel?600:400}}>🎸 {b.name}</button>; })}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Cuerdas</div>
              <div style={{display:"flex",gap:8}}>
                {[4,5,6].map(n => <button key={n} onClick={()=>toggleArr("stringCounts",n)} style={{padding:"7px 18px",borderRadius:20,border:`1px solid ${draft.stringCounts.includes(n)?T.acc:T.bdr}`,background:draft.stringCounts.includes(n)?T.accBg:"transparent",cursor:"pointer",fontSize:13,color:draft.stringCounts.includes(n)?T.acc:T.t1,fontWeight:draft.stringCounts.includes(n)?600:400}}>{n}c</button>)}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Afinaciones</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {TUNINGS.map(t => { const sel=draft.tunings.includes(t.id); return <button key={t.id} onClick={()=>toggleArr("tunings",t.id)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${sel?T.pur:T.bdr}`,background:sel?"rgba(127,119,221,0.1)":"transparent",cursor:"pointer",fontSize:12,color:sel?T.pur:T.t1,fontWeight:sel?600:400}}>{t.label} <span style={{opacity:0.5,fontSize:10}}>{t.notes}</span></button>; })}
              </div>
            </div>
            <Btn onClick={save} variant="accent" size="lg" disabled={!canSave} full>Guardar perfil</Btn>
          </div>
        ))}

        {ptab==="stats" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {!stats ? (
              <div style={{textAlign:"center",padding:"2rem 0"}}>
                <p style={{color:T.t2,fontSize:14,marginBottom:16}}>{tracks.length?"Corré el diagnóstico para ver estadísticas.":"Cargá tu playlist primero."}</p>
                {tracks.length>0 && <Btn onClick={()=>setPtab("diag")} variant="accent">Ver diagnóstico →</Btn>}
              </div>
            ) : (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[{l:"Canciones",v:tracks.length},{l:"BPM prom.",v:Math.round(stats.bpm_prom)||"—"},{l:"Nivel",v:diag?.nivel?.slice(0,4)||"—"}].map(({l,v}) => (
                    <div key={l} style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:700,color:T.t0}}>{v}</div>
                      <div style={{fontSize:10,color:T.t2,marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
                {stats.artistas_top?.length>0 && (
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Artistas más frecuentes</div>
                    <BarChart data={stats.artistas_top.slice(0,6)} nameKey="nombre" valueKey="cantidad"/>
                  </div>
                )}
                {stats.generos_breakdown?.length>0 && (
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Géneros</div>
                    <PieSimple data={stats.generos_breakdown} nameKey="genero" pctKey="pct"/>
                  </div>
                )}
                {stats.dificultad_breakdown?.length>0 && (
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Dificultad</div>
                    <div style={{display:"flex",gap:8}}>
                      {stats.dificultad_breakdown.map((d,i) => (
                        <div key={i} style={{flex:1,background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:700,color:[T.acc,T.org,T.red][i]||T.t0}}>{d.pct}%</div>
                          <div style={{fontSize:10,color:T.t2,marginTop:2,textTransform:"capitalize"}}>{d.nivel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {ptab==="diag" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:600,color:T.t0}}>Análisis de nivel</div>
              {tracks.length>0 && (
                <button onClick={runDiag} disabled={diagLoading} style={{fontSize:12,padding:"5px 10px",borderRadius:8,border:`1px solid ${T.acc}`,background:"transparent",color:T.acc,cursor:diagLoading?"default":"pointer",opacity:diagLoading?0.4:1,display:"flex",alignItems:"center",gap:6}}>
                  {diagLoading ? <><Spinner size={11} color={T.acc}/>Analizando...</> : diag ? "↻ Re-analizar" : "Analizar →"}
                </button>
              )}
            </div>
            {diagLoading && <Loader text="Analizando tu playlist..."/>}
            {!diag && !diagLoading && <p style={{fontSize:13,color:T.t2}}>{tracks.length?"Presioná 'Analizar' para tu diagnóstico.":"Cargá tu playlist primero."}</p>}
            {diag && !diagLoading && (
              <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadeUp 0.3s ease"}}>
                <div style={{background:T.accBg,borderRadius:12,padding:"14px 16px",border:`1px solid ${T.acc}33`}}>
                  <div style={{fontSize:10,fontWeight:600,color:T.acc,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Nivel detectado</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.acc,marginBottom:6}}>{diag.nivel}</div>
                  <p style={{fontSize:13,margin:0,lineHeight:1.6,color:T.t1}}>{diag.nivel_desc}</p>
                </div>
                {diag.tema_dificil && (
                  <div style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Tema más difícil</div>
                    <div style={{fontSize:13,fontWeight:600,color:T.t0}}>{diag.tema_dificil.titulo} — {diag.tema_dificil.artista}</div>
                    <div style={{fontSize:12,color:T.t2,marginTop:4}}>{diag.tema_dificil.por_que}</div>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Fortalezas</div>
                    {diag.fortalezas?.map((f,i) => <div key={i} style={{fontSize:12,color:T.t1,padding:"3px 0",borderBottom:`1px solid ${T.bdr}`}}><span style={{color:T.acc,marginRight:5}}>✓</span>{f}</div>)}
                  </div>
                  <div style={{background:T.bg2,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>A mejorar</div>
                    {diag.mejorar?.map((f,i) => <div key={i} style={{fontSize:12,color:T.t1,padding:"3px 0",borderBottom:`1px solid ${T.bdr}`}}><span style={{color:T.org,marginRight:5}}>→</span>{f}</div>)}
                  </div>
                </div>
                {diag.siguiente_paso && (
                  <div style={{borderLeft:`3px solid ${T.acc}`,paddingLeft:12}}>
                    <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Siguiente paso</div>
                    <p style={{fontSize:13,margin:0,lineHeight:1.5,color:T.t1}}>{diag.siguiente_paso}</p>
                  </div>
                )}
                {diag.recomendadas?.length>0 && (
                  <div>
                    <div style={{fontSize:10,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Para subir de nivel</div>
                    {diag.recomendadas.map((c,i) => (
                      <div key={i} style={{background:T.bg3,borderRadius:8,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:T.t0}}>{c.titulo} — {c.artista}</div>
                          <div style={{fontSize:11,color:T.t2,marginTop:2,display:"flex",alignItems:"center",gap:6}}><DiffBadge d={c.dificultad}/><span>{c.por_que}</span></div>
                        </div>
                        <a href={ugUrl(c.titulo,c.artista)} target="_blank" rel="noopener noreferrer" style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.acc}`,color:T.acc,textDecoration:"none",flexShrink:0,fontWeight:600}}>Tab ↗</a>
                      </div>
                    ))}
                  </div>
                )}
                <UnverifiedNote/>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
const NAV = [{id:"discover",l:"Explorar",e:"🔍"},{id:"study",l:"Estudiar",e:"📖"},{id:"playlist",l:"Playlist",e:"📋"}];

export default function App() {
  const [mode,        setMode]        = useState("discover");
  const [tracks,      setTracks]      = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [diagnosis,   setDiagnosis]   = useState(null);
  const [history,     setHistory]     = useState([]);
  const [histPos,     setHistPos]     = useState(-1);
  const [showProfile, setShowProfile] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [showTutorial,setShowTutorial]= useState(false);
  const [toast,       setToast]       = useState(null);
  const histRef    = useRef([]);
  const histPosRef = useRef(-1);
  const current    = history[histPos] || null;

  const pushTrack = useCallback(track => {
    const nh = [...histRef.current.slice(0, histPosRef.current+1), track];
    histRef.current = nh; histPosRef.current = nh.length-1;
    setHistory(nh); setHistPos(nh.length-1); setMode("study");
  }, []);

  const handleLoad = useCallback(parsed => {
    setTracks(parsed); setShowOnboard(false);
    setToast({ msg:`${parsed.length} canciones cargadas. ¿Analizamos tu nivel?`, actions:[
      { label:"Sí, analizar", fn:()=>{ setToast(null); setShowProfile(true); if(profile) diagnosis(parsed,profile).then(d=>setDiagnosis(d)).catch(()=>{}); } },
      { label:"Después",      fn:()=>setToast(null) },
    ]});
  }, [profile]);

  return (
    <div style={{background:T.bg0, minHeight:"100vh", color:T.t0}}>
      <style>{CSS}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${T.bdr}`,background:T.bg1}}>
        <div style={{display:"flex",gap:2}}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>setMode(n.id)} style={{fontSize:12,padding:"7px 11px",border:"none",borderRadius:8,background:mode===n.id?T.bg3:"transparent",cursor:"pointer",fontWeight:mode===n.id?600:400,color:mode===n.id?T.t0:T.t2,display:"flex",alignItems:"center",gap:4}}>
              <span>{n.e}</span>{n.l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {!tracks.length && <button onClick={()=>setShowOnboard(true)} style={{fontSize:12,padding:"5px 10px",borderRadius:8,border:`1px solid ${T.acc}`,background:"transparent",color:T.acc,cursor:"pointer",fontWeight:500}}>+ Playlist</button>}
          {tracks.length>0 && <span style={{fontSize:11,color:T.t2}}>{tracks.length} canciones</span>}
          <Avatar profile={profile} size={30} onClick={()=>setShowProfile(true)}/>
        </div>
      </div>
      <div style={{maxWidth:680,margin:"0 auto",padding:"20px 16px"}}>
        {mode==="discover" && <Discover profile={profile} pushTrack={pushTrack}/>}
        {mode==="study"    && <Study track={current} tracks={tracks} profile={profile} pushTrack={pushTrack}/>}
        {mode==="playlist" && <PlaylistView tracks={tracks} current={current} pushTrack={t=>{pushTrack(t);}} onLoad={handleLoad} onTutorial={()=>setShowTutorial(true)}/>}
      </div>
      {showTutorial && <Tutorial onClose={()=>setShowTutorial(false)}/>}
      {showOnboard  && <Onboarding onLoad={handleLoad} onSkip={()=>setShowOnboard(false)} onTutorial={()=>{ setShowOnboard(false); setShowTutorial(true); }}/>}
      {showProfile  && <>
        <div onClick={()=>setShowProfile(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:99}}/>
        <ProfilePanel profile={profile} setProfile={setProfile} tracks={tracks} diagnosis={diagnosis} setDiagnosis={setDiagnosis} onLoad={handleLoad} onTutorial={()=>setShowTutorial(true)} onClose={()=>setShowProfile(false)}/>
      </>}
      {toast && <Toast msg={toast.msg} actions={toast.actions} onDismiss={()=>setToast(null)}/>}
    </div>
  );
}
