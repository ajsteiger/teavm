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
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;
import org.teavm.model.BasicBlock;
import org.teavm.model.ClassHolder;
import org.teavm.model.ElementModifier;
import org.teavm.model.Instruction;
import org.teavm.model.MethodDescriptor;
import org.teavm.model.MethodHolder;
import org.teavm.model.Program;
import org.teavm.model.TextLocation;
import org.teavm.model.ValueType;
import org.teavm.model.Variable;
import org.teavm.model.instructions.EmptyInstruction;
import org.teavm.model.instructions.ExitInstruction;
import org.teavm.model.instructions.IntegerConstantInstruction;
import org.teavm.model.instructions.InvocationType;
import org.teavm.model.instructions.InvokeInstruction;
import org.teavm.model.instructions.StringConstantInstruction;

/**
 * Unit tests for {@link StepInstrumentationTransformer}.
 *
 * <p>Each test builds a {@link Program} with {@link TextLocation}s assigned to
 * instructions, applies the transformer, and then inspects the generated
 * {@link InvokeInstruction}s that call into {@link StepRecorder}.</p>
 *
 * <p>The {@code ClassHolderTransformerContext} parameter is {@code null} in all
 * tests because the transformer never reads it.</p>
 */
public class StepInstrumentationTransformerTest {

    private static final String RECORDER = "org.teavm.visualizer.StepRecorder";
    private static final String ENTER_METHOD = "enterMethod";
    private static final String STEP_METHOD = "step";
    private static final String EXIT_METHOD = "exitMethod";

    // ------------------------------------------------------------------
    //  Filtering
    // ------------------------------------------------------------------

    @Test
    public void transformClass_nonMatchingPrefix_leavesMethodUnchanged() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("com.example.");
        ClassHolder cls = makeClass("com.other.Foo");
        MethodHolder method = makeMethod(cls, "main", makeSimpleProgram(5));

        int before = method.getProgram().basicBlockAt(0).instructionCount();
        transformer.transformClass(cls, null);
        assertEquals(before, method.getProgram().basicBlockAt(0).instructionCount());
    }

    @Test
    public void transformClass_recorderClassItself_isSkipped() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer(RECORDER);
        ClassHolder cls = makeClass(RECORDER);
        MethodHolder method = makeMethod(cls, "step", makeSimpleProgram(1));

        int before = method.getProgram().basicBlockAt(0).instructionCount();
        transformer.transformClass(cls, null);
        assertEquals(before, method.getProgram().basicBlockAt(0).instructionCount());
    }

    @Test
    public void transformClass_matchingPrefixByPackage_isInstrumented() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("com.example.");
        ClassHolder cls = makeClass("com.example.Main");
        makeMethod(cls, "main", makeSimpleProgram(10));

        transformer.transformClass(cls, null);
        List<String> targets = collectInvokeTargetNames(programOf(cls, "main"));
        assertContains(targets, ENTER_METHOD);
    }

    @Test
    public void transformClass_matchingExactClassName_isInstrumented() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("Main");
        ClassHolder cls = makeClass("Main");
        makeMethod(cls, "run", makeSimpleProgram(3));

        transformer.transformClass(cls, null);
        assertContains(collectInvokeTargetNames(programOf(cls, "run")), ENTER_METHOD);
    }

    // ------------------------------------------------------------------
    //  Method-level skipping
    // ------------------------------------------------------------------

    @Test
    public void transformClass_methodWithNullProgram_isSkipped() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("Foo");
        ClassHolder cls = makeClass("Foo");
        MethodHolder method = new MethodHolder("noBody", ValueType.VOID);
        method.getModifiers().add(ElementModifier.ABSTRACT);
        cls.addMethod(method);

        // Must not throw; method has no program
        transformer.transformClass(cls, null);
        assertNull(method.getProgram());
    }

    @Test
    public void transformClass_methodWithNoSourceInfo_isNotInstrumented() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("Foo");
        ClassHolder cls = makeClass("Foo");
        // Build a program whose instructions carry no TextLocation
        Program program = new Program();
        BasicBlock block = program.createBasicBlock();
        block.add(new ExitInstruction());
        MethodHolder method = makeMethod(cls, "doIt", program);

        int before = block.instructionCount();
        transformer.transformClass(cls, null);
        assertEquals("No source info → no instrumentation", before, block.instructionCount());
    }

    // ------------------------------------------------------------------
    //  enterMethod insertion
    // ------------------------------------------------------------------

    @Test
    public void instrumentedMethod_firstCallIsEnterMethod() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(7));
        List<InvokeInstruction> invokes = collectRecorderInvokes(programOf(cls, "main"));
        assertEquals(ENTER_METHOD, invokes.get(0).getMethod().getName());
    }

    @Test
    public void enterMethodCall_hasNoInstance() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(7));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), ENTER_METHOD);
        assertNotNull(invoke);
        assertNull("Static call must have no instance", invoke.getInstance());
    }

    @Test
    public void enterMethodCall_invocationTypeIsSpecial() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(7));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), ENTER_METHOD);
        assertNotNull(invoke);
        assertSame(InvocationType.SPECIAL, invoke.getType());
    }

    @Test
    public void enterMethodCall_hasTwoStringArgs_classNameAndMethodName() {
        ClassHolder cls = instrument("com.example.Foo", "doWork", makeSimpleProgram(3));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "doWork"), ENTER_METHOD);
        assertNotNull(invoke);
        assertEquals(2, invoke.getArguments().size());

        String className = stringConstBefore(invoke, 2);
        String methodName = stringConstBefore(invoke, 1);
        assertEquals("com.example.Foo", className);
        assertEquals("doWork", methodName);
    }

    // ------------------------------------------------------------------
    //  step() insertion
    // ------------------------------------------------------------------

    @Test
    public void oneSourceLine_exactlyOneStepCall() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        long stepCalls = countRecorderInvokeNamed(programOf(cls, "main"), STEP_METHOD);
        assertEquals(1, stepCalls);
    }

    @Test
    public void stepCall_invocationTypeIsSpecial() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), STEP_METHOD);
        assertNotNull(invoke);
        assertSame(InvocationType.SPECIAL, invoke.getType());
    }

    @Test
    public void stepCall_hasNoInstance() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), STEP_METHOD);
        assertNotNull(invoke);
        assertNull(invoke.getInstance());
    }

    @Test
    public void stepCall_hasThreeArgs_classMethodLine() {
        ClassHolder cls = instrument("Main", "run", makeSimpleProgram(42));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "run"), STEP_METHOD);
        assertNotNull(invoke);
        assertEquals(3, invoke.getArguments().size());

        String className = stringConstBefore(invoke, 3);
        String methodName = stringConstBefore(invoke, 2);
        int line = intConstBefore(invoke, 1);
        assertEquals("Main", className);
        assertEquals("run", methodName);
        assertEquals(42, line);
    }

    @Test
    public void twoDistinctSourceLines_twoStepCalls() {
        Program program = makeProgramWithLines(5, 6);
        ClassHolder cls = instrument("Main", "fn", program);
        long stepCalls = countRecorderInvokeNamed(programOf(cls, "fn"), STEP_METHOD);
        assertEquals(2, stepCalls);
    }

    @Test
    public void threeDistinctSourceLines_threeStepCalls() {
        Program program = makeProgramWithLines(1, 2, 3);
        ClassHolder cls = instrument("Main", "fn", program);
        long stepCalls = countRecorderInvokeNamed(programOf(cls, "fn"), STEP_METHOD);
        assertEquals(3, stepCalls);
    }

    @Test
    public void repeatedSourceLine_onlyOneStepCallForThatLine() {
        // Two instructions at the same line → only one step
        Program program = new Program();
        BasicBlock block = program.createBasicBlock();
        TextLocation loc = new TextLocation("Main.java", 10);
        EmptyInstruction e1 = new EmptyInstruction();
        e1.setLocation(loc);
        EmptyInstruction e2 = new EmptyInstruction();
        e2.setLocation(loc);
        block.add(e1);
        block.add(e2);
        block.add(new ExitInstruction());

        ClassHolder cls = instrument("Main", "fn", program);
        long stepCalls = countRecorderInvokeNamed(programOf(cls, "fn"), STEP_METHOD);
        assertEquals(1, stepCalls);
    }

    @Test
    public void inlinedLocation_notTreatedAsNewLine() {
        // An instruction whose TextLocation has a non-null inlining is ignored by
        // the step-tracking logic (it belongs to an inlined call, not the outer method).
        Program program = new Program();
        BasicBlock block = program.createBasicBlock();

        // "Outer" instruction at line 5
        EmptyInstruction outer = new EmptyInstruction();
        outer.setLocation(new TextLocation("Main.java", 5));
        block.add(outer);

        // "Inlined" instruction: same file/line but has inlining info
        EmptyInstruction inlined = new EmptyInstruction();
        // Construct an instruction whose location has a non-null inlining level.
        // We reuse the existing TextLocation constructor.
        org.teavm.model.InliningInfo inliningInfo = new org.teavm.model.InliningInfo(
                new org.teavm.model.MethodReference("com.other.Lib", "helper", ValueType.VOID),
                "Lib.java", 100, null);
        inlined.setLocation(new TextLocation("Main.java", 5, inliningInfo));
        block.add(inlined);

        block.add(new ExitInstruction());

        ClassHolder cls = instrument("Main", "fn", program);
        // Outer insn at line 5 → 1 step; inlined location → does not add a second step
        long stepCalls = countRecorderInvokeNamed(programOf(cls, "fn"), STEP_METHOD);
        assertEquals(1, stepCalls);
    }

    // ------------------------------------------------------------------
    //  exitMethod() insertion
    // ------------------------------------------------------------------

    @Test
    public void singleReturn_oneExitMethodCall() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        long exits = countRecorderInvokeNamed(programOf(cls, "main"), EXIT_METHOD);
        assertEquals(1, exits);
    }

    @Test
    public void exitMethodCall_invocationTypeIsSpecial() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), EXIT_METHOD);
        assertNotNull(invoke);
        assertSame(InvocationType.SPECIAL, invoke.getType());
    }

    @Test
    public void exitMethodCall_hasNoInstance() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), EXIT_METHOD);
        assertNotNull(invoke);
        assertNull(invoke.getInstance());
    }

    @Test
    public void exitMethodCall_hasZeroArgs() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        InvokeInstruction invoke = firstRecorderInvokeNamed(programOf(cls, "main"), EXIT_METHOD);
        assertNotNull(invoke);
        assertEquals(0, invoke.getArguments().size());
    }

    @Test
    public void exitMethodCall_immediatelyPrecedesExitInstruction() {
        ClassHolder cls = instrument("Main", "main", makeSimpleProgram(5));
        Program program = programOf(cls, "main");

        for (int bi = 0; bi < program.basicBlockCount(); bi++) {
            BasicBlock block = program.basicBlockAt(bi);
            for (Instruction insn = block.getFirstInstruction(); insn != null; insn = insn.getNext()) {
                if (insn instanceof ExitInstruction) {
                    Instruction prev = insn.getPrevious();
                    assertNotNull("ExitInstruction must be preceded by a call", prev);
                    assertEquals("exitMethod call must come right before ExitInstruction",
                            EXIT_METHOD,
                            ((InvokeInstruction) prev).getMethod().getName());
                }
            }
        }
    }

    @Test
    public void multipleReturnBlocks_eachGetsExitMethodCall() {
        // Two blocks each ending with an ExitInstruction
        Program program = new Program();
        BasicBlock b0 = program.createBasicBlock();
        BasicBlock b1 = program.createBasicBlock();

        EmptyInstruction e0 = new EmptyInstruction();
        e0.setLocation(new TextLocation("Main.java", 3));
        b0.add(e0);
        b0.add(new ExitInstruction());

        EmptyInstruction e1 = new EmptyInstruction();
        e1.setLocation(new TextLocation("Main.java", 7));
        b1.add(e1);
        b1.add(new ExitInstruction());

        ClassHolder cls = instrument("Main", "fn", program);
        long exits = countRecorderInvokeNamed(programOf(cls, "fn"), EXIT_METHOD);
        assertEquals(2, exits);
    }

    // ------------------------------------------------------------------
    //  Ordering: enterMethod → step → original instruction → exitMethod → ExitInstruction
    // ------------------------------------------------------------------

    @Test
    public void callOrder_enterMethod_step_exitMethod() {
        ClassHolder cls = instrument("Main", "fn", makeSimpleProgram(10));
        List<String> names = collectInvokeTargetNames(programOf(cls, "fn"));
        // All three recorder calls must appear in this relative order
        int enterIdx = names.indexOf(ENTER_METHOD);
        int stepIdx  = names.indexOf(STEP_METHOD);
        int exitIdx  = names.indexOf(EXIT_METHOD);
        assertNotNull("enterMethod not found", enterIdx >= 0 ? Boolean.TRUE : null);
        assertNotNull("step not found",       stepIdx  >= 0 ? Boolean.TRUE : null);
        assertNotNull("exitMethod not found", exitIdx  >= 0 ? Boolean.TRUE : null);
        assertTrue("enterMethod must come before step",       enterIdx < stepIdx);
        assertTrue("step must come before exitMethod",        stepIdx  < exitIdx);
    }

    // ------------------------------------------------------------------
    //  Multiple methods in the same class
    // ------------------------------------------------------------------

    @Test
    public void multipleMethodsInSameClass_eachIsInstrumented() {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("Main");
        ClassHolder cls = makeClass("Main");
        makeMethod(cls, "alpha", makeSimpleProgram(1));
        makeMethod(cls, "beta",  makeSimpleProgram(2));

        transformer.transformClass(cls, null);

        assertContains(collectInvokeTargetNames(programOf(cls, "alpha")), ENTER_METHOD);
        assertContains(collectInvokeTargetNames(programOf(cls, "beta")),  ENTER_METHOD);
    }

    // ------------------------------------------------------------------
    //  captureVar() insertion for named parameters
    // ------------------------------------------------------------------

    private static final String CAPTURE_VAR_METHOD = "captureVar";

    @Test
    public void namedIntParam_captureVarCalledAfterStep() {
        ClassHolder cls = instrumentWithNamedParam("Main", "compute",
                "n", ValueType.INTEGER, true, makeSimpleProgram(5));
        long captures = countRecorderInvokeNamed(
                programOf(cls, "compute", ValueType.INTEGER), CAPTURE_VAR_METHOD);
        assertEquals(1, captures);
    }

    @Test
    public void namedParam_captureVarFollowsStep() {
        ClassHolder cls = instrumentWithNamedParam("Main", "compute",
                "n", ValueType.INTEGER, true, makeSimpleProgram(5));
        Program program = programOf(cls, "compute", ValueType.INTEGER);
        List<String> names = collectInvokeTargetNames(program);
        int stepIdx = names.indexOf(STEP_METHOD);
        int captureIdx = names.indexOf(CAPTURE_VAR_METHOD);
        assertTrue("step must precede captureVar", stepIdx >= 0 && captureIdx > stepIdx);
    }

    @Test
    public void namedParam_captureVarUsesCorrectName() {
        ClassHolder cls = instrumentWithNamedParam("Main", "compute",
                "myParam", ValueType.INTEGER, true, makeSimpleProgram(5));
        Program program = programOf(cls, "compute", ValueType.INTEGER);
        InvokeInstruction captureInvoke = firstRecorderInvokeNamed(program, CAPTURE_VAR_METHOD);
        assertNotNull(captureInvoke);
        assertEquals(2, captureInvoke.getArguments().size());
        String capturedName = stringConstBefore(captureInvoke, 1);
        assertEquals("myParam", capturedName);
    }

    @Test
    public void twoDistinctLines_captureVarCalledOncePerLine() {
        Program program = makeSimpleProgramWithNamedVar(new int[]{5, 7}, "val", 1);
        ClassHolder cls = instrumentWithNamedParam("Main", "run",
                "val", ValueType.INTEGER, true, program);
        long captures = countRecorderInvokeNamed(
                programOf(cls, "run", ValueType.INTEGER), CAPTURE_VAR_METHOD);
        assertEquals(2, captures);
    }

    @Test
    public void paramWithNoDebugName_noCaptureVarEmitted() {
        // Variable has register=1 (matches the int param SSA index) but no debugName
        Program program = new Program();
        Variable unnamedVar = program.createVariable();
        unnamedVar.setRegister(1);
        // no setDebugName() call → debugName remains null
        BasicBlock block = program.createBasicBlock();
        EmptyInstruction e = new EmptyInstruction();
        e.setLocation(new TextLocation("Main.java", 10));
        block.add(e);
        block.add(new ExitInstruction());

        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("Main");
        ClassHolder cls = makeClass("Main");
        MethodHolder method = new MethodHolder("run", ValueType.INTEGER, ValueType.VOID);
        method.getModifiers().add(ElementModifier.STATIC);
        method.setProgram(program);
        cls.addMethod(method);
        transformer.transformClass(cls, null);

        long captures = countRecorderInvokeNamed(
                programOf(cls, "run", ValueType.INTEGER), CAPTURE_VAR_METHOD);
        assertEquals(0, captures);
    }

    @Test
    public void nonParamVariable_noCaptureVarEmitted() {
        // Variable at register=-1 (no slot mapping) should not be captured
        Program program = new Program();
        Variable unslottedVar = program.createVariable();
        unslottedVar.setRegister(-1);
        unslottedVar.setDebugName("tmp");
        BasicBlock block = program.createBasicBlock();
        EmptyInstruction e = new EmptyInstruction();
        e.setLocation(new TextLocation("Main.java", 3));
        block.add(e);
        block.add(new ExitInstruction());

        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer("Foo");
        ClassHolder cls = makeClass("Foo");
        MethodHolder method = new MethodHolder("go", ValueType.INTEGER, ValueType.VOID);
        method.getModifiers().add(ElementModifier.STATIC);
        method.setProgram(program);
        cls.addMethod(method);
        transformer.transformClass(cls, null);

        long captures = countRecorderInvokeNamed(
                programOf(cls, "go", ValueType.INTEGER), CAPTURE_VAR_METHOD);
        assertEquals(0, captures);
    }

    // ------------------------------------------------------------------
    //  Helpers (extended)
    // ------------------------------------------------------------------

    /**
     * Instruments a class whose named method has one parameter of the given type.
     * The parameter variable is registered with the supplied {@code paramName} so the
     * transformer can find it by debug name.
     */
    private ClassHolder instrumentWithNamedParam(String className, String methodName,
            String paramName, ValueType paramType, boolean isStatic, Program program) {
        // Register a variable for the parameter in the program (if not already present)
        // TeaVM SSA convention: both static and non-static methods have their first
        // declared parameter at variable index / register 1 (slot 0 is always reserved
        // — for 'this' in instance methods, or as a stack-frame placeholder for statics).
        int slot = 1;
        boolean found = false;
        for (int vi = 0; vi < program.variableCount(); vi++) {
            if (program.variableAt(vi).getRegister() == slot) {
                program.variableAt(vi).setDebugName(paramName);
                found = true;
                break;
            }
        }
        if (!found) {
            Variable v = program.createVariable();
            v.setRegister(slot);
            v.setDebugName(paramName);
        }

        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer(className);
        ClassHolder cls = makeClass(className);
        MethodHolder method = new MethodHolder(methodName, paramType, ValueType.VOID);
        if (isStatic) {
            method.getModifiers().add(ElementModifier.STATIC);
        }
        method.setProgram(program);
        cls.addMethod(method);
        transformer.transformClass(cls, null);
        return cls;
    }

    /** Returns the {@link Program} of a method that takes one parameter of {@code paramType}. */
    private Program programOf(ClassHolder cls, String methodName, ValueType paramType) {
        return cls.getMethod(new MethodDescriptor(methodName, paramType, ValueType.VOID)).getProgram();
    }

    /**
     * Program with one variable at the given register/slot and one instruction per line entry.
     */
    private Program makeSimpleProgramWithNamedVar(int[] lines, String debugName, int register) {
        Program program = new Program();
        Variable v = program.createVariable();
        v.setRegister(register);
        v.setDebugName(debugName);
        BasicBlock block = program.createBasicBlock();
        for (int line : lines) {
            EmptyInstruction e = new EmptyInstruction();
            e.setLocation(new TextLocation("Main.java", line));
            block.add(e);
        }
        block.add(new ExitInstruction());
        return program;
    }



    /** Instruments the named method in a freshly-created class. */
    private ClassHolder instrument(String className, String methodName, Program program) {
        StepInstrumentationTransformer transformer = new StepInstrumentationTransformer(className);
        ClassHolder cls = makeClass(className);
        makeMethod(cls, methodName, program);
        transformer.transformClass(cls, null);
        return cls;
    }

    /** Returns the {@link Program} of the named no-arg void method on {@code cls}. */
    private Program programOf(ClassHolder cls, String methodName) {
        return cls.getMethod(new MethodDescriptor(methodName, ValueType.VOID)).getProgram();
    }

    private ClassHolder makeClass(String name) {
        return new ClassHolder(name);
    }

    private MethodHolder makeMethod(ClassHolder cls, String name, Program program) {
        MethodHolder method = new MethodHolder(name, ValueType.VOID);
        method.setProgram(program);
        cls.addMethod(method);
        return method;
    }

    /**
     * Minimal program: one {@link EmptyInstruction} at {@code line}, then
     * an {@link ExitInstruction}, both in block 0.
     */
    private Program makeSimpleProgram(int line) {
        Program program = new Program();
        BasicBlock block = program.createBasicBlock();
        EmptyInstruction e = new EmptyInstruction();
        e.setLocation(new TextLocation("Main.java", line));
        block.add(e);
        block.add(new ExitInstruction());
        return program;
    }

    /**
     * Program whose block 0 has one {@link EmptyInstruction} per {@code line},
     * followed by a final {@link ExitInstruction}.
     */
    private Program makeProgramWithLines(int... lines) {
        Program program = new Program();
        BasicBlock block = program.createBasicBlock();
        for (int line : lines) {
            EmptyInstruction e = new EmptyInstruction();
            e.setLocation(new TextLocation("Main.java", line));
            block.add(e);
        }
        block.add(new ExitInstruction());
        return program;
    }

    /** Returns all {@link InvokeInstruction}s that target {@code StepRecorder}. */
    private List<InvokeInstruction> collectRecorderInvokes(Program program) {
        List<InvokeInstruction> result = new ArrayList<>();
        for (int bi = 0; bi < program.basicBlockCount(); bi++) {
            BasicBlock block = program.basicBlockAt(bi);
            if (block == null) {
                continue;
            }
            for (Instruction insn = block.getFirstInstruction(); insn != null; insn = insn.getNext()) {
                if (insn instanceof InvokeInstruction) {
                    InvokeInstruction invoke = (InvokeInstruction) insn;
                    if (RECORDER.equals(invoke.getMethod().getClassName())) {
                        result.add(invoke);
                    }
                }
            }
        }
        return result;
    }

    /** Returns the simple names of all {@link InvokeInstruction} targets in program order. */
    private List<String> collectInvokeTargetNames(Program program) {
        List<String> names = new ArrayList<>();
        for (InvokeInstruction invoke : collectRecorderInvokes(program)) {
            names.add(invoke.getMethod().getName());
        }
        return names;
    }

    private InvokeInstruction firstRecorderInvokeNamed(Program program, String name) {
        for (InvokeInstruction invoke : collectRecorderInvokes(program)) {
            if (name.equals(invoke.getMethod().getName())) {
                return invoke;
            }
        }
        return null;
    }

    private long countRecorderInvokeNamed(Program program, String name) {
        return collectRecorderInvokes(program).stream()
                .filter(i -> name.equals(i.getMethod().getName()))
                .count();
    }

    /**
     * Walks backwards from {@code invoke} by {@code stepsBack} instructions and
     * returns the {@link StringConstantInstruction#getConstant()} value.
     */
    private String stringConstBefore(InvokeInstruction invoke, int stepsBack) {
        Instruction cursor = invoke;
        for (int i = 0; i < stepsBack; i++) {
            cursor = cursor.getPrevious();
        }
        return ((StringConstantInstruction) cursor).getConstant();
    }

    /**
     * Walks backwards from {@code invoke} by {@code stepsBack} instructions and
     * returns the {@link IntegerConstantInstruction#getConstant()} value.
     */
    private int intConstBefore(InvokeInstruction invoke, int stepsBack) {
        Instruction cursor = invoke;
        for (int i = 0; i < stepsBack; i++) {
            cursor = cursor.getPrevious();
        }
        return ((IntegerConstantInstruction) cursor).getConstant();
    }

    private void assertContains(List<String> list, String value) {
        assertTrue("Expected '" + value + "' in " + list, list.contains(value));
    }
}
