import test from "node:test";
import assert from "node:assert/strict";
import { suggestChunks } from "../app/core.mjs";
import { BIBLE_PASSPORT_PRELOAD_VERSION, BIBLE_PASSPORT_VERSES } from "../app/preloaded-verses.mjs";

const expectedVerseCounts = [7, 5, 8, 5, 5, 6, 5, 6, 5, 6, 6, 5];

test("Bible Passport preload includes all 12 months once", () => {
  assert.equal(BIBLE_PASSPORT_PRELOAD_VERSION, 1);
  assert.equal(BIBLE_PASSPORT_VERSES.length, 12);
  assert.deepEqual(BIBLE_PASSPORT_VERSES.map((passage) => passage.month), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(new Set(BIBLE_PASSPORT_VERSES.map((passage) => passage.id)).size, 12);
  assert.ok(BIBLE_PASSPORT_VERSES.every((passage) => passage.year === 2026));
});

test("every preloaded passage has bilingual text split at complete verse references", () => {
  BIBLE_PASSPORT_VERSES.forEach((passage, index) => {
    assert.match(passage.reference, /\d+:\d+-\d+ \/ .+ \d+:\d+-\d+/);
    assert.equal(suggestChunks(passage.englishText).length, expectedVerseCounts[index], passage.reference);
    assert.equal(suggestChunks(passage.chineseText).length, expectedVerseCounts[index], passage.reference);
  });
});

test("corrected OCR artifacts are absent from the public preload", () => {
  const text = JSON.stringify(BIBLE_PASSPORT_VERSES);
  assert.doesNotMatch(text, /Imay|Ihave|Iam|JeSUS|crysta\b|地士|靈瑰|自已|水品/);
});
