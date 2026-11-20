// Where a recording came from. Shown to the user and saved with the memory.
export type AudioSourceType = 'original' | 'ai-generated-demo'

export type TranscriptionStatus = 'none' | 'uploading' | 'transcribing' | 'ready' | 'failed'

// What AudioRecorder hands back to the rest of the app.
export type RecordingResult = {
  blob: Blob
  url: string            // temporary object URL for preview only
  mimeType: string       // e.g. "audio/webm" (codecs stripped)
  durationSeconds: number
  sizeBytes: number
  extension: string      // "webm" | "mp4" | "ogg"
  sourceType: 'original'
}
