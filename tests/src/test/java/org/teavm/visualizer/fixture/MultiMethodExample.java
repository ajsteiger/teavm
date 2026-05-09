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
 * Multi-method example: choose(n,k) = n! / (k! * (n-k)!) calling factorial().
 * Shows cross-method call stack and multiple local variable captures.
 */
public final class MultiMethodExample {
    private MultiMethodExample() {
    }

    public static int factorial(int n) {
        int result = 1;
        int i = 2;
        while (i <= n) {
            result = result * i;
            i = i + 1;
        }
        return result;
    }

    public static int choose(int n, int k) {
        int nFact = factorial(n);
        int kFact = factorial(k);
        int nkFact = factorial(n - k);
        return nFact / (kFact * nkFact);
    }

    public static void main(String[] args) {
        System.out.println(choose(5, 2));
    }
}
