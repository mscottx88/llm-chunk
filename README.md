# LLM Chunk Utility

A minimal, efficient Node.js TypeScript utility for splitting text or arrays of text for LLM vectorization.

## Features

- **Pure utility**: No server, no frontend, just simple chunking utilities.
- **Configurable**: Set your own chunk size, chunkOverlap, custom length function, and chunking strategy ('sentence' or 'paragraph').
- **Robust**: Handles strings, arrays, empty input, and edge cases.
- **Rich metadata**: Each chunk includes start/end indices and character positions.
- **Synchronous generator**: Use `iterateChunks` to process chunks one at a time.
- **Direct substring extraction**: Use `getChunk` to extract a substring by character position.
- **100% test coverage**: All logic, edge cases, and micro-branches are covered. See `test/chunker.test.ts`.

## Installation

```bash
npm install llm-chunk
# or
pnpm add llm-chunk
```

## Usage

```typescript
import { split, iterateChunks, getChunk, SplitOptions, Chunk } from "llm-chunk";

// Split by paragraph (default)
const paraChunks: Chunk[] = split("Para1\n\nPara2\n\nPara3");

// Split by sentence
const sentChunks: Chunk[] = split("Hello world! How are you? I am fine.", {
  chunkStrategy: "sentence",
});

// Split a single string by size
const chunks: Chunk[] = split("This is a long text...", { chunkSize: 512 });

// Split an array of strings
const chunksArr: Chunk[] = split(["text1", "text2"], { chunkSize: 256 });

// Split with overlap (sliding window)
const slidingChunks: Chunk[] = split("abcdefghij", {
  chunkSize: 4,
  chunkOverlap: 2,
});

// Split using a custom length function (e.g., count only vowels)
const customChunks: Chunk[] = split("abcdeiouxyz", {
  chunkSize: 2,
  lengthFunction: (t) => (t.match(/[aeiou]/g) || []).length,
});

// Iterate over chunks one at a time (generator)
for (const chunk of iterateChunks("abcdefghij", { chunkSize: 3 })) {
  console.log(chunk);
}

// Extract a substring by character position (works for string or array input)
const sub = getChunk(["abc", "def", "gh"], 2, 6); // "cdef"

// Each chunk is an object:
// {
//   chunk: string,           // The chunk text
//   startIndex: number,      // Index in the input array or unit array
//   startPosition: number,   // Character offset in the original string
//   endIndex: number,        // Index in the input array or unit array
//   endPosition: number      // Character offset in the original string (exclusive)
// }
```

## API

### `split(input: string | string[], options?: SplitOptions): Chunk[]`

- `input`: A string or array of strings to split.
- `options.chunkSize`: Maximum size of each chunk (default: 512).
- `options.chunkOverlap`: Number of characters to overlap between chunks (default: 0).
- `options.lengthFunction`: Optional function to calculate the length of the text. If omitted, defaults to the number of characters (`text.length`).
- `options.chunkStrategy`: 'sentence' or 'paragraph' (default: 'paragraph').
- **Returns:** Array of `Chunk` objects (see below).

### `iterateChunks(input: string | string[], options?: SplitOptions): Generator<Chunk>`

- Same arguments as `split`.
- Yields each chunk object one at a time (synchronous generator).
- Useful for streaming or processing large texts chunk-by-chunk.

### `getChunk(text: string | string[], start?: number, end?: number): string`

- `text`: A string or array of strings.
- `start`: Optional start character position (inclusive, default 0).
- `end`: Optional end character position (exclusive, default: end of input).
- **Returns:** The substring between start and end positions (character-based only).

### `Chunk` object

- `chunk`: The chunk string.
- `startIndex`: Index in the input array or unit array where the chunk starts.
- `startPosition`: Character offset in the original string where the chunk starts.
- `endIndex`: Index in the input array or unit array where the chunk ends.
- `endPosition`: Character offset in the original string where the chunk ends (exclusive).

## Testing & Coverage

```bash
pnpm test
```

- 100% test coverage for all logic, edge cases, and micro-branches.
- Coverage reports are generated in the `coverage/` directory.
- To check coverage in detail, open `coverage/index.html` in your browser.

## License

MIT
