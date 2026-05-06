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

import java.util.ArrayList;
import java.util.List;
import org.teavm.model.BasicBlock;
import org.teavm.model.ClassHolder;
import org.teavm.model.ClassHolderTransformer;
import org.teavm.model.ClassHolderTransformerContext;
import org.teavm.model.Instruction;
import org.teavm.model.MethodHolder;
import org.teavm.model.MethodReference;
import org.teavm.model.Program;
import org.teavm.model.TextLocation;
import org.teavm.model.ValueType;
import org.teavm.model.Variable;
import org.teavm.model.instructions.ExitInstruction;
import org.teavm.model.instructions.IntegerConstantInstruction;
import org.teavm.model.instructions.InvocationType;
import org.teavm.model.instructions.InvokeInstruction;
import org.teavm.model.instructions.StringConstantInstruction;

/**
 * <p>A {@link ClassHolderTransformer} that instruments user code with calls to
 * {@link StepRecorder} so that a pure-browser Java visualizer (PythonTutor-style)
 * can replay execution step by step.</p>
 *
 * <h2>What is inserted</h2>
 * <ul>
 *   <li><strong>Method entry</strong> – a call to
 *       {@code StepRecorder.enterMethod(className, methodName)} is prepended to
 *       the first basic block of every instrumented method.</li>
 *   <li><strong>Source-line steps</strong> – a call to
 *       {@code StepRecorder.step(className, methodName, line)} is inserted
 *       immediately before the first instruction that carries a new source-line
 *       number. Inlined call sites are ignored (only top-level locations are
 *       tracked).</li>
 *   <li><strong>Method exit</strong> – a call to
 *       {@code StepRecorder.exitMethod()} is inserted immediately before every
 *       {@link ExitInstruction} (i.e., before every {@code return}).</li>
 * </ul>
 *
 * <h2>Which classes are instrumented</h2>
 * <p>Only classes whose binary name starts with the {@code targetClassPrefix}
 * supplied to the constructor are instrumented. The {@link StepRecorder} class
 * itself is never instrumented (it would cause infinite recursion).</p>
 *
 * <h2>Integration with teavm-javac</h2>
 * <p>This transformer is intended to be installed in the
 * {@code generateVisualizer()} method of the {@code Compiler} object exposed by
 * {@code compiler.wasm}:</p>
 * <pre>{@code
 * teavm.add(new StepInstrumentationTransformer(mainClass));
 * }</pre>
 * <p>The {@link StepRecorder} class must be reachable from the compiled output
 * (either via the TeaVM classlib archive or by adding its source to the javac
 * compilation step).</p>
 */
public class StepInstrumentationTransformer implements ClassHolderTransformer {
    private static final String RECORDER_CLASS = "org.teavm.visualizer.StepRecorder";

    private final String targetClassPrefix;

    /**
     * Creates a new transformer.
     *
     * @param targetClassPrefix binary class-name prefix of classes to instrument
     *                          (e.g. the user's main class name, or a package prefix
     *                          like {@code "com.example."})
     */
    public StepInstrumentationTransformer(String targetClassPrefix) {
        this.targetClassPrefix = targetClassPrefix;
    }

    @Override
    public void transformClass(ClassHolder cls, ClassHolderTransformerContext context) {
        String name = cls.getName();
        if (!name.startsWith(targetClassPrefix) || name.equals(RECORDER_CLASS)) {
            return;
        }
        for (MethodHolder method : cls.getMethods()) {
            Program program = method.getProgram();
            if (program != null && program.basicBlockCount() > 0 && hasSourceInfo(program)) {
                instrumentMethod(name, method);
            }
        }
    }

    // ----------------------------------------------------------------
    //  Instrumentation logic
    // ----------------------------------------------------------------

    private void instrumentMethod(String className, MethodHolder method) {
        Program program = method.getProgram();
        String methodName = method.getName();

        // Insert enterMethod() at the very start of the method.
        BasicBlock entry = program.basicBlockAt(0);
        Instruction firstInsn = entry.getFirstInstruction();
        if (firstInsn != null) {
            firstInsn.insertPreviousAll(buildEnterMethodCall(program, className, methodName));
        }

        // Walk every block; track the last source line seen so we only
        // emit one step() call per distinct line.
        TextLocation lastLoc = null;
        for (int bi = 0; bi < program.basicBlockCount(); bi++) {
            BasicBlock block = program.basicBlockAt(bi);
            if (block == null) {
                continue;
            }
            Instruction insn = block.getFirstInstruction();
            while (insn != null) {
                Instruction next = insn.getNext();

                if (insn instanceof ExitInstruction) {
                    // Insert exitMethod() before every return.
                    insn.insertPreviousAll(buildExitMethodCall(program));
                } else {
                    TextLocation loc = insn.getLocation();
                    if (loc != null && loc.getLine() > 0
                            && loc.getInlining() == null
                            && !loc.equals(lastLoc)) {
                        lastLoc = loc;
                        insn.insertPreviousAll(buildStepCall(program, className, methodName, loc.getLine()));
                    }
                }

                insn = next;
            }
        }
    }

    // ----------------------------------------------------------------
    //  Instruction builders
    // ----------------------------------------------------------------

    /**
     * Builds: {@code StepRecorder.enterMethod(className, methodName);}
     */
    private List<Instruction> buildEnterMethodCall(Program program, String className, String methodName) {
        List<Instruction> result = new ArrayList<>();
        Variable classNameVar = loadString(program, className, result);
        Variable methodNameVar = loadString(program, methodName, result);

        InvokeInstruction invoke = new InvokeInstruction();
        invoke.setType(InvocationType.SPECIAL);
        invoke.setMethod(new MethodReference(RECORDER_CLASS, "enterMethod",
                ValueType.object("java.lang.String"),
                ValueType.object("java.lang.String"),
                ValueType.VOID));
        invoke.setArguments(classNameVar, methodNameVar);
        result.add(invoke);
        return result;
    }

    /**
     * Builds: {@code StepRecorder.step(className, methodName, line);}
     */
    private List<Instruction> buildStepCall(Program program, String className, String methodName, int line) {
        List<Instruction> result = new ArrayList<>();
        Variable classNameVar = loadString(program, className, result);
        Variable methodNameVar = loadString(program, methodName, result);
        Variable lineVar = loadInt(program, line, result);

        InvokeInstruction invoke = new InvokeInstruction();
        invoke.setType(InvocationType.SPECIAL);
        invoke.setMethod(new MethodReference(RECORDER_CLASS, "step",
                ValueType.object("java.lang.String"),
                ValueType.object("java.lang.String"),
                ValueType.INTEGER,
                ValueType.VOID));
        invoke.setArguments(classNameVar, methodNameVar, lineVar);
        result.add(invoke);
        return result;
    }

    /**
     * Builds: {@code StepRecorder.exitMethod();}
     */
    private List<Instruction> buildExitMethodCall(Program program) {
        List<Instruction> result = new ArrayList<>();

        InvokeInstruction invoke = new InvokeInstruction();
        invoke.setType(InvocationType.SPECIAL);
        invoke.setMethod(new MethodReference(RECORDER_CLASS, "exitMethod", ValueType.VOID));
        result.add(invoke);
        return result;
    }

    // ----------------------------------------------------------------
    //  Helpers
    // ----------------------------------------------------------------

    /** Emits a {@link StringConstantInstruction} and returns the receiver variable. */
    private Variable loadString(Program program, String value, List<Instruction> out) {
        Variable v = program.createVariable();
        StringConstantInstruction insn = new StringConstantInstruction();
        insn.setConstant(value);
        insn.setReceiver(v);
        out.add(insn);
        return v;
    }

    /** Emits an {@link IntegerConstantInstruction} and returns the receiver variable. */
    private Variable loadInt(Program program, int value, List<Instruction> out) {
        Variable v = program.createVariable();
        IntegerConstantInstruction insn = new IntegerConstantInstruction();
        insn.setConstant(value);
        insn.setReceiver(v);
        out.add(insn);
        return v;
    }

    /** Returns {@code true} if any instruction in the program carries a source location. */
    private boolean hasSourceInfo(Program program) {
        for (int bi = 0; bi < program.basicBlockCount(); bi++) {
            BasicBlock block = program.basicBlockAt(bi);
            if (block == null) {
                continue;
            }
            for (Instruction insn = block.getFirstInstruction(); insn != null; insn = insn.getNext()) {
                TextLocation loc = insn.getLocation();
                if (loc != null && loc.getLine() > 0) {
                    return true;
                }
            }
        }
        return false;
    }
}
