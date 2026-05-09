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
package org.teavm.visualizer.support;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import org.teavm.classlib.ReflectionContext;
import org.teavm.classlib.ReflectionSupplier;
import org.teavm.model.ClassReader;
import org.teavm.model.ElementModifier;
import org.teavm.model.FieldReader;
import org.teavm.model.MethodDescriptor;

/**
 * Makes all instance fields of visualizer fixture classes available via runtime
 * reflection so that {@code StepRecorder.captureRef()} can serialize heap objects.
 *
 * <p>Registered via {@code META-INF/services/org.teavm.classlib.ReflectionSupplier}.</p>
 */
public class VisualizerReflectionSupplier implements ReflectionSupplier {

    private static final String FIXTURE_PREFIX = "org.teavm.visualizer.fixture.";

    @Override
    public Collection<String> getAccessibleFields(ReflectionContext context, String className) {
        if (!className.startsWith(FIXTURE_PREFIX)) {
            return Collections.emptyList();
        }
        ClassReader cls = context.getClassSource().get(className);
        if (cls == null) {
            return Collections.emptyList();
        }
        Collection<String> fields = new ArrayList<>();
        for (FieldReader field : cls.getFields()) {
            if (!field.hasModifier(ElementModifier.STATIC)) {
                fields.add(field.getName());
            }
        }
        return fields;
    }

    @Override
    public Collection<MethodDescriptor> getAccessibleMethods(ReflectionContext context, String className) {
        return Collections.emptyList();
    }
}
