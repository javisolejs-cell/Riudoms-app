// Consulta la API pública de la FCF (grupo 15) desde el servidor y cachea 10 min.
const GRUP = '58162176';
exports.handler = async () => {
  try {
    const r = await fetch('https://www.fcf.cat/api/competition/partidos?grupId=' + GRUP, {
      headers: { 'User-Agent': 'Mozilla/5.0 (app familias CD Riudoms)', 'Referer': 'https://www.fcf.cat/' }
    });
    if (!r.ok) throw new Error('FCF ' + r.status);
    const d = await r.json();
    return { statusCode: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=600' }, body: JSON.stringify(d) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
