// Lee las actas de los partidos jugados del CD Riudoms (goles con minuto + alineaciones).
const H = 'https://www.fcf.cat/es', GRUP = '58162176';
const hdr = { 'User-Agent': 'Mozilla/5.0 (app familias CD Riudoms)', 'Referer': 'https://www.fcf.cat/' };

function tokens(html) {
  let h = html.replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  h = h.replace(/<svg[\s\S]*?<\/svg>/g, s => !s.includes('<circle') ? '|' : s.includes('#00FF73') ? '|BALLN|' : s.includes('#82E4FF') ? '|BALLP|' : s.includes('#F30000') ? '|BALLO|' : '|');
  return h.replace(/<!--[\s\S]*?-->/g, '').split(/<[^>]*>/).map(x => x.trim()).filter(x => x && x !== '|');
}

function parse(html) {
  const T = tokens(html), out = { lu: {}, goals: [] };
  // Goles: "H - A", "(minuto')", dorsal, nombre, marca de tipo (N normal, P penalti, O propia)
  const gi = T.indexOf('GOLS'); let ph = 0;
  for (let i = gi + 1; gi >= 0 && i < T.length; i++) {
    const s = /^(\d+) - (\d+)$/.exec(T[i]); if (!s) { if (out.goals.length) break; else continue; }
    const m = /^\((\d+)'\)$/.exec(T[i + 1] || ''); if (!m) continue;
    const k = /^\|BALL([NPO])\|$/.exec(T[i + 4] || '');
    out.goals.push({ sh: +s[1], sa: +s[2], min: +m[1], d: +T[i + 2], n: T[i + 3], k: k ? k[1] : 'N', t: +s[1] > ph ? 'h' : 'a' });
    ph = +s[1]; i += k ? 4 : 3;
  }
  // Alineaciones (la primera aparición de cada equipo)
  for (let i = 0; i < T.length; i++) {
    if (T[i] !== 'TITULARS' || ['SUPLENTS', 'EQUIP TÈCNIC'].includes(T[i + 1]) || out.lu[T[i + 1]]) continue;
    const team = T[i + 1], list = []; let st = true;
    for (let j = i + 2; j < T.length && T[j] !== 'EQUIP TÈCNIC'; j++) {
      if (T[j] === 'SUPLENTS') st = false;
      else if (/^\d+$/.test(T[j]) && T[j + 1] && /[A-Za-zÀ-ÿ]/.test(T[j + 1]) && !/^\d+[’']$/.test(T[j + 1]) && T[j + 1] !== 'C') { list.push({ d: +T[j], n: T[j + 1], s: st }); j++; }
    }
    out.lu[team] = list;
  }
  return out;
}
exports.parse = parse;

exports.handler = async () => {
  try {
    const r = await fetch('https://www.fcf.cat/api/competition/partidos?grupId=' + GRUP, { headers: hdr });
    if (!r.ok) throw new Error('FCF ' + r.status);
    const d = await r.json(), out = {}, err = {};
    const ms = Object.values(d.partidos).flat().filter(m => /RIUDOMS/.test(m.NOMBRE_CASA + m.NOMBRE_FUERA) && m.ESTADO === '1' && m.GOLES_CASA != null);
    for (let i = 0; i < ms.length; i += 4)
      await Promise.all(ms.slice(i, i + 4).map(async m => { try { const x = await fetch(H + m.MATCH_URL, { headers: hdr }); if (x.ok) out[+m.JORNADA] = parse(await x.text()); else err[+m.JORNADA] = 'HTTP ' + x.status; } catch (e) { err[+m.JORNADA] = String(e); } }));
    return { statusCode: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=1800, s-maxage=21600' }, body: JSON.stringify(Object.keys(err).length ? { ...out, _err: err } : out) };
  } catch (e) { return { statusCode: 502, body: JSON.stringify({ error: String(e) }) }; }
};
