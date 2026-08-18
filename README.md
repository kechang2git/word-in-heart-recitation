# Word in Heart / 藏在心裡

An installable, offline-first PWA for memorizing and accurately reciting 4–5 user-supplied Bible verses each month. It bundles no Bible translation and sends no verse text to an app backend.

## What works

- English, Traditional Chinese, and bilingual onboarding and study tracks.
- PDF selectable-text extraction with a mandatory editable review step, page association, warnings, split/delete controls, and duplicate handling.
- Image-only pages render a local preview and enter a clearly labeled manual-transcription path. Browser OCR is intentionally not presented as reliable.
- Manual verse entry, monthly plan filters, local progress history, deterministic English-token/Chinese-character comparison, typed recall, browser speech recognition, transcript correction, self-check fallback, and temporary audio recording/playback.
- Progressive cues, corrective retry, transparent 1/3/7/14/30-day review scheduling, three-retrieval learning criterion, and multi-day mastery rules.
- IndexedDB persistence, JSON backup/restore, deletion, install manifest, and service-worker offline app shell.

## Requirements and commands

- Node.js 22.13 or newer and pnpm.
- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm build`

Open the printed local URL in Safari or Chrome. On iPhone, deploy over HTTPS, open in Safari, use Share, then **Add to Home Screen**.

## PDF correction workflow

Choose **Import PDF**, select a PDF, and inspect every proposed record. Correct month, year, reference, English/Chinese wording, and version label. Low-confidence and image-only pages are warned. Nothing is committed until **Confirm and save reviewed verses** is selected.

To test with a real monthly PDF without committing it, create a local `private-fixtures/` folder (already ignored by the recommended Git workflow) and choose the file through the app. The PWA reads it locally; it does not upload it.

## Privacy and permissions

Verse text, PDF-derived text, notes, transcripts, settings, and history are stored in IndexedDB in the current browser profile. Microphone and speech permissions are requested only when those controls are used. Browser speech recognition availability and processing depend on the browser, OS, device language, and system service. A failed recognizer never creates an incorrect attempt. Notification permission is requested only after reminders are enabled; reliable background delivery varies by PWA/browser and is therefore described as best-effort.

## Architecture

- `app/recitation-app.tsx`: accessible UI and complete import/practice/progress/settings flows.
- `app/core.mjs`: deterministic normalization, alignment/diff, reference/PDF-text parsing, cue generation, duplicate detection, and scheduler.
- `app/storage.ts`: versioned IndexedDB document plus JSON backup/restore.
- `app/pdf-import.ts`: local PDF.js extraction and scanned-page preview rendering.
- `public/manifest.webmanifest` and `public/sw.js`: installation and offline shell/runtime caching.
- `tests/core.test.mjs`: deterministic parser, matcher, duplicate, and scheduler tests using invented placeholder text.

## Known limitations

- PDF layouts vary; review is mandatory. Image-only PDFs require manual transcription from the generated preview in this MVP.
- Browser speech recognition may use an operating-system or browser service and may not work offline. Typed recitation and self-check always remain available.
- Recorded audio is temporary for immediate playback and is not retained in backup files.
- Web notifications cannot guarantee delivery when every browser process is closed. No full verse is placed in a notification.
- Data is device/browser-profile local. Clearing site data removes it unless a JSON backup was exported.
