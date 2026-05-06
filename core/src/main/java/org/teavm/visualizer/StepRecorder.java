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
package org.teavm.visualizer;

/**
 * <p>Runtime recorder used by the pure-browser Java visualizer.</p>
 *
 * <p>This class is compiled <em>alongside</em> user code inside the {@code compiler.wasm}
 * pipeline. Each static method is wired to a matching JavaScript callback via
 * {@code @JSBody} (or the equivalent Wasm GC import). The JS callback is defined
 * in {@code worker.js} and routes events into the trace array rendered by
 * {@code visualizer.js}.</p>
 *
 * <p>NOTE: This source file is also published as a resource so that the teavm-javac
 * integration can inject it as an additional source file when {@code generateVisualizer()}
 * is invoked on the {@code Compiler} object exposed by {@code compiler.wasm}.</p>
 *
 * <p>A step-limit guard ({@link #MAX_STEPS}) prevents infinite loops from exhausting
 * browser memory. When the limit is reached the trace is marked as truncated and
 * no further steps are recorded.</p>
 */
public final class StepRecorder {
    /** Maximum number of steps that will be recorded before truncation. */
    public static final int MAX_STEPS = 10_000;

    private static int stepCount;
    private static boolean truncated;

    private StepRecorder() {
    }

    /**
     * Called by instrumented code at the start of each distinct source line.
     *
     * @param className  binary class name of the enclosing class
     * @param methodName simple name of the enclosing method
     * @param line       1-based source-line number
     */
    public static void step(String className, String methodName, int line) {
        if (truncated) {
            return;
        }
        if (stepCount >= MAX_STEPS) {
            truncated = true;
            jsStepLimitReached();
            return;
        }
        stepCount++;
        jsStep(className, methodName, line);
    }

    /**
     * Called by instrumented code on method entry.
     *
     * @param className  binary class name
     * @param methodName simple method name
     */
    public static void enterMethod(String className, String methodName) {
        if (!truncated) {
            jsEnterMethod(className, methodName);
        }
    }

    /**
     * Called by instrumented code on method exit (before every {@code return}).
     */
    public static void exitMethod() {
        if (!truncated) {
            jsExitMethod();
        }
    }

    /**
     * Called by instrumented code to capture a named local variable at the current step.
     * The value is converted to a string; reference types show their
     * {@link Object#toString()} representation.
     *
     * @param name  Java variable name (from the local-variable table)
     * @param value current value (may be {@code null})
     */
    public static void captureVar(String name, Object value) {
        if (!truncated) {
            jsCaptureVar(name, value == null ? "null" : value.toString());
        }
    }

    /** Returns whether the step limit has been exceeded. */
    public static boolean isTruncated() {
        return truncated;
    }

    /** Returns the number of steps recorded so far. */
    public static int getStepCount() {
        return stepCount;
    }

    // -----------------------------------------------------------------
    // JS-interop stubs (replaced by @JSBody / Wasm-GC import at build
    // time; provided here as no-op defaults so the class compiles on
    // the host JVM for unit-testing the transformer).
    // -----------------------------------------------------------------

    static void jsStep(String className, String methodName, int line) {
        // replaced by JS interop at compile time
    }

    static void jsEnterMethod(String className, String methodName) {
        // replaced by JS interop at compile time
    }

    static void jsExitMethod() {
        // replaced by JS interop at compile time
    }

    static void jsCaptureVar(String name, String value) {
        // replaced by JS interop at compile time
    }

    static void jsStepLimitReached() {
        // replaced by JS interop at compile time
    }
}
