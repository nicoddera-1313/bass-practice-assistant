import { PAL, TUNINGS, TUNING_MAP } from './constants';

export const avatarColor = s => {
  let h = 0;
  for (const c of (s || "")) h = (h * 31 + c.charCodeAt(0)) % PAL.length;
  return PAL[h];
};

export const initials = n =>
  (n || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

export const ytUrl  = q    => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const ugUrl  = (n,a) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(n+" "+a+" bajo")}`;
export const cfUrl  = (n,a) => `https://www.cifraclub.com/${a.toLowerCase().replace(/[^a-z0-9]+/g,"-")}/${n.toLowerCase().replace(/[^a-z0-9]+/g,"-")}/tabs-baixo/`;
export const techKey = t   => (t||"").toLowerCase().replace("fingers","dedos").replace("pick","pua").replace("finger","dedos").split(/[\/|,\s]/)[0].trim();

export function gearCheck(profile, tuning, strings) {
  if (!profile) return null;
  const norm = TUNING_MAP[(tuning||"").toLowerCase()] || (tuning||"standard").toLowerCase();
  const issues = [];
  if (norm !== "standard" && !(profile.tunings||[]).includes(norm)) {
    const td = TUNINGS.find(x => x.id === norm);
    issues.push(`Requiere afinación ${td ? td.label : tuning} — no está en tu perfil.`);
  }
  if (strings > Math.max(...(profile.stringCounts||[4])))
    issues.push(`Requiere ${strings} cuerdas — tus bajos tienen máximo ${Math.max(...(profile.stringCounts||[4]))}.`);
  return issues.length ? issues : null;
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g,"").trim());
  const gi = k => headers.findIndex(h => h === k);
  const iN=gi("Track Name"), iA=gi("Artist Name(s)"), iT=gi("Tempo"), iE=gi("Energy"), iP=gi("Popularity");
  if (iN===-1||iA===-1) return null;
  const tracks = [];
  for (let i=1; i<lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = []; let cur="", inQ=false;
    for (const ch of lines[i]) {
      if (ch==='"'){inQ=!inQ;} else if(ch===','&&!inQ){cols.push(cur.trim());cur="";} else cur+=ch;
    }
    cols.push(cur.trim());
    const name   = cols[iN]?.replace(/^"|"$/g,"").trim();
    const artist = cols[iA]?.replace(/^"|"$/g,"").trim();
    if (!name||!artist) continue;
    tracks.push({ name, artist,
      tempo:      parseFloat(cols[iT])||0,
      energy:     parseFloat(cols[iE])||0,
      popularity: parseInt(cols[iP])||0,
    });
  }
  return tracks.length ? tracks : null;
}
