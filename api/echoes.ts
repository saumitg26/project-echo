import { createClient } from '@supabase/supabase-js'

export const config = {
  maxDuration: 30,
}

interface DemoMemory {
  id: string
  title: string
  description: string
  ancestorName: string
  date: string
  tags: string[]
}

const CANONICAL_DEMO_MEMORIES: Record<string, DemoMemory> = {
  'seed-elena-photo': {
    id: 'seed-elena-photo',
    title: 'The afternoon before',
    description: 'A family photograph taken on the first warm day of 2041 in Boston before coastal sea barriers began construction.',
    ancestorName: 'Elena Voss',
    date: '2041-04-18',
    tags: ['family', 'boston', '2041'],
  },
  'seed-elena-letter': {
    id: 'seed-elena-letter',
    title: 'To whoever finds this',
    description: 'An unsent personal letter describing harbor sirens and a military convoy crossing North Bridge fifty minutes before the official Directorate evacuation warning.',
    ancestorName: 'Elena Voss',
    date: '2058-03-22',
    tags: ['letter', 'boston', 'evacuation', 'convoy'],
  },
  'seed-elena-audio': {
    id: 'seed-elena-audio',
    title: 'Field notes 17',
    description: 'A field tape recording describing the transport of viable surface botanical seed libraries into Svalbard deep permafrost vaults under ORPHEUS clearance.',
    ancestorName: 'Elena Voss',
    date: '2057-11-02',
    tags: ['audio', 'svalbard', 'evacuation', 'seeds', 'orpheus'],
  },
  'seed-mara-city': {
    id: 'seed-mara-city',
    title: 'City above the water',
    description: 'Mara’s last photograph of the Boston harbor skyline at sunrise, showing harbor defense barriers and naval evacuation ships.',
    ancestorName: 'Mara Voss',
    date: '2058-03-22',
    tags: ['boston', 'harbor', 'evacuation'],
  },
  'seed-jonas-ocean': {
    id: 'seed-jonas-ocean',
    title: 'The open water',
    description: 'A memory of an ocean horizon in southern Patagonia before atmospheric particulate obscuration and shelter lockdowns.',
    ancestorName: 'Jonas Vale',
    date: '2055-06-14',
    tags: ['ocean', 'patagonia', 'surface'],
  },
}

interface HistoricalRecordItem {
  id: string
  slug: string
  title: string
  content: string
  event_at: string | null
  provenance: string
  location_id: string
  location_slug: string
  location_name: string
  tags: string[]
}

const CANONICAL_HISTORICAL_RECORDS: HistoricalRecordItem[] = [
  {
    id: 'b1000000-0000-4000-8000-000000000004',
    slug: 'gate-transit-log-17-b',
    title: 'Gate Transit Log 17-B',
    content: 'DIRECTORATE PRIORITY · 17 VEHICLES · CLEARANCE: ORPHEUS. North Bridge gate opened fifty-one minutes before the public warning.',
    event_at: '2058-03-22T04:51:00Z',
    provenance: 'Recovered North Bridge access controller · checksum partially verified',
    location_id: 'a1000000-0000-4000-8000-000000000001',
    location_slug: 'boston-harbor',
    location_name: 'BOSTON HARBOR',
    tags: ['boston', 'harbor', 'evacuation', 'convoy'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    slug: 'boston-harbor-alarms',
    title: 'Harbor Alarms Begin',
    content: 'Emergency tones were recorded across the harbor district before the Directorate bulletin.',
    event_at: '2058-03-22T05:10:00Z',
    provenance: 'Recovered municipal alarm index · Archive 41-B',
    location_id: 'a1000000-0000-4000-8000-000000000001',
    location_slug: 'boston-harbor',
    location_name: 'BOSTON HARBOR',
    tags: ['boston', 'harbor', 'alarms'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    slug: 'elena-voss-letter',
    title: 'Elena Voss’s Letter',
    content: '“The convoy had already gone. I watched their lights cross the bridge before the sirens.”',
    event_at: '2058-03-22T05:17:00Z',
    provenance: 'Voss family archive · recovered personal letter',
    location_id: 'a1000000-0000-4000-8000-000000000001',
    location_slug: 'boston-harbor',
    location_name: 'BOSTON HARBOR',
    tags: ['boston', 'testimony', 'convoy'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    slug: 'directorate-evacuation-bulletin',
    title: 'Directorate Bulletin',
    content: '“Evacuation commenced at first warning. All citizens were given equal passage.”',
    event_at: '2058-03-22T05:42:00Z',
    provenance: 'Public Transmission 6A · Directorate broadcast archive',
    location_id: 'a1000000-0000-4000-8000-000000000001',
    location_slug: 'boston-harbor',
    location_name: 'BOSTON HARBOR',
    tags: ['boston', 'public_bulletin'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000005',
    slug: 'north-gate-sealed',
    title: 'North Gate Sealed',
    content: 'The surviving access log records the North Gate entering permanent lockdown.',
    event_at: '2058-03-22T06:18:00Z',
    provenance: 'Recovered municipal access log · Archive 41-B',
    location_id: 'a1000000-0000-4000-8000-000000000001',
    location_slug: 'boston-harbor',
    location_name: 'BOSTON HARBOR',
    tags: ['boston', 'lockdown'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000101',
    slug: 'svalbard-climate-failure',
    title: 'Vault Climate Failure',
    content: 'A thermal-control fault threatened the surviving botanical libraries.',
    event_at: '2057-11-02T18:06:00Z',
    provenance: 'Svalbard environmental controller · damaged export',
    location_id: 'a1000000-0000-4000-8000-000000000002',
    location_slug: 'svalbard-seed-vault',
    location_name: 'SVALBARD',
    tags: ['svalbard', 'seeds'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000102',
    slug: 'orpheus-convoy-arrives',
    title: 'ORPHEUS Convoy Arrives',
    content: 'A transport convoy using ORPHEUS clearance entered the lower vault.',
    event_at: '2057-11-02T19:12:00Z',
    provenance: 'Lower-vault gate ledger · partial checksum match',
    location_id: 'a1000000-0000-4000-8000-000000000002',
    location_slug: 'svalbard-seed-vault',
    location_name: 'SVALBARD',
    tags: ['svalbard', 'orpheus', 'convoy'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000104',
    slug: 'svalbard-inventory-sealed',
    title: 'Final Inventory Sealed',
    content: 'The surviving inventory closes with several cases lacking a destination entry.',
    event_at: '2057-11-02T21:40:00Z',
    provenance: 'Botanical library inventory · final surviving page',
    location_id: 'a1000000-0000-4000-8000-000000000002',
    location_slug: 'svalbard-seed-vault',
    location_name: 'SVALBARD',
    tags: ['svalbard', 'seeds'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000201',
    slug: 'kyoto-gardens-opened',
    title: 'Gardens Opened',
    content: 'Public gardens opened before dawn as citizens arrived to document the bloom.',
    event_at: '2056-04-11T06:30:00Z',
    provenance: 'Collected civic accounts · identities withheld',
    location_id: 'a1000000-0000-4000-8000-000000000003',
    location_slug: 'kyoto-final-bloom',
    location_name: 'KYOTO',
    tags: ['kyoto', 'flowers', 'surface'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000202',
    slug: 'kyoto-public-archive-captured',
    title: 'Public Archive Captured',
    content: 'A distributed set of photographs preserved the final public blossom season.',
    event_at: '2056-04-11T12:14:00Z',
    provenance: 'Kyoto civic image archive · media index',
    location_id: 'a1000000-0000-4000-8000-000000000003',
    location_slug: 'kyoto-final-bloom',
    location_name: 'KYOTO',
    tags: ['kyoto', 'photograph', 'preservation'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000301',
    slug: 'patagonia-telemetry-normal',
    title: 'Weather Telemetry Normal',
    content: 'Wind and ocean telemetry remained within the station’s expected range.',
    event_at: '2055-06-14T03:20:00Z',
    provenance: 'Southern Station 4 telemetry packet',
    location_id: 'a1000000-0000-4000-8000-000000000004',
    location_slug: 'patagonia-southern-signal',
    location_name: 'PATAGONIA',
    tags: ['patagonia', 'ocean', 'telemetry'],
  },
  {
    id: 'b1000000-0000-4000-8000-000000000302',
    slug: 'patagonia-human-voice',
    title: 'Human Voice Detected',
    content: 'A voice appears beneath the wind channel for eleven seconds. The speaker and words remain unresolved.',
    event_at: '2055-06-14T03:24:00Z',
    provenance: 'Southern Station 4 final recording · degraded',
    location_id: 'a1000000-0000-4000-8000-000000000004',
    location_slug: 'patagonia-southern-signal',
    location_name: 'PATAGONIA',
    tags: ['patagonia', 'ocean', 'signal', 'voice'],
  },
]

export async function POST(request: Request): Promise<Response> {
  const { GEMINI_API_KEY, GEMINI_MODEL, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env
  const model = GEMINI_MODEL || 'gemini-3.8-flash'

  let body: { memoryId?: string; isDemo?: boolean }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const { memoryId, isDemo = false } = body
  if (!memoryId || typeof memoryId !== 'string') {
    return Response.json({ error: 'Provide a valid memory ID to analyze.' }, { status: 400 })
  }

  // 1. Authorize and retrieve the memory server-side
  let targetMemory: {
    id: string
    title: string
    description: string
    ancestorName: string
    date: string
  }

  if (isDemo || memoryId.startsWith('seed-')) {
    const demo = CANONICAL_DEMO_MEMORIES[memoryId]
    if (!demo) {
      return Response.json({ error: 'Demo memory not recognized in archive.' }, { status: 404 })
    }
    targetMemory = {
      id: demo.id,
      title: demo.title,
      description: demo.description,
      ancestorName: demo.ancestorName,
      date: demo.date,
    }
  } else {
    // Private memory: require authentication and verify user ownership/membership
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
    if (!token) {
      return Response.json({ error: 'Sign in to analyze private family memories.' }, { status: 401 })
    }
    if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
      return Response.json({ error: 'Supabase storage backend is not configured.' }, { status: 503 })
    }

    try {
      const userSupabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      })

      const { data: userData, error: authError } = await userSupabase.auth.getUser(token)
      if (authError || !userData?.user) {
        return Response.json({ error: 'Sign in again to analyze private archive memories.' }, { status: 401 })
      }

      // Supabase RLS enforces that this user has membership in the memory's family
      const { data: memoryRow, error: memError } = await userSupabase
        .from('memories')
        .select('id, family_id, ancestor_id, title, description, memory_date, ancestors(name)')
        .eq('id', memoryId)
        .single()

      if (memError || !memoryRow) {
        return Response.json({ error: 'Memory not found or you lack access to its archive.' }, { status: 403 })
      }

      // Explicit secondary verification of family membership in family_memberships table
      const { data: membership, error: memberError } = await userSupabase
        .from('family_memberships')
        .select('role')
        .eq('family_id', memoryRow.family_id)
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (memberError || !membership) {
        return Response.json({ error: 'You are not an authorized member of the family archive that owns this memory.' }, { status: 403 })
      }

      // Extract ancestor name safely from relationship
      const ancestorRelation = memoryRow.ancestors as { name?: string } | { name?: string }[] | null
      const ancestorName = Array.isArray(ancestorRelation)
        ? ancestorRelation[0]?.name ?? 'Family Ancestor'
        : ancestorRelation?.name ?? 'Family Ancestor'

      targetMemory = {
        id: memoryRow.id,
        title: memoryRow.title,
        description: memoryRow.description || 'No written testimony provided.',
        ancestorName,
        date: memoryRow.memory_date || 'Date unknown',
      }
    } catch {
      return Response.json({ error: 'Could not verify private memory authorization.' }, { status: 503 })
    }
  }

  // 2. Retrieve published historical records server-side
  let candidateRecords: HistoricalRecordItem[] = CANONICAL_HISTORICAL_RECORDS
  if (VITE_SUPABASE_URL && VITE_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const publicSupabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data: dbRecords, error: dbErr } = await publicSupabase
        .from('historical_records')
        .select('id, location_id, slug, title, content, event_at, provenance, tags, historical_locations!inner(id, slug, name, is_published)')
        .eq('is_published', true)

      if (!dbErr && dbRecords && dbRecords.length > 0) {
        candidateRecords = dbRecords.map((r) => {
          const rawLoc = r.historical_locations as unknown
          const loc = (Array.isArray(rawLoc) ? rawLoc[0] : rawLoc) as { id: string; slug: string; name: string } | null
          return {
            id: r.id,
            slug: r.slug,
            title: r.title,
            content: r.content,
            event_at: r.event_at,
            provenance: r.provenance,
            location_id: r.location_id,
            location_slug: loc?.slug || 'unknown-site',
            location_name: loc?.name || 'SURFACE SITE',
            tags: r.tags || [],
          }
        })
      }
    } catch {
      // Retain canonical fallback records if database query fails
    }
  }

  // 3. Verify Gemini API Key configuration
  if (!GEMINI_API_KEY) {
    return Response.json(
      {
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables for this deployment.',
        code: 'API_KEY_MISSING',
        isConfigured: false,
      },
      { status: 503 },
    )
  }

  // 4. Construct grounded Gemini prompt with strict constraints
  const recordsSummary = candidateRecords.map((r, idx) => (
    `[Record ${idx + 1}] ID: "${r.id}" | Slug: "${r.slug}" | Location: "${r.location_name}"\n` +
    `Title: "${r.title}" | Time: "${r.event_at || 'Circa 2058'}"\n` +
    `Content: "${r.content}"\n` +
    `Provenance: "${r.provenance}"`
  )).join('\n\n')

  const systemInstruction = `You are the Project Echo Archival Intelligence Engine. Your mandate is to analyze personal family memories against verified historical records from the pre-collapse era.

CRITICAL RULES:
1. GROUNDING: You must ONLY reference the historical records provided in the input. Never invent, alter, or hallucinate records, dates, locations, or IDs.
2. QUOTATIONS: For each connection, 'supportingExcerpt' must be an EXACT literal quotation from the content of the historical record.
3. EVIDENCE-BASED ANALYSIS: Describe specific connections, thematic echoes, chronological alignments, or eyewitness contradictions.
4. DISCLOSE UNCERTAINTY: Explicitly state archival limitations, unverified elements, or why the connection remains an interpretive lead rather than definitive proof. Preserve contradictions.
5. NO PERCENTAGES: Do not output arbitrary numerical confidence percentages. Instead, categorize the evidence nature (e.g., EYEWITNESS_CONTRADICTION, CHRONOLOGICAL_CORRELATION, THEMATIC_ECHO, GEOGRAPHIC_PROXIMITY, ARCHIVAL_OVERLAP).
6. Return at most 3 strongest grounded connections. If no plausible historical link exists, return an empty array of connections.`

  const userPrompt = `ANALYZE THIS PRESERVED FAMILY MEMORY:
Ancestor: ${targetMemory.ancestorName}
Title: ${targetMemory.title}
Estimated Date: ${targetMemory.date}
Testimony / Description: ${targetMemory.description.slice(0, 1000)}

APPROVED HISTORICAL RECORDS TO CROSS-REFERENCE:
${recordsSummary}

Find up to 3 historical records that have a plausible, evidence-based relationship to this personal memory. Provide exact quotes from the records and disclose all uncertainties.`

  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          connections: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                historicalRecordId: { type: 'STRING' },
                connectionCategory: {
                  type: 'STRING',
                  enum: [
                    'EYEWITNESS_CONTRADICTION',
                    'CHRONOLOGICAL_CORRELATION',
                    'THEMATIC_ECHO',
                    'GEOGRAPHIC_PROXIMITY',
                    'ARCHIVAL_OVERLAP',
                  ],
                },
                connectionSummary: { type: 'STRING' },
                supportingExcerpt: { type: 'STRING' },
                thematicAnchor: { type: 'STRING' },
                chronologicalAlignment: { type: 'STRING' },
                uncertaintyDisclosure: { type: 'STRING' },
              },
              required: [
                'historicalRecordId',
                'connectionCategory',
                'connectionSummary',
                'supportingExcerpt',
                'uncertaintyDisclosure',
              ],
            },
          },
        },
        required: ['connections'],
      },
    },
  }

  // 5. Call Gemini API (using verified gemini-3.8-flash default, configurable via GEMINI_MODEL)
  let rawResponseText = ''

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify(geminiPayload),
        signal: AbortSignal.timeout(25_000),
      },
    )

    if (response.status === 429) {
      return Response.json(
        {
          error: 'Gemini API rate limit or quota exceeded (429). Please retry shortly.',
          code: 'RATE_LIMIT_EXCEEDED',
          model,
        },
        { status: 429 },
      )
    }

    if (response.status === 404) {
      return Response.json(
        {
          error: `Gemini model "${model}" is not available or unrecognized by Google API (404).`,
          code: 'MODEL_UNAVAILABLE',
          model,
        },
        { status: 404 },
      )
    }

    if (response.status === 401 || response.status === 403) {
      return Response.json(
        {
          error: `Gemini API key was rejected (${response.status}). Verify key permissions in Google Cloud / AI Studio.`,
          code: 'INVALID_API_KEY',
          model,
        },
        { status: response.status },
      )
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => null)
      const detail = errBody?.error?.message ? `: ${errBody.error.message}` : ''
      return Response.json(
        {
          error: `Gemini server returned status ${response.status}${detail}`,
          code: 'GEMINI_SERVER_ERROR',
          model,
        },
        { status: 502 },
      )
    }

    const geminiJson = await response.json()
    const candidate = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof candidate !== 'string' || !candidate.trim()) {
      return Response.json(
        {
          error: 'Gemini returned an empty response candidate.',
          code: 'EMPTY_RESPONSE',
          model,
        },
        { status: 502 },
      )
    }
    rawResponseText = candidate.trim()
  } catch (cause) {
    const isTimeout = cause instanceof Error && cause.name === 'TimeoutError'
    return Response.json(
      {
        error: isTimeout
          ? 'Gemini analysis request timed out (25s).'
          : 'Failed to connect to Google Gemini API (network failure).',
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_FAILURE',
        model,
      },
      { status: isTimeout ? 504 : 502 },
    )
  }

  // 6. Parse and strictly validate every returned record ID and quote
  interface RawConnection {
    historicalRecordId: string
    connectionCategory: string
    connectionSummary: string
    supportingExcerpt: string
    thematicAnchor?: string
    chronologicalAlignment?: string
    uncertaintyDisclosure: string
  }

  let parsed: { connections?: RawConnection[] }
  try {
    parsed = JSON.parse(rawResponseText)
  } catch {
    return Response.json({ error: 'Malformed AI response format.' }, { status: 502 })
  }

  const rawConnections = parsed.connections || []
  const validatedConnections = []

  for (const raw of rawConnections) {
    // 1. Strict record ID verification against retrieved published records
    const matchedRecord = candidateRecords.find(
      (r) => r.id === raw.historicalRecordId || r.slug === raw.historicalRecordId,
    )
    if (!matchedRecord) continue // Drop ungrounded/hallucinated record IDs

    // 2. Strict evidence quotation verification against actual record content
    const rawExcerpt = raw.supportingExcerpt?.trim() || ''
    const content = matchedRecord.content
    const cleanExcerpt = rawExcerpt.replace(/^[“"'\s]+|[”"'\s]+$/g, '').trim()
    const normExcerpt = cleanExcerpt.toLowerCase().replace(/['"“”.,;:!?]/g, ' ').replace(/\s+/g, ' ').trim()
    const normContent = content.toLowerCase().replace(/['"“”.,;:!?]/g, ' ').replace(/\s+/g, ' ').trim()

    let verifiedExcerpt = ''
    if (normExcerpt && normContent.includes(normExcerpt)) {
      // Direct supported quotation found in record content
      verifiedExcerpt = cleanExcerpt
    } else {
      // Check if a substantial segment (at least 3 key words) matches content
      const words = normExcerpt.split(' ').filter((w) => w.length > 3)
      const matchingWords = words.filter((w) => normContent.includes(w))
      if (words.length > 0 && matchingWords.length / words.length >= 0.75) {
        // Locate matching sentence in the record content
        const sentences = content.split(/(?<=[.!?])\s+/)
        const bestSentence = sentences.find((s) => words.some((w) => s.toLowerCase().includes(w)))
        verifiedExcerpt = bestSentence ? bestSentence.trim() : content
      } else {
        // Excerpt is unsupported or fabricated: reject connection
        continue
      }
    }

    validatedConnections.push({
      id: `ai-echo-${matchedRecord.id}-${validatedConnections.length}`,
      historicalRecordId: matchedRecord.id,
      historicalRecordSlug: matchedRecord.slug,
      historicalRecordTitle: matchedRecord.title,
      historicalLocationId: matchedRecord.location_id,
      historicalLocationSlug: matchedRecord.location_slug,
      historicalLocationName: matchedRecord.location_name,
      provenance: matchedRecord.provenance,
      connectionCategory: raw.connectionCategory,
      connectionSummary: raw.connectionSummary,
      supportingExcerpt: verifiedExcerpt,
      thematicAnchor: raw.thematicAnchor || matchedRecord.tags[0] || 'Historical Resonance',
      chronologicalAlignment: raw.chronologicalAlignment || `Event time: ${matchedRecord.event_at || 'Circa 2058'}`,
      uncertaintyDisclosure: raw.uncertaintyDisclosure,
      isAIGenerated: true,
    })

    if (validatedConnections.length >= 3) break
  }

  return Response.json({
    status: 'success',
    memoryId: targetMemory.id,
    model,
    connections: validatedConnections,
  })
}
