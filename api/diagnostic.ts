export const config = {
  maxDuration: 15,
}
export const maxDuration = 15

const ALLOWED_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
])

type DiagnosticErrorCategory =
  | 'UNAUTHORIZED'
  | 'CONFIGURATION_MISSING'
  | 'INVALID_MODEL'
  | 'TIMEOUT'
  | 'AUTH_REJECTED'
  | 'MODEL_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_OVERLOADED'
  | 'UPSTREAM_SERVER_ERROR'
  | 'NETWORK_FAILURE'

function categorizeError(status: number, isTimeout: boolean): DiagnosticErrorCategory {
  if (isTimeout) return 'TIMEOUT'
  if (status === 401 || status === 403) return 'AUTH_REJECTED'
  if (status === 404) return 'MODEL_UNAVAILABLE'
  if (status === 429) return 'RATE_LIMIT_EXCEEDED'
  if (status === 503) return 'SERVICE_OVERLOADED'
  if (status >= 500) return 'UPSTREAM_SERVER_ERROR'
  return 'NETWORK_FAILURE'
}

const NO_STORE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
}

export async function POST(request: Request): Promise<Response> {
  const { ECHO_DIAGNOSTIC_TOKEN, GEMINI_API_KEY, GEMINI_MODEL } = process.env

  // 1. Enforce server-side diagnostic token configuration
  if (!ECHO_DIAGNOSTIC_TOKEN) {
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        errorCategory: 'CONFIGURATION_MISSING',
        message: 'ECHO_DIAGNOSTIC_TOKEN is not configured on the server.',
      }),
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }

  // 2. Authenticate request via Authorization header or x-echo-diagnostic-token
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.match(/^Bearer (\S+)$/i)?.[1]
  const customHeaderToken = request.headers.get('x-echo-diagnostic-token')
  const incomingToken = bearerToken || customHeaderToken

  if (!incomingToken || incomingToken !== ECHO_DIAGNOSTIC_TOKEN) {
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        errorCategory: 'UNAUTHORIZED',
        message: 'Invalid or missing diagnostic authorization credentials.',
      }),
      { status: 401, headers: NO_STORE_HEADERS },
    )
  }

  // 3. Verify server-side GEMINI_API_KEY configuration
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        errorCategory: 'CONFIGURATION_MISSING',
        message: 'GEMINI_API_KEY is not configured on the server.',
      }),
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }

  // 4. Parse request body for model override and enforce strict allowlist
  let requestedModel = GEMINI_MODEL || 'gemini-3.8-flash'
  try {
    const body = await request.json()
    if (body && typeof body.model === 'string' && body.model.trim()) {
      requestedModel = body.model.trim()
    }
  } catch {
    // Body is optional; default model is used if body is absent or not JSON
  }

  if (!ALLOWED_MODELS.has(requestedModel)) {
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        errorCategory: 'INVALID_MODEL',
        message: `Model '${requestedModel}' is not in the verified diagnostic allowlist.`,
        allowedModels: Array.from(ALLOWED_MODELS),
      }),
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }

  // 5. Execute a single minimal generateContent request with strict 10s timeout
  const startTime = Date.now()
  let isTimeout = false

  try {
    const upstreamResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${requestedModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with OK' }] }],
        }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    const elapsedMs = Date.now() - startTime

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          status: 'ERROR',
          model: requestedModel,
          httpStatus: upstreamResponse.status,
          elapsedMs,
          errorCategory: categorizeError(upstreamResponse.status, false),
        }),
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    const data = await upstreamResponse.json().catch(() => null)
    const replySnippet = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().slice(0, 50) || '(empty)'

    return new Response(
      JSON.stringify({
        status: 'SUCCESS',
        model: requestedModel,
        httpStatus: upstreamResponse.status,
        elapsedMs,
        replySnippet,
      }),
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (err) {
    const elapsedMs = Date.now() - startTime
    isTimeout = err instanceof Error && err.name === 'TimeoutError'

    return new Response(
      JSON.stringify({
        status: 'ERROR',
        model: requestedModel,
        httpStatus: isTimeout ? 504 : 502,
        elapsedMs,
        errorCategory: categorizeError(isTimeout ? 504 : 502, isTimeout),
      }),
      { status: 200, headers: NO_STORE_HEADERS },
    )
  }
}

// Reject all other HTTP methods
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'ERROR',
      errorCategory: 'UNAUTHORIZED',
      message: 'Method not allowed. Diagnostic requests must be submitted via POST with authorization headers.',
    }),
    {
      status: 405,
      headers: {
        'Allow': 'POST',
        ...NO_STORE_HEADERS,
      },
    },
  )
}
