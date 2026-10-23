import { createFileRoute } from '@tanstack/react-router';

type WhatsAppWebhookEnvelope = {
  object?: unknown;
  entry?: Array<{
    changes?: Array<{
      field?: unknown;
      value?: {
        messages?: unknown[];
        statuses?: unknown[];
      };
    }>;
  }>;
};

function getSecret(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

/** Constant-time comparison for same-length byte arrays. */
function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return mismatch === 0;
}

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function isValidMetaSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header?.startsWith('sha256=')) return false;
  const received = hexToBytes(header.slice('sha256='.length));
  if (!received) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)),
  );
  return constantTimeEqual(expected, received);
}

function isWebhookEnvelope(value: unknown): value is WhatsAppWebhookEnvelope {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const Route = createFileRoute('/api/whatsapp')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        const expectedToken = getSecret('WHATSAPP_VERIFY_TOKEN');

        if (!expectedToken) {
          return new Response('Webhook não configurado', { status: 503 });
        }
        if (mode !== 'subscribe' || !token || !challenge || token !== expectedToken) {
          return new Response('Verificação inválida', { status: 403 });
        }
        return new Response(challenge, {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
        });
      },

      POST: async ({ request }) => {
        const appSecret = getSecret('WHATSAPP_APP_SECRET');
        if (!appSecret) {
          return jsonResponse({ error: 'Webhook não configurado' }, 503);
        }

        const rawBody = await request.text();
        let validSignature = false;
        try {
          validSignature = await isValidMetaSignature(
            rawBody,
            request.headers.get('x-hub-signature-256'),
            appSecret,
          );
        } catch (error) {
          console.error('Falha ao validar assinatura do webhook WhatsApp:', error);
          return jsonResponse({ error: 'Falha na validação' }, 500);
        }
        if (!validSignature) return jsonResponse({ error: 'Assinatura inválida' }, 401);

        let payload: unknown;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return jsonResponse({ error: 'JSON inválido' }, 400);
        }
        if (!isWebhookEnvelope(payload) || payload.object !== 'whatsapp_business_account') {
          return jsonResponse({ error: 'Evento inválido' }, 400);
        }

        // Acknowledge promptly. Do not log message text, phone numbers, or access tokens.
        const entries = Array.isArray(payload.entry) ? payload.entry : [];
        let messageEvents = 0;
        let statusEvents = 0;
        for (const entry of entries) {
          const changes = Array.isArray(entry.changes) ? entry.changes : [];
          for (const change of changes) {
            const value = change.value;
            if (!value || typeof value !== 'object') continue;
            if (Array.isArray(value.messages)) messageEvents += value.messages.length;
            if (Array.isArray(value.statuses)) statusEvents += value.statuses.length;
          }
        }
        console.info('Webhook WhatsApp validado', { entries: entries.length, messageEvents, statusEvents });
        return jsonResponse({ received: true });
      },
    },
  },
});
