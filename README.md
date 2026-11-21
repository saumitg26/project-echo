PROJECT ECHO
The world is gone. Its memories aren’t.

An immersive memory-preservation experience set in the last surviving cities beneath Earth’s surface. Built for PatriotHacks HackFest 2026.

Live Demo · Source Code
The Story
The year is 2087. Earth’s surface has become uninhabitable, and humanity survives in an underground network known as the Hollow. Resources are rationed, records are fragmented, and the Directorate controls what information survives.

History also lives in photographs, family stories, and the voices of people who came before us. Project Echo asks a question: If we can preserve humanity’s survival, can we also preserve its identity?
What You Can Do
Experience	What to explore
Family Legacy	Explore a family constellation, select a family member, and discover their memories. Try the built-in Voss family demo or sign in to use a private family archive backed by Supabase. Add photos, videos, audio, and other supported records.
3D Memory Room	Step into Mara Voss’s room, built with Three.js and React Three Fiber. Explore objects from her life, open her cassette, and listen to prerecorded narration while following the transcript.
Human Legacy / Lost Earth	Explore an interactive globe and an alternate map view. Open records from Boston Harbor, Svalbard, Kyoto, and Patagonia to inspect documents, evidence, and where each record came from.
Memory Echoes	Compare family memories with historical records. Follow suggested connections based on shared tags into related Human Legacy locations.
First Convoy	Investigate a missing chapter in the evacuation. Compare recovered transit records, witness accounts, and official statements to see where the timelines disagree.
Time Capsule	Write a letter, attach supported media, or record a voice message. Choose a recipient and a future unsealing date, preview the capsule, and seal it in your browser.


Audio Recording and Transcription
Use Upload Memory → Audio → Record Now to capture a voice memory in your browser. You can listen back before saving or upload an existing audio file.

The audio integration includes an optional /api/transcribe endpoint for signed-in users. It requires a configured server-side deployment and an ElevenLabs API key. Generated text can be reviewed and edited in the upload form. The current save flow stores the audio without the transcript.
Technology Stack
Area	Technologies
Frontend	React 19, TypeScript, Vite 8
Styling	Tailwind CSS 4, custom CSS
3D experiences	Three.js, React Three Fiber, React Three Drei
Backend	Supabase PostgreSQL, Auth, Storage, and Row Level Security
Audio	Browser MediaRecorder, prerecorded narration, optional ElevenLabs speech-to-text
Serverless API and hosting	Vercel Functions, Vercel


Getting Started
Run locally
Install Node.js and npm, then run:
git clone https://github.com/saumitg26/project-echo.git
cd project-echo
npm ci
npm run dev

Open the local URL printed by Vite. The built-in demo works without Supabase credentials.
Enable private family archives
Copy .env.example to .env.local and fill in your Supabase project URL and public key:
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

Set up the database migrations and storage policies in supabase/ before using the private archive. See [Supabase setup](docs/SUPABASE_SETUP.md) for the project-specific instructions.
Build and preview locally
npm run build
npm run preview

Vite serves the built frontend locally. Testing live speech-to-text also requires a server that runs /api/transcribe.
Configure Vercel
Add the variables needed for your deployment environment under Project Settings → Environment Variables.
Variable	Purpose
VITE_SUPABASE_URL	Public Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY	Public Supabase publishable key or legacy anon key
ELEVENLABS_API_KEY	Server-side key used by /api/transcribe


Keep ELEVENLABS_API_KEY in the server environment and keep its name free of the VITE_ prefix. Keep secret API keys and Supabase service-role keys out of Git.
Project Structure
Path	Contents
src/App.tsx	Main application and experience navigation
src/audio/	Audio recording and playback components
src/features/memory-room/	3D Memory Room
src/features/human-legacy/	Globe, map, and historical archive
src/lib/supabase/	Supabase client and data helpers
api/transcribe.ts	ElevenLabs speech-to-text endpoint
public/	Static assets, including narration audio
supabase/	Database migrations and access policies


Why We Built It
Official records leave out details that families remember: an unfinished letter, the story behind a photograph, or an account that challenges the accepted version of events. We wanted to make preserving those details something you could experience. Project Echo brings personal storytelling, spatial exploration, and historical investigation into one archive.
Project Status
Project Echo is a hackathon prototype. The setting and historical records are fictional. Time Capsules are stored locally in the browser and simulate future unsealing. Automated delivery and long-term archival custody would require further development.

Memory Echoes currently uses rule-based matching. Experimental Gemini-powered archival analysis is still in development outside the production release.
Team
Built by Saumit Guduguntla, Maanasa Paluparthi, and Lohith Veeramachaneni for PatriotHacks HackFest 2026.
