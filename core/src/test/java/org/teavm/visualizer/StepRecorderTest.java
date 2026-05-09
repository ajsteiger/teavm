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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 * Unit tests for {@link StepRecorder}.
 *
 * <p>The JS-interop stubs ({@code jsStep}, {@code jsEnterMethod}, etc.) are
 * package-private no-ops on the host JVM, so the tests focus on the observable
 * state: {@link StepRecorder#getStepCount()}, {@link StepRecorder#isTruncated()},
 * and the MAX_STEPS constant.  Each test resets the recorder via the
 * package-private {@code reset()} helper to guarantee isolation.</p>
 */
public class StepRecorderTest {

    @Before
    public void setUp() {
        StepRecorder.reset();
    }

    @After
    public void tearDown() {
        StepRecorder.reset();
    }

    // ------------------------------------------------------------------
    //  Initial state
    // ------------------------------------------------------------------

    @Test
    public void initialState_stepCountIsZero() {
        assertEquals(0, StepRecorder.getStepCount());
    }

    @Test
    public void initialState_notTruncated() {
        assertFalse(StepRecorder.isTruncated());
    }

    // ------------------------------------------------------------------
    //  step()
    // ------------------------------------------------------------------

    @Test
    public void step_incrementsStepCount() {
        StepRecorder.step("Foo", "bar", 1);
        assertEquals(1, StepRecorder.getStepCount());
    }

    @Test
    public void step_multipleSteps_incrementsEachTime() {
        StepRecorder.step("Foo", "bar", 1);
        StepRecorder.step("Foo", "bar", 2);
        StepRecorder.step("Foo", "bar", 3);
        assertEquals(3, StepRecorder.getStepCount());
    }

    @Test
    public void step_doesNotSetTruncated_belowMaxSteps() {
        StepRecorder.step("Foo", "bar", 1);
        assertFalse(StepRecorder.isTruncated());
    }

    @Test
    public void step_whenAlreadyTruncated_doesNotIncrementCount() {
        // Force truncation first
        for (int i = 0; i < StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        // One more call that triggers truncation
        StepRecorder.step("Foo", "bar", StepRecorder.MAX_STEPS + 1);
        int countAfterTruncation = StepRecorder.getStepCount();
        // Further calls must not change the count
        StepRecorder.step("Foo", "bar", StepRecorder.MAX_STEPS + 2);
        StepRecorder.step("Foo", "bar", StepRecorder.MAX_STEPS + 3);
        assertEquals(countAfterTruncation, StepRecorder.getStepCount());
    }

    @Test
    public void step_atMaxSteps_setsTruncated() {
        for (int i = 0; i < StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        // Exactly at MAX_STEPS the counter is full; the next call truncates
        assertFalse("Should not be truncated before the extra call", StepRecorder.isTruncated());
        StepRecorder.step("Foo", "bar", StepRecorder.MAX_STEPS + 1);
        assertTrue(StepRecorder.isTruncated());
    }

    @Test
    public void step_exactlyMaxStepsCounted() {
        for (int i = 0; i < StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        assertEquals(StepRecorder.MAX_STEPS, StepRecorder.getStepCount());
    }

    // ------------------------------------------------------------------
    //  enterMethod()
    // ------------------------------------------------------------------

    @Test
    public void enterMethod_doesNotIncrementStepCount() {
        StepRecorder.enterMethod("Foo", "bar");
        assertEquals(0, StepRecorder.getStepCount());
    }

    @Test
    public void enterMethod_doesNotSetTruncated() {
        StepRecorder.enterMethod("Foo", "bar");
        assertFalse(StepRecorder.isTruncated());
    }

    @Test
    public void enterMethod_whenTruncated_remainsTruncated() {
        // Force truncation
        for (int i = 0; i <= StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        assertTrue(StepRecorder.isTruncated());
        // enterMethod is a no-op when truncated; state must not change
        StepRecorder.enterMethod("Foo", "bar");
        assertTrue(StepRecorder.isTruncated());
    }

    // ------------------------------------------------------------------
    //  exitMethod()
    // ------------------------------------------------------------------

    @Test
    public void exitMethod_doesNotIncrementStepCount() {
        StepRecorder.exitMethod();
        assertEquals(0, StepRecorder.getStepCount());
    }

    @Test
    public void exitMethod_doesNotSetTruncated() {
        StepRecorder.exitMethod();
        assertFalse(StepRecorder.isTruncated());
    }

    @Test
    public void exitMethod_whenTruncated_remainsTruncated() {
        for (int i = 0; i <= StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        assertTrue(StepRecorder.isTruncated());
        StepRecorder.exitMethod();
        assertTrue(StepRecorder.isTruncated());
    }

    // ------------------------------------------------------------------
    //  captureVar()
    // ------------------------------------------------------------------

    @Test
    public void captureVar_doesNotIncrementStepCount() {
        StepRecorder.captureVar("x", 42);
        assertEquals(0, StepRecorder.getStepCount());
    }

    @Test
    public void captureVar_doesNotSetTruncated() {
        StepRecorder.captureVar("x", "hello");
        assertFalse(StepRecorder.isTruncated());
    }

    @Test
    public void captureVar_nullValue_doesNotThrow() {
        // Must not throw; null is converted to the string "null" before passing to JS stub
        StepRecorder.captureVar("x", null);
    }

    @Test
    public void captureVar_whenTruncated_doesNotThrow() {
        for (int i = 0; i <= StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        StepRecorder.captureVar("x", 99);
    }

    // ------------------------------------------------------------------
    //  reset() (used by tests; verifies the reset helper itself)
    // ------------------------------------------------------------------

    @Test
    public void reset_clearsTruncatedFlag() {
        for (int i = 0; i <= StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        assertTrue(StepRecorder.isTruncated());
        StepRecorder.reset();
        assertFalse(StepRecorder.isTruncated());
    }

    @Test
    public void reset_clearsStepCount() {
        StepRecorder.step("Foo", "bar", 1);
        StepRecorder.step("Foo", "bar", 2);
        assertEquals(2, StepRecorder.getStepCount());
        StepRecorder.reset();
        assertEquals(0, StepRecorder.getStepCount());
    }

    @Test
    public void reset_allowsSteppingAgainAfterTruncation() {
        for (int i = 0; i <= StepRecorder.MAX_STEPS; i++) {
            StepRecorder.step("Foo", "bar", i + 1);
        }
        StepRecorder.reset();
        StepRecorder.step("Foo", "bar", 1);
        assertEquals(1, StepRecorder.getStepCount());
        assertFalse(StepRecorder.isTruncated());
    }

    // ------------------------------------------------------------------
    //  MAX_STEPS constant
    // ------------------------------------------------------------------

    @Test
    public void maxSteps_isPositive() {
        assertTrue(StepRecorder.MAX_STEPS > 0);
    }

    @Test
    public void maxSteps_isAtLeastThousand() {
        assertTrue(StepRecorder.MAX_STEPS >= 1000);
    }
}
