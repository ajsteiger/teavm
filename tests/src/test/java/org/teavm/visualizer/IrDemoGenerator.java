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

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.Test;
import org.teavm.backend.javascript.JavaScriptTarget;
import org.teavm.dependency.FastDependencyAnalyzer;
import org.teavm.diagnostics.DefaultProblemTextConsumer;
import org.teavm.diagnostics.Problem;
import org.teavm.model.ReferenceCache;
import org.teavm.parsing.ClasspathClassHolderSource;
import org.teavm.parsing.ClasspathResourceProvider;
import org.teavm.visualizer.fixture.LinkedListFixture;
import org.teavm.visualizer.fixture.LoopExample;
import org.teavm.visualizer.fixture.MultiMethodExample;
import org.teavm.visualizer.fixture.RecursiveFactorial;
import org.teavm.vm.BuildTarget;
import org.teavm.vm.TeaVM;
import org.teavm.vm.TeaVMBuilder;
import org.teavm.vm.TeaVMOptimizationLevel;

/**
 * Compiles IR-backend demo fixtures via TeaVM + {@link StepInstrumentationTransformer}
 * and writes the resulting JS files into the visualizer webapp directory so
 * {@code ir-demo.html} can load them directly without a compile step.
 *
 * <p>Produces three files:</p>
 * <ul>
 *   <li>{@code ir-recursive.js} — recursive factorial(4)</li>
 *   <li>{@code ir-loop.js}      — iterative sum-to-N with loop variables</li>
 *   <li>{@code ir-multimethod.js} — choose(5,2) calling factorial twice</li>
 * </ul>
 *
 * <p>Run with:</p>
 * <pre>
 *   ./gradlew :tests:test \
 *     --tests "org.teavm.visualizer.IrDemoGenerator" \
 *     -Pteavm.tests.js=false -Pteavm.tests.wasm-gc=false \
 *     -Pteavm.tests.c=false -Pteavm.tests.optimized=false
 * </pre>
 */
public class IrDemoGenerator {

    private static final String FIXTURE_PREFIX = "org.teavm.visualizer.fixture";

    private static final String WEBAPP =
            "samples/visualizer/src/main/webapp/";

    @Test
    public void generateIrDemo() throws IOException {
        Path repoRoot = findRepoRoot();

        compile(RecursiveFactorial.class.getName(), "ir-recursive.js",   repoRoot);
        compile(LoopExample.class.getName(),        "ir-loop.js",         repoRoot);
        compile(MultiMethodExample.class.getName(), "ir-multimethod.js",  repoRoot);
        compile(LinkedListFixture.class.getName(),  "ir-linkedlist.js",   repoRoot);
    }

    private static void compile(String entryClass, String outputFile, Path repoRoot)
            throws IOException {
        String js = compileFixture(entryClass, outputFile);
        assertFalse("TeaVM compilation produced empty output for " + outputFile,
                js == null || js.isEmpty());

        Path output = repoRoot.resolve(WEBAPP + outputFile);
        Files.createDirectories(output.getParent());
        Files.writeString(output, js, StandardCharsets.UTF_8);
        System.out.println("[IrDemoGenerator] Wrote " + output.toAbsolutePath()
                + " (" + js.length() + " chars)");
    }

    private static Path findRepoRoot() {
        Path dir = Paths.get("").toAbsolutePath();
        while (dir != null && !dir.resolve("settings.gradle.kts").toFile().exists()) {
            dir = dir.getParent();
        }
        assertTrue("Could not locate repository root (settings.gradle.kts not found)", dir != null);
        return dir;
    }

    // -----------------------------------------------------------------------
    //  TeaVM compilation (same pattern as VisualizerE2ETest)
    // -----------------------------------------------------------------------

    private static String compileFixture(String entryClass, String outputFile) {
        JavaScriptTarget target = new JavaScriptTarget();
        target.setObfuscated(false);
        target.setStrict(false);

        TeaVM vm = new TeaVMBuilder(target)
                .setClassLoader(IrDemoGenerator.class.getClassLoader())
                .setClassSource(new ClasspathClassHolderSource(
                        new ClasspathResourceProvider(IrDemoGenerator.class.getClassLoader()),
                        new ReferenceCache()))
                .setResourceProvider(new ClasspathResourceProvider(IrDemoGenerator.class.getClassLoader()))
                .setDependencyAnalyzerFactory(FastDependencyAnalyzer::new)
                .build();

        vm.setOptimizationLevel(TeaVMOptimizationLevel.SIMPLE);
        vm.add(new StepInstrumentationTransformer(FIXTURE_PREFIX));
        vm.setEntryPoint(entryClass);
        vm.installPlugins();

        StringBuildTarget buildTarget = new StringBuildTarget();
        vm.build(buildTarget, outputFile);

        for (Problem p : vm.getProblemProvider().getSevereProblems()) {
            DefaultProblemTextConsumer consumer = new DefaultProblemTextConsumer();
            p.render(consumer);
            System.err.println("[IrDemoGenerator] SEVERE (" + outputFile + "): " + consumer.getText());
        }

        return buildTarget.get(outputFile);
    }

    // -----------------------------------------------------------------------
    //  In-memory build target (same as VisualizerE2ETest)
    // -----------------------------------------------------------------------

    private static class StringBuildTarget implements BuildTarget {
        private final java.util.Map<String, byte[]> files = new java.util.HashMap<>();

        @Override
        public OutputStream createResource(String fileName) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            files.put(fileName, null);
            return new OutputStream() {
                @Override
                public void write(int b) {
                    baos.write(b);
                }

                @Override
                public void write(byte[] buf, int off, int len) {
                    baos.write(buf, off, len);
                }

                @Override
                public void close() {
                    files.put(fileName, baos.toByteArray());
                }
            };
        }

        String get(String fileName) {
            byte[] data = files.get(fileName);
            return data != null ? new String(data, StandardCharsets.UTF_8) : null;
        }
    }
}
