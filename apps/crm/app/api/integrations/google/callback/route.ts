import { exchangeCodeForTokens, storeGoogleTokens } from '@real-estate/integrations/google';
import { NextResponse } from 'next/server';

interface GoogleCallbackDeps {
  exchangeCodeForTokens: typeof exchangeCodeForTokens;
  storeGoogleTokens: typeof storeGoogleTokens;
}

const defaultDeps: GoogleCallbackDeps = {
  exchangeCodeForTokens,
  storeGoogleTokens,
};

export function createGoogleCallbackGetHandler(deps: GoogleCallbackDeps = defaultDeps) {
  return async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Google sends error param when user denies consent
    if (error) {
      return NextResponse.redirect(
        new URL('/api/integrations/google/callback-result?status=denied', url.origin)
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL('/api/integrations/google/callback-result?status=error&reason=missing_params', url.origin)
      );
    }

    let state: { tenantId: string; actorId: string };
    try {
      state = JSON.parse(stateParam);
      if (!state.tenantId || !state.actorId) throw new Error('Invalid state');
    } catch {
      return NextResponse.redirect(
        new URL('/api/integrations/google/callback-result?status=error&reason=invalid_state', url.origin)
      );
    }

    try {
      const tokens = await deps.exchangeCodeForTokens(code);
      await deps.storeGoogleTokens(state.tenantId, state.actorId, tokens);

      // Redirect back to CRM with success indicator
      // The frontend reads this query param to show a toast
      return NextResponse.redirect(
        new URL('/?integration=google&status=connected', url.origin)
      );
    } catch (err) {
      console.error('[Google OAuth Callback] Token exchange failed:', err);
      return NextResponse.redirect(
        new URL('/?integration=google&status=error', url.origin)
      );
    }
  };
}

export const GET = createGoogleCallbackGetHandler();
