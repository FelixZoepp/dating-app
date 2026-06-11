/**
 * Cloudflare Turnstile verification.
 * Server-side token validation.
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes': string[];
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip in development if no key configured
  if (!secret) {
    console.warn('[Turnstile] No secret key configured, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
      }),
    });

    const data: TurnstileResponse = await response.json();
    return data.success;
  } catch {
    console.error('[Turnstile] Verification failed');
    return false;
  }
}
