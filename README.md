# LLM Chunk Utility

A minimal, efficient Node.js TypeScript utility for splitting text or arrays of text for LLM vectorization.

## Features
- **Pure utility**: No server, no frontend, just a simple splitting function.
- **Configurable**: Set your own chunk size, chunkOverlap, custom length function, and chunking strategy ('sentence' or 'paragraph').
- **Robust**: Handles strings, arrays, empty input, and edge cases.
- **Rich metadata**: Each chunk includes start/end indices and character positions.
- **100% test coverage**: See `test/chunker.test.ts`.

## Installation

```bash
npm install llm-chunk
# or
pnpm add llm-chunk
```

## Usage

```typescript
import { split, SplitOptions, Chunk } from "llm-chunk";

// Split by paragraph (default)
const paraChunks: Chunk[] = split("Para1\n\nPara2\n\nPara3");

// Split by sentence
const sentChunks: Chunk[] = split("Hello world! How are you? I am fine.", { chunkStrategy: 'sentence' });

// Split a single string by size
const chunks: Chunk[] = split("This is a long text...", { chunkSize: 512 });

// Split an array of strings
const chunksArr: Chunk[] = split(["text1", "text2"], { chunkSize: 256 });

// Split with overlap (sliding window)
const slidingChunks: Chunk[] = split("abcdefghij", { chunkSize: 4, chunkOverlap: 2 });

// Split using a custom length function (e.g., count only vowels)
const customChunks: Chunk[] = split("abcdeiouxyz", {
  chunkSize: 2,
  lengthFunction: (t) => (t.match(/[aeiou]/g) || []).length
});

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
- Returns: Array of `Chunk` objects (see below).

### `Chunk` object
- `chunk`: The chunk string.
- `startIndex`: Index in the input array or unit array where the chunk starts.
- `startPosition`: Character offset in the original string where the chunk starts.
- `endIndex`: Index in the input array or unit array where the chunk ends.
- `endPosition`: Character offset in the original string where the chunk ends (exclusive).

## Testing

```bash
pnpm test
```

## License
MIT
