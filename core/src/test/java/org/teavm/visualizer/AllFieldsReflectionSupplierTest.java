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
import static org.junit.Assert.assertTrue;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.teavm.classlib.ReflectionContext;
import org.teavm.model.ClassHolder;
import org.teavm.model.ClassReaderSource;
import org.teavm.model.ElementModifier;
import org.teavm.model.FieldHolder;

public class AllFieldsReflectionSupplierTest {
    private final AllFieldsReflectionSupplier supplier = new AllFieldsReflectionSupplier();
    private final Map<String, ClassHolder> classes = new LinkedHashMap<>();
    private final ReflectionContext context = new TestReflectionContext(classes::get);

    @Before
    public void setUp() {
        StepInstrumentationTransformer.disableVisualizerReflectionForTests();
    }

    @After
    public void tearDown() {
        StepInstrumentationTransformer.disableVisualizerReflectionForTests();
    }

    @Test
    public void inactiveByDefault_returnsNoFields() {
        classes.put("example.Node", classWithFields("example.Node", "value", "next"));

        assertTrue(supplier.getAccessibleFields(context, "example.Node").isEmpty());
    }

    @Test
    public void visualizerInstrumentationActive_returnsAllInstanceFieldsForUserClasses() {
        new StepInstrumentationTransformer("example.");
        classes.put("example.Node", classWithFields("example.Node", "value", "next"));

        Collection<String> fields = supplier.getAccessibleFields(context, "example.Node");

        assertEquals(List.of("value", "next"), new ArrayList<>(fields));
    }

    @Test
    public void visualizerInstrumentationActive_excludesStaticFields() {
        new StepInstrumentationTransformer("example.");
        ClassHolder cls = classWithFields("example.Node", "value");
        FieldHolder staticField = new FieldHolder("counter");
        staticField.getModifiers().add(ElementModifier.STATIC);
        cls.addField(staticField);
        classes.put("example.Node", cls);

        Collection<String> fields = supplier.getAccessibleFields(context, "example.Node");

        assertEquals(List.of("value"), new ArrayList<>(fields));
    }

    @Test
    public void visualizerInstrumentationActive_excludesSystemClasses() {
        new StepInstrumentationTransformer("example.");
        classes.put("java.lang.String", classWithFields("java.lang.String", "characters"));
        classes.put("java/lang/String", classWithFields("java/lang/String", "characters"));
        classes.put("javax.swing.JPanel", classWithFields("javax.swing.JPanel", "ui"));
        classes.put("sun.misc.Unsafe", classWithFields("sun.misc.Unsafe", "theUnsafe"));
        classes.put("org.teavm.runtime.Fiber", classWithFields("org.teavm.runtime.Fiber", "state"));

        assertTrue(supplier.getAccessibleFields(context, "java.lang.String").isEmpty());
        assertTrue(supplier.getAccessibleFields(context, "java/lang/String").isEmpty());
        assertTrue(supplier.getAccessibleFields(context, "javax.swing.JPanel").isEmpty());
        assertTrue(supplier.getAccessibleFields(context, "sun.misc.Unsafe").isEmpty());
        assertTrue(supplier.getAccessibleFields(context, "org.teavm.runtime.Fiber").isEmpty());
    }

    @Test
    public void visualizerInstrumentationActive_missingClassReturnsNoFields() {
        new StepInstrumentationTransformer("example.");

        assertTrue(supplier.getAccessibleFields(context, "example.Missing").isEmpty());
    }

    private static ClassHolder classWithFields(String name, String... fieldNames) {
        ClassHolder cls = new ClassHolder(name);
        for (String fieldName : fieldNames) {
            cls.addField(new FieldHolder(fieldName));
        }
        return cls;
    }

    private static final class TestReflectionContext implements ReflectionContext {
        private final ClassReaderSource classSource;

        TestReflectionContext(ClassReaderSource classSource) {
            this.classSource = classSource;
        }

        @Override
        public ClassLoader getClassLoader() {
            return getClass().getClassLoader();
        }

        @Override
        public ClassReaderSource getClassSource() {
            return classSource;
        }
    }
}
