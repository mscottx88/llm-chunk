import { describe, it, expect } from "vitest";
import { split, type SplitOptions } from "../src/chunker";

describe("split", () => {
  it("should split a single string into correct sizes", () => {
    const input = "abcdefghij";
    expect(split(input, { chunkSize: 3 })).toEqual([
      { chunk: "abc", startIndex: 0, startPosition: 0, endIndex: 2, endPosition: 3 },
      { chunk: "def", startIndex: 3, startPosition: 3, endIndex: 5, endPosition: 6 },
      { chunk: "ghi", startIndex: 6, startPosition: 6, endIndex: 8, endPosition: 9 },
      { chunk: "j", startIndex: 9, startPosition: 9, endIndex: 9, endPosition: 10 }
    ]);
  });

  it("should split an array of strings into correct sizes", () => {
    const input = ["abcde", "fghij"];
    expect(split(input, { chunkSize: 2 })).toEqual([
      { chunk: "ab", startIndex: 0, startPosition: 0, endIndex: 1, endPosition: 2 },
      { chunk: "cd", startIndex: 2, startPosition: 2, endIndex: 3, endPosition: 4 },
      { chunk: "e", startIndex: 4, startPosition: 4, endIndex: 4, endPosition: 5 },
      { chunk: "fg", startIndex: 0, startPosition: 0, endIndex: 1, endPosition: 2 },
      { chunk: "hi", startIndex: 2, startPosition: 2, endIndex: 3, endPosition: 4 },
      { chunk: "j", startIndex: 4, startPosition: 4, endIndex: 4, endPosition: 5 }
    ]);
  });

  it("should return the whole string if smaller than chunk size", () => {
    const input = "abc";
    expect(split(input, { chunkSize: 10 })).toEqual([
      { chunk: "abc", startIndex: 0, startPosition: 0, endIndex: 2, endPosition: 3 }
    ]);
  });

  it("should handle empty string input", () => {
    expect(split("", { chunkSize: 5 })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
  });

  it("should handle empty array input", () => {
    expect(split([], { chunkSize: 5 })).toEqual([]);
  });

  it("should handle empty array input (coverage)", () => {
    expect(split([])).toEqual([]);
  });

  it("should use default chunk size if not provided", () => {
    const input = "a".repeat(600);
    const result = split(input);
    expect(result.length).toBe(2);
    expect(result[0].chunk.length).toBe(512);
    expect(result[1].chunk.length).toBe(88);
  });

  it("should split with overlap (sliding window)", () => {
    const input = "abcdefghij";
    expect(split(input, { chunkSize: 4, chunkOverlap: 2 })).toEqual([
      { chunk: "abcd", startIndex: 0, startPosition: 0, endIndex: 3, endPosition: 4 },
      { chunk: "cdef", startIndex: 2, startPosition: 2, endIndex: 5, endPosition: 6 },
      { chunk: "efgh", startIndex: 4, startPosition: 4, endIndex: 7, endPosition: 8 },
      { chunk: "ghij", startIndex: 6, startPosition: 6, endIndex: 9, endPosition: 10 }
    ]);
  });

  it("should use a custom lengthFunction (count vowels only)", () => {
    const input = "abcdeiouxyz";
    const options: SplitOptions = {
      chunkSize: 2,
      lengthFunction: (t) => (t.match(/[aeiou]/g) || []).length
    };
    expect(split(input, options)).toEqual([
      { chunk: "abcde", startIndex: 0, startPosition: 0, endIndex: 4, endPosition: 5 },
      { chunk: "io", startIndex: 5, startPosition: 5, endIndex: 6, endPosition: 7 },
      { chunk: "uxyz", startIndex: 7, startPosition: 7, endIndex: 10, endPosition: 11 }
    ]);
  });

  it("should handle custom lengthFunction with overlap", () => {
    const input = "aeioubcdfg";
    const options: SplitOptions = {
      chunkSize: 3,
      chunkOverlap: 1,
      lengthFunction: (t) => (t.match(/[aeiou]/g) || []).length
    };
    expect(split(input, options)).toEqual([
      { chunk: "aei", startIndex: 0, startPosition: 0, endIndex: 2, endPosition: 3 },
      { chunk: "iou", startIndex: 2, startPosition: 2, endIndex: 4, endPosition: 5 },
      { chunk: "ubcdfg", startIndex: 4, startPosition: 4, endIndex: 9, endPosition: 10 }
    ]);
  });

  it("should split by paragraph boundaries", () => {
    const input = "Para1 line1\nPara1 line2\n\nPara2 line1\n\nPara3";
    const result = split(input, { chunkSize: 100, chunkStrategy: 'paragraph' });
    expect(result).toEqual([
      { chunk: "Para1 line1\nPara1 line2", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 23 },
      { chunk: "Para2 line1", startIndex: 1, startPosition: 25, endIndex: 1, endPosition: 36 },
      { chunk: "Para3", startIndex: 2, startPosition: 38, endIndex: 2, endPosition: 43 }
    ]);
  });

  it("should split by sentence boundaries", () => {
    const input = "Hello world! How are you? I am fine. This is a test.";
    const result = split(input, { chunkSize: 100, chunkStrategy: 'sentence' });
    expect(result).toEqual([
      { chunk: "Hello world!", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 13 },
      { chunk: "How are you?", startIndex: 1, startPosition: 13, endIndex: 1, endPosition: 26 },
      { chunk: "I am fine.", startIndex: 2, startPosition: 26, endIndex: 2, endPosition: 37 },
      { chunk: "This is a test.", startIndex: 3, startPosition: 37, endIndex: 3, endPosition: 52 }
    ]);
  });

  it("should perform greedy unit-based chunking with overlap (paragraph)", () => {
    const input = "A\n\nB\n\nC\n\nD";
    const result = split(input, { chunkSize: 3, chunkOverlap: 1, chunkStrategy: 'paragraph' });
    expect(result).toEqual([
      { chunk: "A", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 1 },
      { chunk: "B", startIndex: 1, startPosition: 3, endIndex: 1, endPosition: 4 },
      { chunk: "C", startIndex: 2, startPosition: 6, endIndex: 2, endPosition: 7 },
      { chunk: "D", startIndex: 3, startPosition: 9, endIndex: 3, endPosition: 10 }
    ]);
  });

  it("should perform greedy unit-based chunking with overlap (sentence)", () => {
    const input = "A. B. C. D.";
    const result = split(input, { chunkSize: 3, chunkOverlap: 1, chunkStrategy: 'sentence' });
    expect(result).toEqual([
      { chunk: "A.", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 3 },
      { chunk: "B.", startIndex: 1, startPosition: 3, endIndex: 1, endPosition: 6 },
      { chunk: "C.", startIndex: 2, startPosition: 6, endIndex: 2, endPosition: 9 },
      { chunk: "D.", startIndex: 3, startPosition: 9, endIndex: 3, endPosition: 11 }
    ]);
  });

  it("should perform greedy unit-based chunking with overlap and join multiple units (paragraph)", () => {
    const input = "A1\n\nB2\n\nC3\n\nD4";
    const result = split(input, { chunkSize: 6, chunkOverlap: 1, chunkStrategy: 'paragraph' });
    expect(result).toEqual([
      { chunk: "A1\n\nB2", startIndex: 0, startPosition: 0, endIndex: 1, endPosition: 6 },
      { chunk: "B2\n\nC3", startIndex: 1, startPosition: 4, endIndex: 2, endPosition: 10 },
      { chunk: "C3\n\nD4", startIndex: 2, startPosition: 8, endIndex: 3, endPosition: 14 }
    ]);
  });

  it("should perform greedy unit-based chunking with overlap and join multiple units (sentence)", () => {
    const input = "A1. B2. C3. D4.";
    const result = split(input, { chunkSize: 8, chunkOverlap: 1, chunkStrategy: 'sentence' });
    expect(result).toEqual([
      { chunk: "A1. B2.", startIndex: 0, startPosition: 0, endIndex: 1, endPosition: 8 },
      { chunk: "B2. C3.", startIndex: 1, startPosition: 4, endIndex: 2, endPosition: 12 },
      { chunk: "C3. D4.", startIndex: 2, startPosition: 8, endIndex: 3, endPosition: 15 }
    ]);
  });

  it("should handle empty string with chunkStrategy", () => {
    expect(split("", { chunkStrategy: 'paragraph' })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
    expect(split("", { chunkStrategy: 'sentence' })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
  });

  it("should handle array of empty strings with chunkStrategy", () => {
    expect(split(["", ""], { chunkStrategy: 'paragraph' })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 },
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
    expect(split(["", ""], { chunkStrategy: 'sentence' })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 },
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
  });

  it("should handle array of empty strings", () => {
    expect(split(["", ""]))
      .toEqual([
        { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 },
        { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
      ]);
  });

  it("should handle array of empty strings with chunkSize and chunkStrategy", () => {
    expect(split(["", ""], { chunkSize: 5, chunkStrategy: 'paragraph' })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 },
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
    expect(split(["", ""], { chunkSize: 5, chunkStrategy: 'sentence' })).toEqual([
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 },
      { chunk: "", startIndex: 0, startPosition: 0, endIndex: 0, endPosition: 0 }
    ]);
  });
});
