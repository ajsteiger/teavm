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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import java.util.InputMismatchException;
import java.util.NoSuchElementException;
import java.util.Scanner;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.teavm.junit.TeaVMTestRunner;

@RunWith(TeaVMTestRunner.class)
public class ScannerTest {

    // -----------------------------------------------------------------------
    // Basic token scanning from a String source
    // -----------------------------------------------------------------------

    @Test
    public void scansWhitespaceDelimitedTokens() {
        Scanner sc = new Scanner("hello world foo");
        assertTrue(sc.hasNext());
        assertEquals("hello", sc.next());
        assertTrue(sc.hasNext());
        assertEquals("world", sc.next());
        assertTrue(sc.hasNext());
        assertEquals("foo", sc.next());
        assertFalse(sc.hasNext());
        sc.close();
    }

    @Test
    public void skipsLeadingAndTrailingWhitespace() {
        Scanner sc = new Scanner("  alpha  beta  ");
        assertEquals("alpha", sc.next());
        assertEquals("beta", sc.next());
        assertFalse(sc.hasNext());
        sc.close();
    }

    @Test
    public void scansMultipleLines() {
        Scanner sc = new Scanner("line one\nline two\nline three");
        assertEquals("line", sc.next());
        assertEquals("one", sc.next());
        assertEquals("line", sc.next());
        assertEquals("two", sc.next());
        assertEquals("line", sc.next());
        assertEquals("three", sc.next());
        assertFalse(sc.hasNext());
        sc.close();
    }

    // -----------------------------------------------------------------------
    // Typed reading
    // -----------------------------------------------------------------------

    @Test
    public void readsIntegers() {
        Scanner sc = new Scanner("1 22 333");
        assertTrue(sc.hasNextInt());
        assertEquals(1, sc.nextInt());
        assertEquals(22, sc.nextInt());
        assertEquals(333, sc.nextInt());
        assertFalse(sc.hasNextInt());
        sc.close();
    }

    @Test
    public void readsLongs() {
        Scanner sc = new Scanner("123456789012345 -9876543210");
        assertTrue(sc.hasNextLong());
        assertEquals(123456789012345L, sc.nextLong());
        assertEquals(-9876543210L, sc.nextLong());
        sc.close();
    }

    @Test
    public void readsDoubles() {
        Scanner sc = new Scanner("3.14 -2.5 0.0");
        assertTrue(sc.hasNextDouble());
        assertEquals(3.14, sc.nextDouble(), 1e-10);
        assertEquals(-2.5, sc.nextDouble(), 1e-10);
        assertEquals(0.0, sc.nextDouble(), 1e-10);
        sc.close();
    }

    @Test
    public void readsFloats() {
        Scanner sc = new Scanner("1.5 -0.25");
        assertTrue(sc.hasNextFloat());
        assertEquals(1.5f, sc.nextFloat(), 1e-6f);
        assertEquals(-0.25f, sc.nextFloat(), 1e-6f);
        sc.close();
    }

    @Test
    public void readsBooleans() {
        Scanner sc = new Scanner("true false True FALSE");
        assertTrue(sc.hasNextBoolean());
        assertTrue(sc.nextBoolean());
        assertFalse(sc.nextBoolean());
        assertTrue(sc.nextBoolean());
        assertFalse(sc.nextBoolean());
        sc.close();
    }

    @Test
    public void hasNextIntReturnsFalseForNonInt() {
        Scanner sc = new Scanner("hello 42");
        assertFalse(sc.hasNextInt());
        assertEquals("hello", sc.next());
        assertTrue(sc.hasNextInt());
        assertEquals(42, sc.nextInt());
        sc.close();
    }

    // -----------------------------------------------------------------------
    // Line reading
    // -----------------------------------------------------------------------

    @Test
    public void readsLines() {
        Scanner sc = new Scanner("first line\nsecond line\nthird");
        assertTrue(sc.hasNextLine());
        assertEquals("first line", sc.nextLine());
        assertTrue(sc.hasNextLine());
        assertEquals("second line", sc.nextLine());
        assertTrue(sc.hasNextLine());
        assertEquals("third", sc.nextLine());
        assertFalse(sc.hasNextLine());
        sc.close();
    }

    @Test
    public void readsEmptyLines() {
        Scanner sc = new Scanner("a\n\nb");
        assertEquals("a", sc.nextLine());
        assertEquals("", sc.nextLine());
        assertEquals("b", sc.nextLine());
        sc.close();
    }

    @Test
    public void readsSingleLineWithNoNewline() {
        Scanner sc = new Scanner("just one line");
        assertTrue(sc.hasNextLine());
        assertEquals("just one line", sc.nextLine());
        assertFalse(sc.hasNextLine());
        sc.close();
    }

    // -----------------------------------------------------------------------
    // Mixed token + line reading
    // -----------------------------------------------------------------------

    @Test
    public void mixedTokenThenLineReading() {
        Scanner sc = new Scanner("42 rest of line\nnext line");
        assertEquals(42, sc.nextInt());
        // nextLine() should return the remainder after "42"
        assertEquals(" rest of line", sc.nextLine());
        assertEquals("next line", sc.nextLine());
        sc.close();
    }

    @Test
    public void nextLineAfterFullyConsumingALine() {
        Scanner sc = new Scanner("a b\nc d");
        assertEquals("a", sc.next());
        assertEquals("b", sc.next());
        // Both tokens on first line consumed; nextLine returns the empty
        // remainder of the first line (nothing between "b" and the newline),
        // just like real java.util.Scanner.
        assertEquals("", sc.nextLine());
        // The next call advances to the second line.
        assertEquals("c d", sc.nextLine());
        sc.close();
    }

    // -----------------------------------------------------------------------
    // Empty / edge cases
    // -----------------------------------------------------------------------

    @Test
    public void emptyStringHasNoTokens() {
        Scanner sc = new Scanner("");
        assertFalse(sc.hasNext());
        assertFalse(sc.hasNextLine());
        sc.close();
    }

    @Test
    public void whitespaceOnlyHasNoTokens() {
        Scanner sc = new Scanner("   \n  \n");
        assertFalse(sc.hasNext());
        sc.close();
    }

    @Test(expected = NoSuchElementException.class)
    public void nextThrowsWhenExhausted() {
        Scanner sc = new Scanner("x");
        sc.next();
        sc.next(); // should throw
    }

    @Test(expected = NoSuchElementException.class)
    public void nextLineThrowsWhenExhausted() {
        Scanner sc = new Scanner("x");
        sc.nextLine();
        sc.nextLine(); // should throw
    }

    @Test(expected = InputMismatchException.class)
    public void nextIntThrowsOnMismatch() {
        Scanner sc = new Scanner("notanumber");
        sc.nextInt();
    }

    // -----------------------------------------------------------------------
    // Custom delimiter
    // -----------------------------------------------------------------------

    @Test
    public void customDelimiter() {
        Scanner sc = new Scanner("a,b,c");
        sc.useDelimiter(",");
        assertEquals("a", sc.next());
        assertEquals("b", sc.next());
        assertEquals("c", sc.next());
        assertFalse(sc.hasNext());
        sc.close();
    }

    @Test
    public void customDelimiterRegex() {
        Scanner sc = new Scanner("1::2::3");
        sc.useDelimiter("::");
        assertEquals("1", sc.next());
        assertEquals("2", sc.next());
        assertEquals("3", sc.next());
        sc.close();
    }

    // -----------------------------------------------------------------------
    // InputStream constructor (using System.in-like byte stream)
    // -----------------------------------------------------------------------

    @Test
    public void constructFromInputStream() {
        byte[] bytes = "hello 42\n".getBytes();
        Scanner sc = new Scanner(new java.io.ByteArrayInputStream(bytes));
        assertEquals("hello", sc.next());
        assertEquals(42, sc.nextInt());
        sc.close();
    }
}
