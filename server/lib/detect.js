// Self-contained heuristic AI-text detector.
// No external API calls — scores writing-pattern signals that tend to differ
// between AI-generated and human-written text, then combines them into a
// single 0-100 "AI likelihood" estimate. This is a heuristic, not a trained
// classifier, and should be treated as a signal rather than a verdict.

const CLICHE_PHRASES = [
  'in conclusion', 'in summary', 'to summarize', 'it is important to note',
  "it's important to note", 'it is worth noting', "it's worth noting",
  'moreover', 'furthermore', 'additionally', 'in today\'s fast-paced world',
  'in the realm of', 'delve into', 'delving into', 'navigate the complexities',
  'unlock the potential', 'unleash the potential', 'plays a crucial role',
  'plays a vital role', 'cannot be overstated', 'as an ai language model',
  'i hope this helps', "let's dive in", 'let us dive in', 'in essence',
  'on the other hand', 'at the end of the day', 'when it comes to',
  'it goes without saying', 'a testament to', 'stands as a testament',
  'in the world of', 'the importance of', 'holistic approach',
  'ever-evolving', 'ever-changing landscape', 'game changer', 'game-changer',
  'paradigm shift', 'seamlessly integrate', 'robust solution',
  'in order to', 'as previously mentioned', 'as we have seen',
  'it is essential to', "it's essential to", 'in a nutshell',
]

const TRANSITION_STARTERS = [
  'however', 'moreover', 'furthermore', 'additionally', 'overall',
  'therefore', 'thus', 'also', 'in conclusion', 'in summary', 'consequently',
  'nevertheless', 'nonetheless', 'importantly', 'notably',
]

const CONTRACTIONS = [
  "don't", "can't", "won't", "it's", "that's", "i'm", "you're", "we're",
  "isn't", "aren't", "didn't", "wasn't", "weren't", "couldn't", "wouldn't",
  "shouldn't", "let's", "there's", "here's", "what's", "who's", "doesn't",
  "haven't", "hasn't", "hadn't", "i've", "you've", "we've", "they've",
  "i'll", "you'll", "we'll", "they'll",
]

// Casual/informal markers (texting-style contractions and filler) — count
// alongside apostrophe contractions as evidence of an informal human voice.
const INFORMAL_MARKERS = [
  // Note: 'its' deliberately excluded — it's the correct possessive, not slang.
  'im', 'dont', 'cant', 'wont', 'thats', 'ur', 'u', 'gonna', 'wanna',
  'kinda', 'sorta', 'gotta', 'lol', 'lmao', 'omg', 'tbh', 'idk', 'yeah',
  'nah', 'okay', 'ok', 'hmm', 'ugh',
]

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function splitSentences(text) {
  if (!text || !text.trim()) return []
  // Split on sentence-ending punctuation followed by whitespace, or newline breaks
  // so bullet points, multi-paragraph text and poetry split cleanly.
  return text
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function splitWords(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || [])
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
}

function mean(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stddev(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = mean(arr.map((x) => (x - m) ** 2))
  return Math.sqrt(variance)
}

function countOccurrences(haystack, needle) {
  let count = 0
  let idx = 0
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count += 1
    idx += needle.length
  }
  return count
}

/**
 * Analyze text and produce an AI-likelihood score with a signal breakdown.
 * @param {string} rawText
 */
export function detectAIText(rawText) {
  // Normalize typographic apostrophes (’ ‘ ʼ) so contractions like "don’t" —
  // which LLMs, Word and PDFs emit constantly — are recognized.
  const text = (rawText || '').replace(/[\u2018\u2019\u02BC]/g, "'").trim()
  const lower = text.toLowerCase()
  const sentences = splitSentences(text)
  const words = splitWords(text)
  const wordCount = words.length
  const per100 = (n) => (wordCount ? (n / wordCount) * 100 : 0)

  // 1. Burstiness — coefficient of variation of sentence length (in words).
  // With fewer than 3 sentences there isn't enough data for variance to mean
  // anything, so treat it as neutral rather than scoring it as "uniform".
  const sentenceLengths = sentences.map((s) => splitWords(s).length).filter((n) => n > 0)
  const hasEnoughSentences = sentenceLengths.length >= 3
  const lenMean = mean(sentenceLengths)
  const lenStd = stddev(sentenceLengths)
  const cov = lenMean > 0 ? lenStd / lenMean : 0
  const burstinessScore = hasEnoughSentences
    ? clamp(Math.round(((0.65 - cov) / 0.65) * 100))
    : 50

  // 2. AI cliche / stock phrase density.
  let clicheHits = 0
  for (const phrase of CLICHE_PHRASES) {
    clicheHits += countOccurrences(lower, phrase)
  }
  const clicheScore = clamp(Math.round(per100(clicheHits) * 45))

  // 3. Repetitive transition-word sentence openers.
  // Note: openers can only be repetitive when there are at least 2 sentences.
  let transitionStarters = 0
  for (const s of sentences) {
    const wordsInSentence = splitWords(s)
    const firstWord = (wordsInSentence[0] || '')
    const firstTwo = wordsInSentence.slice(0, 2).join(' ')
    if (TRANSITION_STARTERS.includes(firstWord) || TRANSITION_STARTERS.includes(firstTwo)) {
      transitionStarters += 1
    }
  }
  const starterRatio = sentences.length >= 2 ? transitionStarters / sentences.length : 0
  const starterScore = clamp(Math.round(starterRatio * 180))

  // 4. Contraction / informality usage — absence mildly skews formal,
  // but many legitimate human texts (academic, business, journalism) avoid slang.
  // Base absence score starts at 55 rather than 100, dropping sharply when
  // contractions/slang are present.
  let contractionCount = 0
  const contractionSet = new Set(CONTRACTIONS)
  for (const w of words) {
    if (contractionSet.has(w)) contractionCount += 1
  }
  let informalCount = 0
  for (const w of words) {
    if (INFORMAL_MARKERS.includes(w)) informalCount += 1
  }
  const informalityCount = contractionCount + informalCount
  const contractionAbsenceScore = clamp(Math.round(55 - per100(informalityCount) * 25))

  // 5. Repeated phrasing — exact bigram repetition ratio.
  const bigrams = []
  for (let i = 0; i < words.length - 1; i++) bigrams.push(`${words[i]} ${words[i + 1]}`)
  const bigramCounts = new Map()
  for (const b of bigrams) bigramCounts.set(b, (bigramCounts.get(b) || 0) + 1)
  let repeatedBigramTokens = 0
  for (const count of bigramCounts.values()) {
    if (count > 1) repeatedBigramTokens += count
  }
  const bigramRepeatRatio = bigrams.length ? repeatedBigramTokens / bigrams.length : 0
  const repetitionScore = clamp(Math.round(bigramRepeatRatio * 180))

  // 6. Punctuation quirks — em-dash / semicolon overuse.
  const emDashCount = countOccurrences(text, '—') + countOccurrences(text, ' - ')
  const semicolonCount = countOccurrences(text, ';')
  const punctuationScore = clamp(Math.round(per100(emDashCount) * 35 + per100(semicolonCount) * 18))

  const signals = [
    {
      name: 'Sentence length uniformity',
      value: hasEnoughSentences ? `${cov.toFixed(2)} variation` : 'not enough sentences',
      contribution: burstinessScore,
      weight: 25,
    },
    {
      name: 'Stock AI phrases',
      value: `${clicheHits} found`,
      contribution: clicheScore,
      weight: 25,
    },
    {
      name: 'Repetitive sentence openers',
      value: `${transitionStarters}/${sentences.length || 0} sentences`,
      contribution: starterScore,
      weight: 15,
    },
    {
      name: 'Contraction / informality usage',
      value: `${informalityCount} found`,
      contribution: contractionAbsenceScore,
      weight: 15,
    },
    {
      name: 'Repeated phrasing',
      value: `${Math.round(bigramRepeatRatio * 100)}% repeated`,
      contribution: repetitionScore,
      weight: 10,
    },
    {
      name: 'Punctuation patterns',
      value: `${emDashCount} dashes, ${semicolonCount} semicolons`,
      contribution: punctuationScore,
      weight: 10,
    },
  ]

  const totalWeight = signals.reduce((a, s) => a + s.weight, 0)
  const weighted = signals.reduce((a, s) => a + s.contribution * s.weight, 0) / totalWeight
  const score = clamp(Math.round(weighted))

  return {
    score,
    signals: signals.map(({ name, value, contribution }) => ({ name, value, contribution })),
    wordCount,
    sentenceCount: sentences.length,
  }
}
