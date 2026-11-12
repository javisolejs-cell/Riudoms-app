import { getStore } from '@netlify/blobs';

const H = { 'content-type': 'application/json', 'cache-control': 'no-store' };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

export default async (req) => {
  try {
    const store = getStore('riudoms');
    if (req.method === 'POST') {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return out({ error: 'Falta crear la variable ADMIN_PASSWORD en Netlify' }, 500);
      let b; try { b = await req.json(); } catch { return out({ error: 'Petición no válida' }, 400); }
      if (b.password !== pw) return out({ error: 'Contraseña incorrecta' }, 401);
      if (b.data) await store.setJSON('data', b.data);
      if (b.actas) await store.setJSON('actas', b.actas);
      return out({ ok: true });
    }
    const [data, actas] = await Promise.all([store.get('data', { type: 'json' }), store.get('actas', { type: 'json' })]);
    return out({ data, actas });
  } catch (e) { return out({ error: String(e) }, 500); }
};

export const config = { path: '/api/datos' };
