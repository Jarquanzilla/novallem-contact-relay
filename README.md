# Novallem Contact Relay

Shared Cloudflare Worker that every client site's contact form posts to. One
Resend account, one verified sending domain (`novallem.com`), unlimited
client sites — adding a new one is a one-line edit to `SITES` in
`src/index.ts`, no new signups.

## One-time setup (you)

1. Sign up free at [resend.com](https://resend.com).
2. Add and verify `novallem.com` as a sending domain (Resend gives you a
   couple of DNS records — add them in your Cloudflare DNS dashboard for
   novallem.com, same as any other DNS record).
3. Create an API key in Resend, copy it.
4. In this folder, run `wrangler login` (opens a browser to authorize your
   Cloudflare account) — tell me once it's done and I'll deploy from here.

## Adding a new client site later

Add one line to the `SITES` map in `src/index.ts`:

```ts
const SITES: Record<string, { to: string; label: string }> = {
  novallem: { to: 'christian@novallem.com', label: 'Novallem' },
  'armsworthy-tulsa-fencing': { to: 'owner@example.com', label: 'Armsworthy Tulsa Fencing' },
};
```

Then redeploy (`npm run deploy`). The client site's form just needs:

```js
fetch('https://novallem-contact-relay.<your-subdomain>.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ site: 'armsworthy-tulsa-fencing', name, email, business, message }),
});
```

## Limits

Resend free tier: 3,000 emails/month, 100/day, across every site using this
relay combined. Plenty of headroom for contact-form volume across several
small-business sites at once.
