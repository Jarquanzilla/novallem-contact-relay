export interface Env {
  RESEND_API_KEY: string;
}

// Add one line here per client site launched. The site's contact form sends
// { site: '<key>', ... } and the message is relayed to the matching inbox —
// the caller never controls the destination address directly.
const SITES: Record<string, { to: string; label: string }> = {
  novallem: { to: 'hello@novallem.com', label: 'Novallem' },
  // Concept portfolio sites — all route to the Novallem inbox.
  crestline: { to: 'hello@novallem.com', label: 'Crestline Web Studio' },
  brightline: { to: 'hello@novallem.com', label: 'Brightline Home Painting' },
  trueline: { to: 'hello@novallem.com', label: 'Trueline Painting Co.' },
  armsworthy: { to: 'hello@novallem.com', label: 'Armsworthy Tulsa Fencing' },
  ofence: { to: 'hello@novallem.com', label: 'O-Fence of Mustang' },
  whisker: { to: 'hello@novallem.com', label: 'Whisker & Bean' },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const site = typeof body.site === 'string' ? body.site : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const business = typeof body.business === 'string' ? body.business.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    const target = SITES[site];
    if (!target) {
      return json({ error: 'Unknown site' }, 400);
    }
    if (!name || !email || !message) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const subject = `New inquiry from ${business || name} (${target.label})`;
    const text = `Name: ${name}\nEmail: ${email}\nBusiness: ${business || '—'}\n\n${message}`;
    const html = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Business:</strong> ${escapeHtml(business || '—')}</p>
      <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Novallem Forms <forms@novallem.com>',
        to: target.to,
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      return json({ error: 'Failed to send', detail }, 502);
    }

    return json({ ok: true });
  },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
