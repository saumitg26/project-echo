import { createClient } from '@supabase/supabase-js'

const maxAudioBytes = 2_000_000
const audioTypes = new Set([
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav',
  'audio/x-wav', 'audio/x-m4a',
])

export async function POST(request: Request): Promise<Response> {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) {
    return Response.json({ error: 'Sign in to transcribe audio.' }, { status: 401 })
  }

  const { ELEVENLABS_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!ELEVENLABS_API_KEY || !VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ error: 'Transcription is not configured.' }, { status: 503 })
  }

  try {
    const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return Response.json({ error: 'Sign in again to transcribe audio.' }, { status: 401 })
    }
  } catch {
    return Response.json({ error: 'Could not verify your session. Try again.' }, { status: 503 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Send an audio file as form data.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'Choose or record an audio file first.' }, { status: 400 })
  }
  if (file.size > maxAudioBytes) {
    return Response.json({ error: 'Audio must be 2 MB or smaller.' }, { status: 413 })
  }
  if (!audioTypes.has(file.type.split(';', 1)[0])) {
    return Response.json({ error: 'Choose WebM, Ogg, M4A, MP3, or WAV audio.' }, { status: 415 })
  }

  const audio = new FormData()
  audio.set('file', file, file.name)
  audio.set('model_id', 'scribe_v2')

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: audio,
      signal: AbortSignal.timeout(30_000),
    })

    if (response.status === 429) {
      return Response.json({ error: 'Transcription is busy. Try again shortly.' }, { status: 429 })
    }
    if (!response.ok) {
      console.error('ElevenLabs returned status', response.status)
      return Response.json({ error: 'ElevenLabs could not transcribe this clip.' }, { status: 502 })
    }

    const result = await response.json()
    if (typeof result?.text !== 'string' || !result.text.trim()) {
      return Response.json({ error: 'No speech was detected. Try a clearer clip.' }, { status: 422 })
    }

    return Response.json({ text: result.text.trim() })
  } catch {
    return Response.json({ error: 'Transcription did not finish. Try again.' }, { status: 502 })
  }
}
