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
package org.teavm.visualizer.fixture;

/**
 * Minimal fixture used by {@link org.teavm.visualizer.VisualizerE2ETest} to exercise the
 * IR-level instrumentation pipeline end-to-end.
 *
 * <p>When compiled via TeaVM with {@code StepInstrumentationTransformer}, the transformer
 * will inject {@code StepRecorder.enterMethod()}, {@code step()}, {@code captureVar()},
 * and {@code exitMethod()} calls.  Running the resulting WebAssembly (or JS) then produces
 * the VIZ protocol on stderr which the test parses and asserts.</p>
 */
public final class FactorialFixture {
    private FactorialFixture() {
    }

    public static int factorial(int n) {
        int result = 1;
        for (int i = 2; i <= n; i++) {
            result = result * i;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(factorial(3));
    }
}
