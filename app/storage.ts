"use client";

import type { ReviewRecord } from "./core.mjs";

export type VerseRecord = { id: string; month: number; year: number; reference: string; englishText: string; chineseText: string; englishTranslation: string; chineseTranslation: string; sourceFilename: string; sourcePage: number; notes: string; chunks: string[]; createdAt: string; updatedAt: string };
export type AttemptRecord = { id: string; verseID: string; timestamp: string; mode: "typed" | "spoken" | "self-check"; language: "en" | "zh"; promptLevel: number; response: string; referenceResponse: string; accuracyScore: number; referenceScore: number; errorCount: number; elapsedSeconds: number; rating: string; success: boolean };
export type SettingsRecord = { uiLanguage: "en" | "zh" | "both"; studyMode: "en" | "zh" | "alternate" | "both"; strict: boolean; ignorePunctuation: boolean; reminders: boolean; reminderTime: string; speech: boolean; onboarding: boolean };
export type AppDocument = { version: 1; verses: VerseRecord[]; reviews: ReviewRecord[]; attempts: AttemptRecord[]; settings: SettingsRecord };

export const emptyDocument = (): AppDocument => ({ version: 1, verses: [], reviews: [], attempts: [], settings: { uiLanguage: "both", studyMode: "both", strict: true, ignorePunctuation: true, reminders: false, reminderTime: "19:00", speech: true, onboarding: false } });

const DB_NAME = "word-in-heart-local"; const STORE = "documents"; const KEY = "app-state";
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function loadDocument(): Promise<AppDocument> { const db = await openDB(); return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get(KEY); request.onsuccess = () => resolve(request.result ?? emptyDocument()); request.onerror = () => reject(request.error); }); }
export async function saveDocument(document: AppDocument): Promise<void> { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(document, KEY); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }
export async function clearDocument(): Promise<void> { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(KEY); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }
export function downloadBackup(document: AppDocument) { const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `word-in-heart-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); }
export async function readBackup(file: File): Promise<AppDocument> { const value = JSON.parse(await file.text()); if (value?.version !== 1 || !Array.isArray(value.verses) || !Array.isArray(value.reviews) || !value.settings) throw new Error("This is not a valid Word in Heart backup."); return value; }
