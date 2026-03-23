import { TUNINGS } from './constants';

async function cJSON(system, msg, maxTokens = 1400) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: msg }],
    }),
  });
  const d = await r.json();
  const text = d.content?.map(i => i.text || "").join("") || "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

async function cSearch(system, msg, maxTokens = 3000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system,
      messages: [{ role: "user", content: msg }],
    }),
  });
  const d = await r.json();
  const text = d.content?.filter(i => i.type === "text").map(i => i.text).join("") || "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

export async function fetchTab(name, artist, tempo) {
  try {
    return await cSearch(
      `Bass expert. Search cifraclub.com first, then songsterr.com, then ultimate-guitar.com for the exact bass tab. Technique: only dedos/pua/slap. ONLY valid JSON no markdown: {"encontrada":true,"fuente":"cifraclub|songsterr|ultimate-guitar","url":"...","secciones":[{"nombre":"Intro","tab":"G|---\\nD|---\\nA|---\\nE|---"}],"tempo":"BPM","tonalidad":"...","afinacion":"Standard|Drop D|Eb|D Std|Drop C","cuerdas":4,"tecnica":"dedos|pua|slap|mixta","notas":"..."} If not found: {"encontrada":false}`,
      `Bass tab for "${name}" by ${artist}. ~${Math.round(tempo)||120} BPM. Search cifraclub.com first. Respond in Spanish.`
    );
  } catch(e) { return { encontrada: false }; }
}

export async function fetchBassist(name, artist) {
  try {
    return await cSearch(
      `Bass expert. Search equipboard.com for bassist gear. Technique: only dedos/pua/slap. ONLY JSON no markdown: {"bajista":"name","bajo":"exact model","marca":"brand","tecnica":"dedos|pua|slap|mixta","tecnica_desc":"1 sentence","sonido":"2 sentences","dato_curioso":"1 fact","fuente_gear":"equipboard|interview|estimated","yt_original":"YT query","yt_cover":"YT bass cover query"}`,
      `Bassist info for "${name}" by ${artist}. Search equipboard.com. Respond in Spanish.`,
      800
    );
  } catch(e) { return null; }
}

export const explore = (query, profile) => {
  const prof = profile
    ? `Bajos: ${profile.basses?.map(b=>b.name).join(",")||"?"}, afinaciones: ${profile.tunings?.map(t=>TUNINGS.find(x=>x.id===t)?.label).join(",")||"?"}.`
    : "";
  return cJSON(
    `Experto en bajo. SOLO JSON sin markdown. Responde en español.`,
    `${prof}\nBúsqueda: "${query}"\nJSON:{"resultados":[{"titulo":"...","artista":"...","bajista":"...","tecnica":"dedos|pua|slap|mixta","por_que":"...","dificultad":"fácil|intermedio|avanzado","afinacion":"Standard|Drop D|etc","cuerdas_necesarias":4}]}`,
    900
  );
};

export const suggest = (tracks, profile) => {
  const sample = tracks.slice(0,25).map(t=>`${t.name} - ${t.artist}`).join("\n");
  const prof = profile
    ? `Bajos: ${profile.basses?.map(b=>b.name).join(",")||"?"}, Afin: ${profile.tunings?.map(t=>TUNINGS.find(x=>x.id===t)?.label).join(",")||"?"}`
    : "";
  return cJSON(
    `Experto en bajo. SOLO JSON sin markdown. Responde en español.`,
    `${prof}\nPlaylist:\n${sample}\n6 sugerencias en 3 categorías.\nJSON:{"categorias":[{"nombre":"...","desc":"...","canciones":[{"titulo":"...","artista":"...","por_que":"...","tecnica":"dedos|pua|slap|mixta","afinacion":"...","cuerdas_necesarias":4}]}]}`
  );
};

export const diagnosis = (tracks, profile) => {
  const sample = tracks.slice(0,60).map(t=>`${t.name} - ${t.artist} (${Math.round(t.tempo)}BPM)`).join("\n");
  const prof = `Bajos:${profile?.basses?.map(b=>b.name).join(",")||"?"}, Afin:${profile?.tunings?.join(",")||"?"}`;
  return cJSON(
    `Profesor de bajo experto. SOLO JSON sin markdown. Considera los temas más difíciles para el nivel real.`,
    `Perfil: ${prof}\nPlaylist (${tracks.length}):\n${sample}\nJSON:{"nivel":"Principiante|Intermedio|Avanzado|Experto","nivel_desc":"párrafo","generos":["..."],"tema_dificil":{"titulo":"...","artista":"...","por_que":"..."},"fortalezas":["..."],"mejorar":["..."],"siguiente_paso":"...","recomendadas":[{"titulo":"...","artista":"...","por_que":"...","dificultad":"fácil|intermedio|avanzado"}],"stats":{"bpm_prom":120,"artistas_top":[{"nombre":"...","cantidad":2}],"generos_breakdown":[{"genero":"...","pct":30}],"dificultad_breakdown":[{"nivel":"...","pct":33}]}}`,
    2000
  );
};
