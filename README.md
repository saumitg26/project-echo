<div align="center">PROJECT ECHO
The world is gone. Its memories aren't.
An immersive memory-preservation experience set in the last surviving cities beneath Earth's surface.

Built for PatriotHacks HackFest 2026

Live Demo · Source Code
</div>The Story
The year is 2087. Earth's surface has become uninhabitable, and humanity survives in an underground network known as the Hollow. Resources are rationed, records are fragmented, and the Directorate controls what information survives.

But history is more than official records. It lives in photographs, family stories, recordings, and the voices of people who came before us.

PROJECT ECHO is an interactive archive built around one question:
If we can preserve humanity's survival, can we also preserve its identity?

Explore personal memories, piece together surviving historical evidence, and leave something meaningful for future generations.
What You Can Do
Family Legacy — Preserve the people behind the history
- Explore a family constellation and the memories attached to its members.
- Save personal memories, including written records and supported media.
- Use Supabase-backed family accounts and private archives when signed in.
- Experience the fictional Voss family archive through the built-in demo.
3D Memory Room — Step inside a memory
- Explore Mara Voss's immersive room, built with Three.js and React Three Fiber.
- Interact with spatial artifacts that reveal pieces of her story.
- Play a preserved cassette recording as part of the experience.
Human Legacy / Lost Earth — Explore what remains
- Navigate an interactive 3D globe and explore archival locations.
- Discover surviving records from Boston Harbor, Svalbard, Kyoto, and Patagonia.
- Inspect historical documents, provenance, and evidence across locations.
- Use the alternate map experience where applicable.
Memory Echoes — Connect personal stories to history
- Compare family memories with historical archive records.
- Discover connections based on shared tags and context.
- Follow a suggested connection into the related Human Legacy location.
Current release: Memory Echoes uses rule-based matching. Experimental Gemini-powered archival analysis is being developed separately and is not part of the production release.

First Convoy — Investigate a missing chapter
- Examine recovered evidence about an evacuation convoy.
- Compare witness accounts, transit records, and official statements.
- Explore the contradictions between personal testimony and the official timeline.
Time Capsule — Leave a message for tomorrow
- Write a letter, attach supported media, or record a voice message.
- Choose a recipient and a simulated future unsealing date.
- Seal a capsule in the browser-based prototype.
Prototype limitation: Capsules are saved locally in the browser. Automated delivery to future recipients is not implemented.

Technology Stack
Area	Technologies
Frontend	React 19, TypeScript, Vite 8
Styling	Tailwind CSS 4, custom CSS
3D experiences	Three.js, React Three Fiber, React Three Drei
Backend and database	Supabase (PostgreSQL, Auth, Storage, RLS)
Audio	Browser MediaRecorder, ElevenLabs speech-to-text integration, prerecorded narration
Serverless API	Vercel Functions
Hosting	Vercel


Getting Started
Prerequisites
- Node.js and npm
- A Supabase project if you want to enable authenticated private family archives
- An ElevenLabs API key if you want to enable server-side audio transcription
Installation
git clone https://github.com/saumitg26/project-echo.git
cd project-echo
npm ci
Copy .env.example to .env.local, then configure your Supabase public credentials:
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
Start the development server:
npm run dev
Open the local URL displayed by Vite.

To build for production:
npm run build
npm run preview
Server-side configuration
When deploying on Vercel, configure the relevant environment variables in Project Settings → Environment Variables:
Variable	Purpose
VITE_SUPABASE_URL	Public Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY	Public Supabase publishable/anon key
ELEVENLABS_API_KEY	Server-side ElevenLabs speech-to-text integration


Never commit secret API keys or Supabase service-role keys. The ELEVENLABS_API_KEY belongs in server-side environment variables, not a VITE_ variable. Supabase database migrations and storage policies are under supabase/ and must be configured for private-archive functionality.
Project Structure
project-echo/
├── api/                         # Vercel serverless functions
│   └── transcribe.ts            # ElevenLabs speech-to-text endpoint
├── public/                      # Static assets, including audio
├── src/
│   ├── App.tsx                  # Main application and experiences
│   ├── audio/                    # Recording and playback components
│   ├── features/
│   │   ├── human-legacy/         # Interactive globe and archives
│   │   └── memory-room/         # 3D Memory Room
│   └── lib/supabase/            # Supabase client and data helpers
├── supabase/                     # Database schema and RLS migrations
├── package.json
└── README.md
Why We Built It
PROJECT ECHO explores the idea that a civilization's history cannot be captured by official records alone. Ordinary people preserve details that institutions miss: family photographs, unfinished letters, everyday voices, and accounts that challenge the accepted version of events.

We wanted to make memory preservation something you experience, not simply another file-storage dashboard. The result combines interactive storytelling, spatial exploration, historical investigation, and tools for preserving personal stories.
Team
Built by Saumit Guduguntla, Maanasa Paluparthi, and Lohith Veeramachaneni for PatriotHacks HackFest 2026.
Project Status
PROJECT ECHO is a hackathon prototype. Its fictional setting and archived historical materials are part of the interactive narrative. Demo content is illustrative; production-grade archival integrity, long-term custody, and future capsule delivery would require further development.
<div align="center">The world above is gone. Our stories don't have to be.

Explore PROJECT ECHO
</div>
