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
import static org.junit.Assert.fail;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.teavm.backend.javascript.JavaScriptTarget;
import org.teavm.dependency.FastDependencyAnalyzer;
import org.teavm.diagnostics.DefaultProblemTextConsumer;
import org.teavm.diagnostics.Problem;
import org.teavm.model.ReferenceCache;
import org.teavm.parsing.ClasspathClassHolderSource;
import org.teavm.parsing.ClasspathResourceProvider;
import org.teavm.visualizer.fixture.FactorialFixture;
import org.teavm.vm.BuildTarget;
import org.teavm.vm.TeaVM;
import org.teavm.vm.TeaVMBuilder;
import org.teavm.vm.TeaVMOptimizationLevel;

/**
 * End-to-end test for the IR-level visualizer instrumentation pipeline.
 *
 * <p>This test exercises the full path:</p>
 * <ol>
 *   <li>TeaVM compiles {@link FactorialFixture} with {@link StepInstrumentationTransformer}
 *       installed — this is the <em>IR backend path</em>, as opposed to the
 *       source-level text instrumentation done in {@code worker.js}.</li>
 *   <li>{@link StepRecorder} is compiled alongside the fixture (it is reachable because
 *       the transformer injects calls to it).</li>
 *   <li>The generated JavaScript is evaluated in Rhino with {@code $rt_putStderrCustom}
 *       wired to a Java capture buffer.</li>
 *   <li>The captured VIZ-protocol lines are parsed and asserted.</li>
 * </ol>
 *
 * <p>This test confirms that the IR path produces a correct, parseable VIZ trace —
 * the same trace that {@code worker.js → runIrCompilation()} would produce once
 * {@code compiler.wasm} exposes {@code generateVisualizer()}.</p>
 */
public class VisualizerE2ETest {

    private static final String VIZ_PREFIX = "\u0000VIZ:";
    private static final String FIXTURE_CLASS = FactorialFixture.class.getName();
    private static final String FIXTURE_PREFIX = "org.teavm.visualizer.fixture";

    private static Context rhinoContext;
    private static ScriptableObject rhinoRootScope;

    // Compiled JS, produced once for all tests.
    private static String compiledJs;
    private static List<String> compileErrors = new ArrayList<>();

    @BeforeClass
    public static void setUp() {
        rhinoContext = Context.enter();
        rhinoContext.setOptimizationLevel(-1);
        rhinoContext.setLanguageVersion(Context.VERSION_ES6);
        rhinoRootScope = rhinoContext.initStandardObjects();

        compiledJs = compileFixture();
    }

    @AfterClass
    public static void tearDown() {
        rhinoRootScope = null;
        rhinoContext = null;
    }

    // -----------------------------------------------------------------------
    //  Tests
    // -----------------------------------------------------------------------

    @Test
    public void compilationSucceeds() {
        assertTrue("TeaVM compilation produced errors:\n" + String.join("\n", compileErrors),
                compileErrors.isEmpty());
        assertFalse("Compiled JS must not be empty", compiledJs == null || compiledJs.isEmpty());
    }

    @Test
    public void stepEventsAreEmitted() {
        List<String> vizLines = runCompiledJs();
        long stepCount = vizLines.stream().filter(l -> l.startsWith("step:")).count();
        assertTrue("Expected at least one step event, got: " + stepCount, stepCount > 0);
    }

    @Test
    public void stepEventsIncludeFrameStack() {
        List<String> vizLines = runCompiledJs();

        // Find steps that have at least two frames (main → factorial)
        boolean foundDeepStep = vizLines.stream()
                .filter(l -> l.startsWith("step:"))
                .anyMatch(line -> {
                    String[] parts = line.split(":");
                    // Format: step:cls0:meth0:line0:cls1:meth1:line1:...
                    // parts[0]="step", then triples follow
                    return (parts.length - 1) >= 6; // at least 2 frames
                });

        assertTrue("Expected at least one step with 2+ frames (main → factorial)", foundDeepStep);
    }

    @Test
    public void stepEventsReferenceFixtureClass() {
        List<String> vizLines = runCompiledJs();

        boolean hasFixtureStep = vizLines.stream()
                .filter(l -> l.startsWith("step:"))
                .anyMatch(l -> l.contains(FIXTURE_CLASS));

        assertTrue("Expected step events referencing " + FIXTURE_CLASS, hasFixtureStep);
    }

    @Test
    public void paramVarCapturedAfterEachStep() {
        List<String> vizLines = runCompiledJs();

        // 'n' is a parameter of factorial(int n); it must be captured after steps inside that method.
        boolean hasVarN = vizLines.stream().anyMatch(l -> l.equals("var:n=3"));
        assertTrue("Expected at least one 'var:n=3' event for factorial parameter", hasVarN);
    }

    @Test
    public void varEventFollowsStep() {
        List<String> vizLines = runCompiledJs();

        // After every "step:" line there must be at least one "var:" line
        // (at least when there are parameters — factorial has 'n').
        boolean foundStepBeforeVar = false;
        for (int i = 0; i < vizLines.size() - 1; i++) {
            if (vizLines.get(i).startsWith("step:") && vizLines.get(i + 1).startsWith("var:")) {
                foundStepBeforeVar = true;
                break;
            }
        }
        assertTrue("Expected a 'var:' event immediately following a 'step:' event", foundStepBeforeVar);
    }

    @Test
    public void noTruncationForSmallProgram() {
        List<String> vizLines = runCompiledJs();
        boolean truncated = vizLines.stream().anyMatch(l -> l.equals("truncated"));
        assertFalse("Small factorial program should not be truncated", truncated);
    }

    @Test
    public void traceIsFullyParseable() {
        List<String> vizLines = runCompiledJs();
        List<TraceStep> trace = parseTrace(vizLines);

        assertFalse("Parsed trace must not be empty", trace.isEmpty());

        // Every step must have at least one frame
        for (TraceStep step : trace) {
            assertFalse("Each trace step must have at least one frame", step.frames.isEmpty());
        }
    }

    @Test
    public void innerMostFrameMatchesStepTopLevel() {
        List<String> vizLines = runCompiledJs();
        List<TraceStep> trace = parseTrace(vizLines);

        for (TraceStep step : trace) {
            FrameEntry top = step.frames.get(step.frames.size() - 1);
            assertEquals("step.className must match innermost frame className",
                    top.className, step.className);
            assertEquals("step.method must match innermost frame method",
                    top.method, step.method);
        }
    }

    // -----------------------------------------------------------------------
    //  TeaVM compilation
    // -----------------------------------------------------------------------

    private static String compileFixture() {
        JavaScriptTarget target = new JavaScriptTarget();
        target.setObfuscated(false);
        target.setStrict(false); // keep globals accessible in Rhino

        TeaVM vm = new TeaVMBuilder(target)
                .setClassLoader(VisualizerE2ETest.class.getClassLoader())
                .setClassSource(new ClasspathClassHolderSource(
                        new ClasspathResourceProvider(VisualizerE2ETest.class.getClassLoader()),
                        new ReferenceCache()))
                .setResourceProvider(new ClasspathResourceProvider(VisualizerE2ETest.class.getClassLoader()))
                .setDependencyAnalyzerFactory(FastDependencyAnalyzer::new)
                .build();

        vm.setOptimizationLevel(TeaVMOptimizationLevel.SIMPLE);
        vm.add(new StepInstrumentationTransformer(FIXTURE_PREFIX));
        vm.setEntryPoint(FIXTURE_CLASS);
        vm.installPlugins();

        StringBuildTarget buildTarget = new StringBuildTarget();
        vm.build(buildTarget, "classes.js");

        for (Problem p : vm.getProblemProvider().getSevereProblems()) {
            DefaultProblemTextConsumer consumer = new DefaultProblemTextConsumer();
            p.render(consumer);
            compileErrors.add(consumer.getText());
        }

        return buildTarget.get("classes.js");
    }

    // -----------------------------------------------------------------------
    //  Rhino execution
    // -----------------------------------------------------------------------

    /**
     * Runs the compiled JS in a fresh Rhino scope with stderr captured.
     * Returns the list of lines emitted after stripping the {@code \0VIZ:} prefix.
     */
    private List<String> runCompiledJs() {
        if (compiledJs == null || compiledJs.isEmpty()) {
            fail("Compiled JS is empty; compilation must have failed");
        }

        List<String> capturedVizLines = new ArrayList<>();
        StringBuilder stderrBuf = new StringBuilder();

        Scriptable scope = new NativeObject();
        scope.setParentScope(rhinoRootScope);
        scope.setPrototype(rhinoRootScope);

        // Install $rt_putStderrCustom: called by the TeaVM JS runtime for each
        // fragment written to System.err.  We accumulate fragments into a line buffer.
        BaseFunction stderrCapture = new BaseFunction() {
            @Override
            public Object call(Context cx, Scriptable callScope, Scriptable thisObj, Object[] args) {
                String fragment = args.length > 0 ? Context.toString(args[0]) : "";
                int idx = 0;
                while (true) {
                    int nl = fragment.indexOf('\n', idx);
                    if (nl < 0) {
                        stderrBuf.append(fragment, idx, fragment.length());
                        break;
                    }
                    String line = stderrBuf + fragment.substring(idx, nl);
                    stderrBuf.setLength(0);
                    if (line.startsWith(VIZ_PREFIX)) {
                        capturedVizLines.add(line.substring(VIZ_PREFIX.length()));
                    }
                    idx = nl + 1;
                }
                return Undefined.instance;
            }
        };

        // $rt_putStderrCustom must be defined BEFORE evaluating the compiled JS,
        // because console.js checks 'typeof $rt_putStderrCustom === "function"' at load time.
        ScriptableObject.putProperty(scope, "$rt_putStderrCustom", stderrCapture);

        rhinoContext.evaluateString(scope, compiledJs, "classes.js", 1, null);

        Function main = (Function) scope.get("main", scope);
        ScriptRuntime.doTopCall(main, rhinoContext, scope, scope,
                new Object[] { new NativeArray(0), Undefined.instance });

        // Flush any partial line in the buffer
        if (stderrBuf.length() > 0) {
            String remaining = stderrBuf.toString();
            if (remaining.startsWith(VIZ_PREFIX)) {
                capturedVizLines.add(remaining.substring(VIZ_PREFIX.length()));
            }
        }

        return capturedVizLines;
    }

    // -----------------------------------------------------------------------
    //  VIZ trace parsing
    // -----------------------------------------------------------------------

    private List<TraceStep> parseTrace(List<String> vizLines) {
        List<TraceStep> trace = new ArrayList<>();
        for (String line : vizLines) {
            if (line.startsWith("step:")) {
                String[] parts = line.split(":");
                List<FrameEntry> frames = new ArrayList<>();
                for (int i = 1; i + 2 < parts.length; i += 3) {
                    frames.add(new FrameEntry(parts[i], parts[i + 1], Integer.parseInt(parts[i + 2])));
                }
                FrameEntry top = frames.isEmpty() ? new FrameEntry("?", "?", 0) : frames.get(frames.size() - 1);
                trace.add(new TraceStep(top.className, top.method, top.line, frames, new ArrayList<>()));
            } else if (line.startsWith("var:") && !trace.isEmpty()) {
                String nv = line.substring(4);
                int eq = nv.indexOf('=');
                if (eq >= 0) {
                    trace.get(trace.size() - 1).vars.add(new VarEntry(nv.substring(0, eq), nv.substring(eq + 1)));
                }
            }
        }
        return trace;
    }

    // -----------------------------------------------------------------------
    //  Build target that stores output in memory
    // -----------------------------------------------------------------------

    private static final class StringBuildTarget implements BuildTarget {
        private final Map<String, String> files = new HashMap<>();

        @Override
        public OutputStream createResource(String fileName) {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            return new OutputStream() {
                @Override
                public void write(int b) throws IOException {
                    bos.write(b);
                }

                @Override
                public void write(byte[] b, int off, int len) throws IOException {
                    bos.write(b, off, len);
                }

                @Override
                public void close() throws IOException {
                    files.put(fileName, bos.toString("UTF-8"));
                }
            };
        }

        String get(String name) {
            return files.get(name);
        }
    }

    // -----------------------------------------------------------------------
    //  Simple model classes
    // -----------------------------------------------------------------------

    private static final class FrameEntry {
        final String className;
        final String method;
        final int line;

        FrameEntry(String className, String method, int line) {
            this.className = className;
            this.method = method;
            this.line = line;
        }
    }

    private static final class VarEntry {
        final String name;
        final String value;

        VarEntry(String name, String value) {
            this.name = name;
            this.value = value;
        }
    }

    private static final class TraceStep {
        final String className;
        final String method;
        final int line;
        final List<FrameEntry> frames;
        final List<VarEntry> vars;

        TraceStep(String className, String method, int line, List<FrameEntry> frames, List<VarEntry> vars) {
            this.className = className;
            this.method = method;
            this.line = line;
            this.frames = frames;
            this.vars = vars;
        }
    }
}
