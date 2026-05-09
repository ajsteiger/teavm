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
 * Demonstrates heap-object visualization using real linked-list nodes.
 *
 * <p>The {@code StepInstrumentationTransformer} calls
 * {@code StepRecorder.captureRef()} for the {@code Node} typed variables, which
 * uses runtime reflection to emit {@code @id:Node{val=X,next=@Y}} so the
 * heap panel can draw the graph.</p>
 */
public final class LinkedListFixture {
    private LinkedListFixture() {
    }

    static final class Node {
        int val;
        Node next;

        Node(int val, Node next) {
            this.val = val;
            this.next = next;
        }
    }

    public static void main(String[] args) {
        Node n1 = new Node(99, null);
        Node n2 = new Node(17, n1);
        Node n3 = new Node(42, n2);

        int sum = n1.val + n2.val + n3.val;
        int max = n1.val;
        if (n2.val > max) {
            max = n2.val;
        }
        if (n3.val > max) {
            max = n3.val;
        }

        System.out.println("Sum = " + sum);
        System.out.println("Max = " + max);
    }
}

