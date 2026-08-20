"use client";

import { suggestChunks, type ReviewRecord } from "./core.mjs";
import { BIBLE_PASSPORT_PRELOAD_VERSION, BIBLE_PASSPORT_VERSES, type PreloadedVerse } from "./preloaded-verses.mjs";

export type VerseRecord = { id: string; month: number; year: number; reference: string; englishText: string; chineseText: string; englishTranslation: string; chineseTranslation: string; sourceFilename: string; sourcePage: number; notes: string; chunks: string[]; createdAt: string; updatedAt: string };
export type AttemptRecord = { id: string; verseID: string; timestamp: string; mode: "typed" | "spoken" | "self-check"; language: "en" | "zh"; promptLevel: number; response: string; referenceResponse: string; accuracyScore: number; referenceScore: number; errorCount: number; elapsedSeconds: number; rating: string; success: boolean };
export type SettingsRecord = { uiLanguage: "en" | "zh" | "both"; studyMode: "en" | "zh" | "alternate" | "both"; strict: boolean; ignorePunctuation: boolean; reminders: boolean; reminderTime: string; speech: boolean; onboarding: boolean };
export type AppDocument = { version: 1; preloadVersion?: number; verses: VerseRecord[]; reviews: ReviewRecord[]; attempts: AttemptRecord[]; settings: SettingsRecord };

const defaultSettings = (): SettingsRecord => ({ uiLanguage: "both", studyMode: "both", strict: true, ignorePunctuation: true, reminders: false, reminderTime: "19:00", speech: true, onboarding: false });

function materializeVerse(source: PreloadedVerse): VerseRecord {
  return { id: source.id, month: source.month, year: source.year, reference: source.reference, englishText: source.englishText, chineseText: source.chineseText, englishTranslation: "ESV", chineseTranslation: "和合本", sourceFilename: "1770594482-1731-bible-passport-.pdf", sourcePage: source.sourcePage, notes: `Bible Passport 2026 · ${source.theme}`, chunks: suggestChunks(source.englishText), createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

function materializeReviews(verse: VerseRecord): ReviewRecord[] {
  const nextReviewDate = new Date(Date.UTC(verse.year, verse.month - 1, 1)).toISOString();
  return (["en", "zh"] as const).map((language) => ({ id: `${verse.id}-${language}`, verseID: verse.id, language, stage: "new", nextReviewDate, intervalIndex: 0, successfulRetrievals: 0, successfulDays: 0 }));
}

function hasMatchingPassage(verses: VerseRecord[], source: PreloadedVerse): boolean {
  const [englishReference, chineseReference] = source.reference.split(" / ");
  return verses.some((verse) => verse.id === source.id || verse.reference.includes(englishReference) || verse.reference.includes(chineseReference));
}

export function applyBuiltInPreload(document: AppDocument): AppDocument {
  if ((document.preloadVersion ?? 0) >= BIBLE_PASSPORT_PRELOAD_VERSION) return document;
  const addedVerses = BIBLE_PASSPORT_VERSES.filter((source) => !hasMatchingPassage(document.verses, source)).map(materializeVerse);
  return { ...document, preloadVersion: BIBLE_PASSPORT_PRELOAD_VERSION, verses: [...document.verses, ...addedVerses], reviews: [...document.reviews, ...addedVerses.flatMap(materializeReviews)] };
}

export const emptyDocument = (): AppDocument => applyBuiltInPreload({ version: 1, preloadVersion: 0, verses: [], reviews: [], attempts: [], settings: defaultSettings() });

const DB_NAME = "word-in-heart-local"; const STORE = "documents"; const KEY = "app-state";
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function loadDocument(): Promise<AppDocument> { const db = await openDB(); return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get(KEY); request.onsuccess = () => resolve(request.result ? applyBuiltInPreload(request.result) : emptyDocument()); request.onerror = () => reject(request.error); }); }
export async function saveDocument(document: AppDocument): Promise<void> { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(document, KEY); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }
export async function clearDocument(): Promise<void> { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(KEY); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }
export function downloadBackup(document: AppDocument) { const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `word-in-heart-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); }
export async function readBackup(file: File): Promise<AppDocument> { const value = JSON.parse(await file.text()); if (value?.version !== 1 || !Array.isArray(value.verses) || !Array.isArray(value.reviews) || !value.settings) throw new Error("This is not a valid Word in Heart backup."); return applyBuiltInPreload(value); }
