/*
 *  Copyright 2026 Alexey Andreev.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package org.teavm.classlib.java.util;

import java.io.FileNotFoundException;
import java.io.IOException;
import org.teavm.classlib.java.io.TBufferedReader;
import org.teavm.classlib.java.io.TFile;
import org.teavm.classlib.java.io.TFileInputStream;
import org.teavm.classlib.java.io.TInputStream;
import org.teavm.classlib.java.io.TInputStreamReader;
import org.teavm.classlib.java.io.TReader;
import org.teavm.classlib.java.io.TStringReader;
import org.teavm.classlib.java.io.TUncheckedIOException;
import org.teavm.classlib.java.lang.TIllegalStateException;
import org.teavm.classlib.java.lang.TString;
import org.teavm.classlib.java.lang.TUnsupportedOperationException;

/**
 * A minimal implementation of {@code java.util.Scanner} sufficient for simple
 * whitespace-delimited token scanning and line-by-line reading.
 *
 * <p>This is an intentionally simplified ("unfaithful") implementation that
 * covers the most common use-cases:</p>
 * <ul>
 *   <li>Reading tokens (words, ints, longs, doubles, floats) separated by
 *       whitespace from an {@code InputStream}, a {@code Reader}, a
 *       {@code String}, or a {@code File}.</li>
 *   <li>Reading whole lines via {@link #nextLine()}.</li>
 *   <li>Custom single-string delimiters via {@link #useDelimiter(String)}.</li>
 * </ul>
 *
 * <p>Known limitations compared to {@code java.util.Scanner}:</p>
 * <ul>
 *   <li>Locale-sensitive number parsing is not supported; numbers are parsed
 *       with {@link Integer#parseInt}/{@link Double#parseDouble}.</li>
 *   <li>Regex-based delimiter matching uses {@link String#split}, so
 *       back-references and some advanced patterns may behave differently.</li>
 *   <li>After consuming tokens from a line, {@link #nextLine()} returns the
 *       portion of that line following the last consumed token, with leading
 *       whitespace stripped.</li>
 * </ul>
 */
public class TScanner implements TIterator<String> {

    private TBufferedReader reader;
    private boolean closed;
    private boolean eof;

    /**
     * The current input line being tokenised, or {@code null} if we need to
     * read a fresh line before producing the next token.
     */
    private String currentLine;

    /**
     * Offset into {@link #currentLine} of the next character to examine.
     * Invariant: either {@code currentLine == null} or
     * {@code 0 <= pos <= currentLine.length()}.
     */
    private int pos;

    /**
     * Regex used to split a line into tokens (default: one-or-more whitespace
     * characters).
     */
    private String delimiterRegex = "\\s+";

    // -----------------------------------------------------------------------
    // Constructors
    // -----------------------------------------------------------------------

    public TScanner(TInputStream source) {
        this(new TInputStreamReader(source));
    }

    public TScanner(TReader source) {
        this(source instanceof TBufferedReader
                ? (TBufferedReader) source
                : new TBufferedReader(source));
    }

    public TScanner(TString source) {
        this(new TStringReader(source));
    }

    public TScanner(TFile source) throws FileNotFoundException {
        // TFileInputStream extends java.io.InputStream at host-javac time but
        // maps to TInputStream in TeaVM's output; the cast via Object satisfies
        // the host compiler while remaining valid in the compiled artefact.
        this((TInputStream) (Object) new TFileInputStream(source));
    }

    private TScanner(TBufferedReader bufferedReader) {
        this.reader = bufferedReader;
    }

    // -----------------------------------------------------------------------
    // Configuration
    // -----------------------------------------------------------------------

    /**
     * Sets the delimiter pattern used to separate tokens.  The argument is
     * treated as a regex passed to {@link String#split(String)}.
     *
     * @param pattern the delimiter regex
     * @return this scanner (for chaining)
     */
    public TScanner useDelimiter(String pattern) {
        this.delimiterRegex = pattern;
        return this;
    }

    // -----------------------------------------------------------------------
    // hasNext / next (token-based)
    // -----------------------------------------------------------------------

    @Override
    public boolean hasNext() {
        requireOpen();
        return peekNextToken() != null;
    }

    @Override
    public String next() {
        requireOpen();
        String token = consumeNextToken();
        if (token == null) {
            throw new TNoSuchElementException();
        }
        return token;
    }

    public boolean hasNext(String pattern) {
        requireOpen();
        String token = peekNextToken();
        return token != null && token.matches(pattern);
    }

    // -----------------------------------------------------------------------
    // nextLine / hasNextLine
    // -----------------------------------------------------------------------

    public boolean hasNextLine() {
        requireOpen();
        if (currentLine != null) {
            return true;
        }
        return !eof && tryReadNextLine();
    }

    /**
     * Returns the rest of the current input line, advancing past the line
     * terminator.
     *
     * <p>If some tokens from the current line have already been consumed, the
     * returned string is the remainder of that line after the last consumed
     * token (leading whitespace stripped).  Otherwise a whole new line is
     * returned.</p>
     */
    public String nextLine() {
        requireOpen();
        if (currentLine != null) {
            // Return whatever is left of the current line.
            String result = currentLine.substring(pos);
            currentLine = null;
            pos = 0;
            return result;
        }
        if (eof) {
            throw new TNoSuchElementException();
        }
        // Read a fresh line.
        String line = readLineFromReader();
        if (line == null) {
            throw new TNoSuchElementException();
        }
        return line;
    }

    // -----------------------------------------------------------------------
    // Typed token reading
    // -----------------------------------------------------------------------

    public boolean hasNextInt() {
        requireOpen();
        String token = peekNextToken();
        if (token == null) {
            return false;
        }
        try {
            Integer.parseInt(token);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public int nextInt() {
        requireOpen();
        String token = consumeNextToken();
        if (token == null) {
            throw new TNoSuchElementException();
        }
        try {
            return Integer.parseInt(token);
        } catch (NumberFormatException e) {
            throw new TInputMismatchException(token);
        }
    }

    public boolean hasNextLong() {
        requireOpen();
        String token = peekNextToken();
        if (token == null) {
            return false;
        }
        try {
            Long.parseLong(token);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public long nextLong() {
        requireOpen();
        String token = consumeNextToken();
        if (token == null) {
            throw new TNoSuchElementException();
        }
        try {
            return Long.parseLong(token);
        } catch (NumberFormatException e) {
            throw new TInputMismatchException(token);
        }
    }

    public boolean hasNextDouble() {
        requireOpen();
        String token = peekNextToken();
        if (token == null) {
            return false;
        }
        try {
            Double.parseDouble(token);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public double nextDouble() {
        requireOpen();
        String token = consumeNextToken();
        if (token == null) {
            throw new TNoSuchElementException();
        }
        try {
            return Double.parseDouble(token);
        } catch (NumberFormatException e) {
            throw new TInputMismatchException(token);
        }
    }

    public boolean hasNextFloat() {
        requireOpen();
        String token = peekNextToken();
        if (token == null) {
            return false;
        }
        try {
            Float.parseFloat(token);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public float nextFloat() {
        requireOpen();
        String token = consumeNextToken();
        if (token == null) {
            throw new TNoSuchElementException();
        }
        try {
            return Float.parseFloat(token);
        } catch (NumberFormatException e) {
            throw new TInputMismatchException(token);
        }
    }

    public boolean hasNextBoolean() {
        requireOpen();
        String token = peekNextToken();
        return token != null && (token.equalsIgnoreCase("true") || token.equalsIgnoreCase("false"));
    }

    public boolean nextBoolean() {
        requireOpen();
        String token = consumeNextToken();
        if (token == null) {
            throw new TNoSuchElementException();
        }
        if (token.equalsIgnoreCase("true")) {
            return true;
        } else if (token.equalsIgnoreCase("false")) {
            return false;
        }
        throw new TInputMismatchException(token);
    }

    // -----------------------------------------------------------------------
    // Closeable / Iterator
    // -----------------------------------------------------------------------

    public void close() {
        if (closed) {
            return;
        }
        closed = true;
        try {
            reader.close();
        } catch (IOException e) {
            throw new TUncheckedIOException(e);
        }
    }

    @Override
    public void remove() {
        throw new TUnsupportedOperationException();
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    private void requireOpen() {
        if (closed) {
            throw new TIllegalStateException("Scanner closed");
        }
    }

    /**
     * Peeks at the next token without consuming it.
     * Returns {@code null} if there are no more tokens.
     */
    private String peekNextToken() {
        ensureCurrentLineHasToken();
        if (currentLine == null) {
            return null;
        }
        // Find start of next token (skip delimiter chars).
        int start = skipDelimiters(currentLine, pos);
        if (start == currentLine.length()) {
            return null;
        }
        // Find end of token.
        int end = findDelimiter(currentLine, start);
        return currentLine.substring(start, end);
    }

    /**
     * Consumes and returns the next token, advancing the internal position.
     * Returns {@code null} if there are no more tokens.
     */
    private String consumeNextToken() {
        ensureCurrentLineHasToken();
        if (currentLine == null) {
            return null;
        }
        int start = skipDelimiters(currentLine, pos);
        if (start == currentLine.length()) {
            return null;
        }
        int end = findDelimiter(currentLine, start);
        String token = currentLine.substring(start, end);
        pos = end;
        return token;
    }

    /**
     * Ensures {@link #currentLine} is non-{@code null} and positioned such
     * that at least one non-delimiter character is reachable (possibly on a
     * subsequent line). If no more tokens exist in the entire input,
     * {@code currentLine} is set to {@code null}.
     */
    private void ensureCurrentLineHasToken() {
        while (true) {
            if (currentLine != null) {
                int start = skipDelimiters(currentLine, pos);
                if (start < currentLine.length()) {
                    // There is a token on the current line.
                    return;
                }
                // Current line exhausted; move on.
                currentLine = null;
                pos = 0;
            }
            if (eof) {
                return;
            }
            if (!tryReadNextLine()) {
                return;
            }
        }
    }

    /**
     * Attempts to read the next line from the underlying reader, storing it
     * in {@link #currentLine} with {@link #pos} = 0.
     *
     * @return {@code true} if a line was read; {@code false} on EOF
     */
    private boolean tryReadNextLine() {
        String line = readLineFromReader();
        if (line == null) {
            eof = true;
            return false;
        }
        currentLine = line;
        pos = 0;
        return true;
    }

    /** Reads a raw line from the underlying BufferedReader. */
    private String readLineFromReader() {
        try {
            return reader.readLine();
        } catch (IOException e) {
            throw new TUncheckedIOException(e);
        }
    }

    /**
     * Returns the index of the first non-delimiter character at or after
     * {@code from} in {@code line}, or {@code line.length()} if none exists.
     *
     * <p>For the default whitespace delimiter this avoids creating a regex
     * split result; for custom delimiters a split is performed.</p>
     */
    private int skipDelimiters(String line, int from) {
        if (isDefaultDelimiter()) {
            int i = from;
            while (i < line.length() && Character.isWhitespace(line.charAt(i))) {
                i++;
            }
            return i;
        }
        // For non-default delimiters: find the first token start >= from.
        String[] parts = line.split(delimiterRegex, -1);
        int offset = 0;
        for (String part : parts) {
            if (offset + part.length() > from && offset >= from) {
                return offset;
            }
            // Skip part and the delimiter.
            offset += part.length();
            if (offset < line.length()) {
                // advance past delimiter
                int nextOffset = findNextNonDelimiter(line, offset);
                offset = nextOffset;
            }
        }
        return line.length();
    }

    /**
     * Returns the index of the first delimiter character at or after
     * {@code from} in {@code line}, or {@code line.length()} if none exists.
     */
    private int findDelimiter(String line, int from) {
        if (isDefaultDelimiter()) {
            int i = from;
            while (i < line.length() && !Character.isWhitespace(line.charAt(i))) {
                i++;
            }
            return i;
        }
        // Non-default: find where the current token ends by splitting.
        String rest = line.substring(from);
        String[] parts = rest.split(delimiterRegex, 2);
        return from + parts[0].length();
    }

    private int findNextNonDelimiter(String line, int from) {
        String rest = line.substring(from);
        String[] parts = rest.split(delimiterRegex, 2);
        if (parts.length < 2) {
            return line.length();
        }
        return from + (rest.length() - parts[1].length());
    }

    private boolean isDefaultDelimiter() {
        return "\\s+".equals(delimiterRegex);
    }
}
