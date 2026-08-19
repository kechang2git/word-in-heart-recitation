export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
export const INITIAL_SUCCESS_CRITERION = 3;

export function normalizeText(text, language = "en", ignorePunctuation = true) {
  let value = String(text ?? "")
    .normalize("NFKC")
    .replace(/\[[^\]]*\]/gu, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
  if (language === "en") value = value.toLocaleLowerCase("en");
  if (ignorePunctuation) value = value.replace(/[\p{P}\p{S}]/gu, " ");
  if (language === "zh") return [...value.replace(/\s/gu, "")];
  return value.trim().split(/\s+/u).filter(Boolean);
}

export function compareText(expected, actual, language = "en", ignorePunctuation = true) {
  const a = normalizeText(expected, language, ignorePunctuation);
  const b = normalizeText(actual, language, ignorePunctuation);
  const rows = a.length + 1, cols = b.length + 1;
  const d = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) d[i][0] = i;
  for (let j = 0; j < cols; j += 1) d[0][j] = j;
  for (let i = 1; i < rows; i += 1) for (let j = 1; j < cols; j += 1) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  const pieces = []; let i = a.length; let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { pieces.push({ kind: "equal", expected: a[i - 1], actual: b[j - 1] }); i -= 1; j -= 1; }
    else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) { pieces.push({ kind: "substitution", expected: a[i - 1], actual: b[j - 1] }); i -= 1; j -= 1; }
    else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { pieces.push({ kind: "deletion", expected: a[i - 1], actual: null }); i -= 1; }
    else { pieces.push({ kind: "insertion", expected: null, actual: b[j - 1] }); j -= 1; }
  }
  pieces.reverse();
  const distance = d[a.length][b.length];
  const score = Math.max(0, Math.round((1 - distance / Math.max(a.length, b.length, 1)) * 1000) / 10);
  const reordered = a.length === b.length && a.join("|") !== b.join("|") && [...a].sort().join("|") === [...b].sort().join("|");
  return { score, pieces, errorCount: pieces.filter((piece) => piece.kind !== "equal").length, reordered };
}

export function duplicateKey(reference, translation, text) {
  return [reference, translation, text].map((part) => String(part ?? "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "")).join("|");
}

export function findReferences(text) {
  const patterns = [
    /\b(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?\b/giu,
    /(?:[一二三1-3])?[\p{Script=Han}]{1,8}(?:記|書|福音|前書|後書|信)?\s*\d{1,3}[章:]\s*\d{1,3}(?:[-–至]\d{1,3})?[節]?/gu,
  ];
  return patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => ({ reference: match[0], index: match.index ?? 0, end: (match.index ?? 0) + match[0].length }))).sort((x, y) => x.index - y.index);
}

function monthFromText(text, fallbackDate = new Date()) {
  const englishMonths = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const lower = text.toLocaleLowerCase();
  const named = englishMonths.findIndex((month) => lower.includes(month));
  const chinese = text.match(/(?:^|\D)(1[0-2]|0?[1-9])\s*月/u);
  const year = Number(text.match(/\b(20\d{2})\b/u)?.[1] ?? fallbackDate.getFullYear());
  return { month: named >= 0 ? named + 1 : Number(chinese?.[1] ?? fallbackDate.getMonth() + 1), year };
}

export function parseVersePages(pages, filename, now = new Date()) {
  const drafts = [];
  for (const page of pages) {
    const date = monthFromText(page.text, now);
    const refs = findReferences(page.text);
    if (!refs.length) {
      drafts.push({ id: crypto.randomUUID(), ...date, reference: "", englishText: /[A-Za-z]{3}/u.test(page.text) ? page.text.trim() : "", chineseText: /\p{Script=Han}/u.test(page.text) ? page.text.trim() : "", translation: "", pageNumber: page.pageNumber, sourceFilename: filename, confidence: 0.2, warning: page.scanned ? "This image-only page needs manual transcription and review." : "No Bible reference was recognized. Complete this record manually." });
      continue;
    }
    refs.forEach((ref, index) => {
      const next = refs[index + 1]?.index ?? page.text.length;
      let body = page.text.slice(ref.end, next).replace(/^\s*[-–—:]?\s*/u, "").replace(/^\s*(?:page\s+\d+|第\s*\d+\s*頁)\s*$/gimu, "").trim();
      const bilingualBreak = body.search(/\n\s*(?=[\p{Script=Han}])/u);
      const hasEnglish = /[A-Za-z]{3}/u.test(body); const hasChinese = /\p{Script=Han}/u.test(body);
      let englishText = hasEnglish ? body : ""; let chineseText = hasChinese && !hasEnglish ? body : "";
      if (hasEnglish && hasChinese && bilingualBreak >= 0) { englishText = body.slice(0, bilingualBreak).trim(); chineseText = body.slice(bilingualBreak).trim(); }
      const warning = body.length < 12 ? "Verse text looks incomplete—please review." : page.scanned ? "Image-only page: transcribe from the preview before saving." : undefined;
      drafts.push({ id: crypto.randomUUID(), ...date, reference: ref.reference, englishText, chineseText, translation: "", pageNumber: page.pageNumber, sourceFilename: filename, confidence: warning ? 0.5 : 0.9, warning });
    });
  }
  return drafts;
}

function dayStamp(value) { const d = new Date(value); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function plusDays(value, days) { const d = dayStamp(value); d.setDate(d.getDate() + days); return d.toISOString(); }

export function scheduleReview(review, rating, { date = new Date(), score = 100, cued = false } = {}) {
  const state = { ...review }; const today = dayStamp(date); const accurate = score >= 98 && !cued;
  const lastSuccess = state.lastSuccessDate ? dayStamp(state.lastSuccessDate) : null;
  if (accurate && (!lastSuccess || lastSuccess.getTime() !== today.getTime())) { state.successfulDays = (state.successfulDays ?? 0) + 1; state.lastSuccessDate = today.toISOString(); }
  if (["new", "learning"].includes(state.stage)) {
    state.successfulRetrievals = (state.successfulRetrievals ?? 0) + (accurate ? 1 : 0);
    if (state.successfulRetrievals >= INITIAL_SUCCESS_CRITERION) { state.stage = "reviewing"; state.initialLearningDate ||= today.toISOString(); state.intervalIndex = 0; state.nextReviewDate = plusDays(today, 1); }
    else { state.stage = "learning"; state.nextReviewDate = today.toISOString(); }
    return state;
  }
  let index = state.intervalIndex ?? 0;
  if (rating === "again") { index = Math.max(0, index - 1); state.nextReviewDate = plusDays(today, 1); }
  if (rating === "hard") state.nextReviewDate = plusDays(today, REVIEW_INTERVALS[Math.min(index, 4)]);
  if (rating === "good") { index = Math.min(4, index + 1); state.nextReviewDate = plusDays(today, REVIEW_INTERVALS[index]); }
  if (rating === "easy") { index = Math.min(4, index + 2); state.nextReviewDate = plusDays(today, REVIEW_INTERVALS[index]); }
  state.intervalIndex = index;
  if (accurate && state.successfulDays >= 3 && state.initialLearningDate && (today - dayStamp(state.initialLearningDate)) / 86400000 >= 7) state.stage = "mastered";
  else state.stage = "reviewing";
  return state;
}

export function clozeText(text, level = 1, language = "en") {
  if (language === "zh" && level === 3) {
    let revealNextCharacter = true;
    return [...text].map((character) => {
      if (/\s/u.test(character)) return character;
      if (/[，。！？；：、,.!?;:]/u.test(character)) {
        revealNextCharacter = true;
        return character;
      }
      if (!/[\p{L}\p{N}]/u.test(character)) return character;
      if (revealNextCharacter) {
        revealNextCharacter = false;
        return character;
      }
      return "·";
    }).join("");
  }
  const tokens = language === "zh" ? [...text] : text.split(/(\s+)/u);
  if (level === 0) return text;
  if (level >= 4) return "•••";
  let wordIndex = 0;
  return tokens.map((token) => {
    if (/^\s+$/u.test(token) || !/[\p{L}\p{N}]/u.test(token)) return token;
    wordIndex += 1;
    if (level === 3) return token[0] + "·".repeat(Math.max(1, [...token].length - 1));
    const hidden = level === 1 ? wordIndex % 3 === 0 : wordIndex % 2 === 0 || wordIndex % 3 === 0;
    return hidden ? "_____" : token;
  }).join(language === "zh" ? "" : "");
}

export function suggestChunks(text) {
  const verseMarkers = [...text.matchAll(/\b\d{1,3}:\d{1,3}\b/gu)];
  if (verseMarkers.length > 1) {
    const boundaries = verseMarkers.slice(1).map((match) => match.index);
    return [0, ...boundaries]
      .map((start, index, starts) => text.slice(start, starts[index + 1] ?? text.length).trim())
      .filter(Boolean);
  }
  return text
    .split(/(?:(?<=[,;.!?。；，！？])|(?<!\d:)(?<=:))\s*/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}
