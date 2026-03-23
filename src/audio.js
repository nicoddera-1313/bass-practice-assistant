import { useState, useEffect, useRef } from 'react';

const strFreq = si => [196, 146.83, 110, 82.41][si] || 82.41;
const fretFreq = (si, f) => strFreq(si) * Math.pow(2, f / 12);

function parseNotes(tab, bpm) {
  const lines = (tab||"").split("\n").filter(l => /^[GDAEgdae]/.test(l));
  if (lines.length < 4) return [];
  const sl = lines.slice(0,4).map(l => l.replace(/^[GDAEgdae]\|?/, ""));
  const len = Math.max(...sl.map(l => l.length));
  const notes = []; const bd = 60 / (bpm||120); let t = 0;
  for (let p=0; p<len; p++) {
    let adv = false;
    for (let s=0; s<4; s++) {
      const ch = sl[s]?.[p];
      if (ch && /\d/.test(ch)) {
        let fs = ch;
        if (/\d/.test(sl[s]?.[p+1])) fs += sl[s][p+1];
        const fret = parseInt(fs);
        if (!isNaN(fret)) { notes.push({ t, s, fret, dur: bd*0.85 }); adv = true; }
      }
    }
    if (adv) t += bd;
  }
  return notes;
}

export function useAudio(tab, bpm) {
  const ctxRef  = useRef(null);
  const sched   = useRef([]);
  const rafRef  = useRef(null);
  const notes   = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [pos,     setPos]     = useState(0);

  useEffect(() => {
    notes.current = parseNotes(tab || "", bpm);
    return () => stop();
  }, [tab, bpm]);

  function stop() {
    sched.current.forEach(n => { try { n.stop(); } catch(e) {} });
    sched.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPos(0);
  }

  function play() {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ac = ctxRef.current;
    if (ac.state === "suspended") ac.resume();
    stop();
    const ns = notes.current;
    if (!ns.length) return;
    const now = ac.currentTime + 0.1;
    ns.forEach(n => {
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = "triangle"; o.frequency.value = fretFreq(n.s, n.fret);
      g.gain.setValueAtTime(0.3, now+n.t);
      g.gain.exponentialRampToValueAtTime(0.001, now+n.t+n.dur);
      o.connect(g); g.connect(ac.destination);
      o.start(now+n.t); o.stop(now+n.t+n.dur+0.05);
      sched.current.push(o);
    });
    setPlaying(true);
    const total = ns[ns.length-1].t + 1;
    const tick = () => {
      const el = ac.currentTime - now;
      setPos(Math.min(el/total, 1));
      if (el < total) rafRef.current = requestAnimationFrame(tick);
      else { setPlaying(false); setPos(0); }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  return { playing, pos, play, stop };
}
