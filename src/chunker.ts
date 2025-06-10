/**
 * Options for the split function.
 */
export interface SplitOptions {
  /** Maximum size of each chunk (default: 512). */
  chunkSize?: number;
  /** Number of characters to overlap between chunks (default: 0). */
  chunkOverlap?: number;
  /**
   * Optional function to calculate the length of the text.
   * If omitted, defaults to the number of characters (text.length).
   */
  lengthFunction?: (text: string) => number;
  /**
   * Optional chunking strategy: 'sentence' or 'paragraph'.
   * If set, overrides character-based chunking. Default: 'paragraph'.
   */
  chunkStrategy?: "sentence" | "paragraph";
}

export interface Chunk {
  chunk: string;
  startIndex: number; // index in the input array or unit array
  startPosition: number; // character offset in the original string
  endIndex: number; // index in the input array or unit array
  endPosition: number; // character offset in the original string
}

/**
 * Split text or array of texts for LLM vectorization using a sliding window approach.
 * Each chunk will overlap with the previous chunk by `chunkOverlap` characters (if provided).
 *
 * @param input - A string or array of strings to split.
 * @param options - Options object.
 * @returns Array of chunked strings.
 */
export function split(
  text: string | string[],
  options: SplitOptions = {},
): Chunk[] {
  return Array.from(iterateChunks(text, options));
}

/**
 * Synchronous generator version of split. Yields each chunk object as produced.
 * @param text - A string or array of strings to split.
 * @param options - Options object.
 * @yields Chunk object for each chunk.
 */
export function* iterateChunks(
  text: string | string[],
  {
    chunkSize = 512,
    chunkOverlap = 0,
    lengthFunction,
    chunkStrategy,
  }: SplitOptions = {},
): Generator<Chunk> {
  function getUnits(text: string, strategy: "sentence" | "paragraph") {
    const units: { unit: string; start: number; end: number }[] = [];
    if (strategy === "paragraph") {
      const regex = /\n{2,}/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const end = match.index;
        const unit = text.slice(lastIndex, end).trim();
        if (unit) units.push({ unit, start: lastIndex, end });
        lastIndex = regex.lastIndex;
      }
      const lastUnit = text.slice(lastIndex).trim();
      if (lastUnit)
        units.push({ unit: lastUnit, start: lastIndex, end: text.length });
    } else {
      const regex = /[^.!?]+[.!?]+(?:\s+|$)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const unit = match[0].trim();
        if (unit)
          units.push({ unit, start: match.index, end: regex.lastIndex });
      }
    }
    return units;
  }

  const texts = Array.isArray(text) ? text : [text];
  let globalCharOffset = 0;
  for (let textIdx = 0; textIdx < texts.length; textIdx++) {
    const currentText = texts[textIdx];
    if (currentText.length === 0) {
      yield {
        chunk: "",
        startIndex: 0,
        startPosition: 0,
        endIndex: 0,
        endPosition: 0,
      };
      globalCharOffset += currentText.length;
      continue;
    }
    if (chunkStrategy) {
      const unitsRaw =
        Array.isArray(text) && text !== texts
          ? (text as string[]).map((u) => ({
              unit: u,
              start: 0,
              end: u.length,
            }))
          : getUnits(currentText, chunkStrategy);
      const getLength = lengthFunction
        ? lengthFunction
        : (t: string) => t.length;
      const joiner = chunkStrategy === "paragraph" ? "\n\n" : " ";
      const joinerLen = getLength(joiner);
      const allUnitsFit =
        unitsRaw.every((u) => getLength(u.unit) <= chunkSize) &&
        unitsRaw.reduce(
          (acc, u, i) => acc + getLength(u.unit) + (i > 0 ? joinerLen : 0),
          0,
        ) <= chunkSize;
      if (allUnitsFit) {
        for (let i = 0; i < unitsRaw.length; i++) {
          const u = unitsRaw[i];
          yield {
            chunk: u.unit,
            startIndex: i,
            startPosition: u.start,
            endIndex: i,
            endPosition: u.end,
          };
        }
        globalCharOffset += currentText.length;
        continue;
      }
      let i = 0;
      let lastChunk: string | undefined = undefined;
      const tempChunks: Chunk[] = [];
      while (i < unitsRaw.length) {
        let chunkUnits: typeof unitsRaw = [];
        let currentLen = 0;
        let first = true;
        let j = i;
        while (j < unitsRaw.length) {
          const unit = unitsRaw[j];
          const unitLen = getLength(unit.unit);
          let simulatedLen = currentLen + (first ? 0 : joinerLen) + unitLen;
          if (simulatedLen > chunkSize && chunkUnits.length > 0) break;
          if (simulatedLen > chunkSize && chunkUnits.length === 0) {
            chunkUnits.push(unit);
            j++;
            break;
          }
          chunkUnits.push(unit);
          currentLen = simulatedLen;
          first = false;
          j++;
        }
        const chunkStr = chunkUnits.map((u) => u.unit).join(joiner);
        if (chunkStr && chunkStr !== lastChunk) {
          tempChunks.push({
            chunk: chunkStr,
            startIndex: i,
            startPosition: chunkUnits[0].start,
            endIndex: j - 1,
            endPosition: chunkUnits[chunkUnits.length - 1].end,
          });
          lastChunk = chunkStr;
        }
        if (chunkOverlap > 0 && chunkUnits.length > 0) {
          i += Math.max(1, chunkUnits.length - chunkOverlap);
        } else {
          i = j;
        }
      }
      if (
        tempChunks.length > 1 &&
        tempChunks[tempChunks.length - 1] &&
        tempChunks[tempChunks.length - 2] &&
        tempChunks[tempChunks.length - 2].chunk.endsWith(
          tempChunks[tempChunks.length - 1].chunk,
        )
      )
        tempChunks.pop();
      for (const c of tempChunks) yield c;
      globalCharOffset += currentText.length;
      continue;
    }
    // Character-based chunking (default)
    const getLength = lengthFunction ? lengthFunction : (t: string) => t.length;
    let start = 0;
    while (start < currentText.length) {
      let end = start;
      let currentLen = 0;
      while (end < currentText.length && currentLen < chunkSize) {
        const substr = currentText.slice(start, end + 1);
        currentLen = getLength(substr);
        if (currentLen > chunkSize) break;
        end++;
      }
      if (end === start) end = Math.min(start + 1, currentText.length);
      const chunkStr = currentText.slice(start, end);
      yield {
        chunk: chunkStr,
        startIndex: start,
        startPosition: start,
        endIndex: end - 1,
        endPosition: end,
      };
      if (end >= currentText.length) break;
      if (chunkOverlap > 0 && end > start) {
        start = Math.max(end - chunkOverlap, start + 1);
      } else {
        start = end;
      }
    }
    globalCharOffset += currentText.length;
  }
}

/**
 * Returns the substring from the input text(s) between start and end character positions (character-based only).
 * @param text - A string or array of strings.
 * @param start - Optional start character position (inclusive, default 0).
 * @param end - Optional end character position (exclusive, default: end of input).
 * @returns The substring between start and end positions.
 */
export function getChunk(
  text: string | string[],
  start?: number,
  end?: number,
): string {
  const input = Array.isArray(text) ? text.join("") : text;
  const s = start ?? 0;
  const e = end ?? input.length;
  return input.slice(s, e);
}
