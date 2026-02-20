import { createHmac, timingSafeEqual } from 'crypto';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * Verify the webhook signature sent by Meta (WhatsApp Cloud API).
 *
 * Meta sends the signature in the `X-Hub-Signature-256` header with the
 * format `sha256=<hex_digest>`. This function recomputes the HMAC-SHA256
 * of the raw request body using the app secret and performs a
 * constant-time comparison to prevent timing attacks.
 *
 * @param rawBody   - The raw request body as a string (before JSON parsing)
 * @param signature - The value of the `X-Hub-Signature-256` header
 * @param appSecret - The Meta App Secret used to sign the payload
 * @returns `true` if the signature is valid, `false` otherwise
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string,
): boolean {
  if (!signature) {
    return false;
  }

  if (!signature.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const receivedHex = signature.slice(SIGNATURE_PREFIX.length);

  const expectedHex = createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Both are hex strings of the same hash algorithm, so equal length is
  // guaranteed when the format is correct. Guard against length mismatch
  // to avoid a timingSafeEqual throw.
  const receivedBuf = Buffer.from(receivedHex, 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');

  if (receivedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(receivedBuf, expectedBuf);
}
