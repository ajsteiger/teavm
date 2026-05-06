/*
 * Pure-browser Java Visualizer – Web Worker
 *
 * Responsibilities
 * ----------------
 *  1. Load compiler.wasm once and cache the Compiler instance.
 *  2. On a "compile" message from the main thread:
 *     a. Instrument the user's Java source with StepRecorder calls.
 *     b. Compile the instrumented source (+ StepRecorder helper source)
 *        via compiler.wasm.
 *     c. Run the resulting Wasm in this worker.
 *     d. Collect the execution trace (via $vizStep / $vizEnterMethod /
 *        $vizExitMethod / $vizCaptureVar callbacks).
 *     e. Post the trace back to the main thread.
 *
 * Message protocol
 * ----------------
 *  Incoming (from main thread):
 *    { type: "compile", source: "<java source>", mainClass: "<ClassName>" }
 *
 *  Outgoing (to main thread):
 *    { type: "status",   message: "<human-readable string>" }
 *    { type: "diagnostic", severity: "error"|"warning"|"other",
 *      fileName: "..", lineNumber: N, columnNumber: N, message: ".." }
 *    { type: "trace-complete", trace: <TraceStep[]>, truncated: boolean,
 *      stdout: "<captured output>" }
 *    { type: "error",    message: "<string>" }
 *
 * TraceStep shape
 * ---------------
 *  {
 *    line:       number,         // 1-based source line
 *    className:  string,
 *    method:     string,
 *    frames:     FrameEntry[],   // call stack, innermost last
 *    vars:       VarEntry[],     // local variables at this step
 *    stdout:     string,         // cumulative stdout up to this step
 *  }
 *
 * FrameEntry  = { className: string, method: string, line: number }
 * VarEntry    = { name: string, value: string }
 *
 * Integration with compiler.wasm
 * --------------------------------
 * This worker targets the compiler.wasm API from konsoletyper/teavm-javac.
 * The hosted module is at https://teavm.org/playground/compiler.wasm and its
 * runtime bootstrap is at https://teavm.org/playground/compiler.wasm-runtime.js.
 *
 * Required classpath archives (fetched once):
 *   https://teavm.org/playground/compile-classlib-teavm.bin   (javac SDK)
 *   https://teavm.org/playground/runtime-classlib-teavm.bin   (TeaVM classlib)
 *
 * Future note: when compiler.wasm is updated to include
 * StepInstrumentationTransformer + StepRecorder in its classlib, the
 * `generateVisualizer()` API will replace the source-level instrumentation
 * done here.
 */

"use strict";

/* ------------------------------------------------------------------ */
/*  Configuration                                                       */
/* ------------------------------------------------------------------ */
const COMPILER_RUNTIME_URL = "https://teavm.org/playground/compiler.wasm-runtime.js";
const COMPILER_WASM_URL    = "https://teavm.org/playground/compiler.wasm";
const SDK_URL              = "https://teavm.org/playground/compile-classlib-teavm.bin";
const CLASSLIB_URL         = "https://teavm.org/playground/runtime-classlib-teavm.bin";

/** Maximum number of steps the instrumented program may record. */
const MAX_STEPS = 10_000;

/* ------------------------------------------------------------------ */
/*  State                                                               */
/* ------------------------------------------------------------------ */
let compilerLib = null;   // teavm-javac CompilerLibrary object
let compiler    = null;   // reusable Compiler instance
let sdkBuf      = null;   // Int8Array – javac SDK archive
let classlibBuf = null;   // Int8Array – TeaVM classlib archive

/* ------------------------------------------------------------------ */
/*  Bootstrap                                                           */
/* ------------------------------------------------------------------ */

/**
 * Loads all compiler infrastructure on first use.
 * Subsequent calls return immediately.
 */
async function ensureCompiler() {
    if (compilerLib !== null) {
        return;
    }

    postStatus("Loading compiler runtime…");

    // 1. Import the compiler.wasm JS runtime bootstrap.
    //    The module exports a `load(wasmUrl)` function that returns the
    //    teavm exports object.  We use dynamic import via a blob to avoid
    //    same-origin issues when the runtime JS is on a different origin.
    let runtimeText;
    try {
        const resp = await fetch(COMPILER_RUNTIME_URL);
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status} fetching compiler runtime`);
        }
        runtimeText = await resp.text();
    } catch (e) {
        throw new Error("Failed to fetch compiler.wasm runtime: " + e.message);
    }

    // Wrap in an ES module blob so we can `import()` it.
    const runtimeBlob = new Blob([runtimeText], { type: "text/javascript" });
    const runtimeUrl  = URL.createObjectURL(runtimeBlob);
    let runtimeModule;
    try {
        runtimeModule = await import(runtimeUrl);
    } finally {
        URL.revokeObjectURL(runtimeUrl);
    }

    postStatus("Loading compiler.wasm…");
    const teavm = await runtimeModule.load(COMPILER_WASM_URL);
    compilerLib = teavm.exports;

    postStatus("Loading class library…");
    const [sdkResp, classlibResp] = await Promise.all([
        fetch(SDK_URL),
        fetch(CLASSLIB_URL),
    ]);
    if (!sdkResp.ok) {
        throw new Error(`HTTP ${sdkResp.status} fetching SDK`);
    }
    if (!classlibResp.ok) {
        throw new Error(`HTTP ${classlibResp.status} fetching classlib`);
    }

    sdkBuf      = new Int8Array(await sdkResp.arrayBuffer());
    classlibBuf = new Int8Array(await classlibResp.arrayBuffer());

    // Create a reusable Compiler instance.
    compiler = compilerLib.createCompiler();
    await compiler.setSdk(sdkBuf);
    await compiler.setTeaVMClasslib(classlibBuf);

    postStatus("Compiler ready.");
}

/* ------------------------------------------------------------------ */
/*  Message handler                                                     */
/* ------------------------------------------------------------------ */
self.onmessage = async (event) => {
    const msg = event.data;
    if (msg.type === "compile") {
        try {
            await runCompilation(msg.source, msg.mainClass || "Main");
        } catch (e) {
            self.postMessage({ type: "error", message: String(e) });
        }
    }
};

/* ------------------------------------------------------------------ */
/*  Main compilation + execution pipeline                              */
/* ------------------------------------------------------------------ */
async function runCompilation(javaSource, mainClass) {
    await ensureCompiler();

    // ---- 1. Determine class/method names for diagnostics display ----
    const detectedClass = detectClassName(javaSource) || mainClass;

    // ---- 2. Instrument the Java source at the text level ------------
    postStatus("Instrumenting source…");
    const { instrumentedSource, stepRecorderSource } = instrumentSource(javaSource, detectedClass);

    // ---- 3. Feed sources into the compiler --------------------------
    postStatus("Compiling…");
    compiler.clearSourceFiles();
    compiler.clearOutputFiles();
    compiler.addSourceFile(detectedClass + ".java",         instrumentedSource);
    compiler.addSourceFile("org/teavm/visualizer/StepRecorder.java", stepRecorderSource);

    // Collect diagnostics
    const diagnostics = [];
    const diagReg = compiler.onDiagnostic((d) => diagnostics.push(d));

    let compileOk;
    try {
        compileOk = compiler.compile();
    } finally {
        diagReg.destroy();
    }

    for (const d of diagnostics) {
        self.postMessage({
            type:       "diagnostic",
            severity:   d.severity,
            fileName:   d.fileName,
            lineNumber: d.lineNumber,
            columnNumber: d.columnNumber || 0,
            message:    d.message,
        });
    }

    if (!compileOk) {
        postStatus("Compilation failed.");
        return;
    }

    // ---- 4. Generate Wasm from class files --------------------------
    postStatus("Generating WebAssembly…");
    const wasmDiags = [];
    const wasmDiagReg = compiler.onDiagnostic((d) => wasmDiags.push(d));
    let wasmOk;
    try {
        wasmOk = compiler.generateWebAssembly({ outputName: "app", mainClass: detectedClass });
    } finally {
        wasmDiagReg.destroy();
    }

    for (const d of wasmDiags) {
        self.postMessage({
            type:       "diagnostic",
            severity:   d.severity,
            fileName:   d.fileName,
            lineNumber: d.lineNumber,
            columnNumber: 0,
            message:    d.message,
        });
    }

    if (!wasmOk) {
        postStatus("WebAssembly generation failed.");
        return;
    }

    // ---- 5. Retrieve the Wasm module bytes + runtime ----------------
    const wasmBytes   = compiler.getWebAssemblyOutputFile("app.wasm");
    const runtimeData = compiler.getWebAssemblyOutputFile("app.wasm-runtime.js");

    if (!wasmBytes || !runtimeData) {
        throw new Error("Generated Wasm output not found.");
    }

    // ---- 6. Run the instrumented Wasm and collect the trace ---------
    postStatus("Running…");
    const { trace, truncated, stdout } = await runInstrumented(wasmBytes, runtimeData);

    postStatus("Done.");
    self.postMessage({ type: "trace-complete", trace, truncated, stdout });
}

/* ------------------------------------------------------------------ */
/*  Run instrumented Wasm and collect trace                            */
/* ------------------------------------------------------------------ */
async function runInstrumented(wasmBytes, runtimeData) {
    const trace   = [];
    let   truncated = false;
    let   stdout  = "";

    // Call stack tracking
    const callStack = [];

    // Pending variable captures for the current step
    let pendingVars = [];

    // $vizStep is called by StepRecorder.step() in the generated Wasm.
    // It fires AFTER enterMethod(), so callStack is already updated.
    globalThis.$vizStep = (className, method, line) => {
        if (trace.length >= MAX_STEPS) {
            truncated = true;
            return;
        }
        // Flush pending vars into the most recent frame
        const vars = pendingVars.splice(0);
        trace.push({
            line,
            className,
            method,
            frames: callStack.map((f) => ({ ...f })),
            vars,
            stdout,
        });
    };

    globalThis.$vizEnterMethod = (className, method) => {
        callStack.push({ className, method, line: 0 });
    };

    globalThis.$vizExitMethod = () => {
        callStack.pop();
    };

    globalThis.$vizCaptureVar = (name, value) => {
        pendingVars.push({ name, value });
    };

    globalThis.$vizStepLimitReached = () => {
        truncated = true;
    };

    // Capture stdout: TeaVM routes System.out.println → console.log
    // in the generated Wasm.  We intercept it here.
    const origLog = console.log;
    console.log = (...args) => {
        stdout += args.map(String).join(" ") + "\n";
    };

    try {
        // Load the runtime JS from the generated output.
        const runtimeText = new TextDecoder().decode(
            new Uint8Array(runtimeData.buffer, runtimeData.byteOffset, runtimeData.byteLength)
        );
        const runtimeBlob = new Blob([runtimeText], { type: "text/javascript" });
        const runtimeUrl  = URL.createObjectURL(runtimeBlob);
        let loadFn;
        try {
            const mod = await import(runtimeUrl);
            loadFn = mod.load;
        } finally {
            URL.revokeObjectURL(runtimeUrl);
        }

        // Instantiate the user Wasm.  The `load()` function from the runtime
        // handles imports and exports wired to TeaVM's classlib.
        const wasmBlob = new Blob(
            [new Uint8Array(wasmBytes.buffer, wasmBytes.byteOffset, wasmBytes.byteLength)],
            { type: "application/wasm" }
        );
        const wasmUrl = URL.createObjectURL(wasmBlob);
        try {
            const userTeavm = await loadFn(wasmUrl);
            // Run the main() entry point.
            await userTeavm.exports.main([]);
        } finally {
            URL.revokeObjectURL(wasmUrl);
        }
    } catch (e) {
        // A thrown exception from user code is normal (e.g. unhandled RuntimeException).
        // Record it in stdout and continue to render whatever trace was collected.
        stdout += "\n[Exception: " + String(e) + "]\n";
    } finally {
        console.log = origLog;
        delete globalThis.$vizStep;
        delete globalThis.$vizEnterMethod;
        delete globalThis.$vizExitMethod;
        delete globalThis.$vizCaptureVar;
        delete globalThis.$vizStepLimitReached;
    }

    return { trace, truncated, stdout };
}

/* ------------------------------------------------------------------ */
/*  Source-level Java instrumentation                                   */
/*                                                                      */
/*  This performs a lightweight text transformation of the user's Java  */
/*  source to inject StepRecorder.step() calls before each statement.  */
/*  It is intentionally simple (line-based, no full parser) and works  */
/*  for straightforward programs.                                       */
/*                                                                      */
/*  When compiler.wasm is updated to include StepInstrumentationTransformer,
/*  this transform can be replaced by calling compiler.generateVisualizer()
/*  which does proper IR-level instrumentation.                         */
/* ------------------------------------------------------------------ */

/**
 * Instruments `javaSource` with StepRecorder calls and returns both the
 * instrumented source and the StepRecorder helper source.
 *
 * @param {string} javaSource  - original Java source
 * @param {string} className   - detected or provided class name
 * @returns {{ instrumentedSource: string, stepRecorderSource: string }}
 */
function instrumentSource(javaSource, className) {
    const lines = javaSource.split("\n");
    const result = [];
    let insideMethod = false;
    let currentMethod = "main";
    let braceDepth = 0;
    let methodBraceStart = -1;

    // Simple heuristic: emit a step call before "executable" lines.
    // An executable line is one that:
    //  - is not blank / comment-only
    //  - does not consist only of braces / package / import / class header
    //  - starts with a statement-like token

    const methodPattern   = /^\s*(public|private|protected|static|\s)*(void|int|long|double|float|boolean|String|[A-Z]\w*)\s+(\w+)\s*\(/;
    const nonExecPattern  = /^\s*(\/\/|\/\*|\*|package\s|import\s|class\s|interface\s|enum\s|@|\}|\{|$)/;

    let importAdded = false;
    let packageLine = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track package line to insert our import after it
        if (!importAdded && /^\s*package\s/.test(line)) {
            packageLine = result.length;
            result.push(line);
            continue;
        }

        // Insert our import right after package line (or at top if no package)
        if (!importAdded && (/^\s*import\s/.test(line) || result.length > 0)) {
            if (packageLine >= 0) {
                result.push("import org.teavm.visualizer.StepRecorder;");
            }
            importAdded = true;
        }

        // Detect method declarations
        const methodMatch = methodPattern.exec(line);
        if (methodMatch) {
            currentMethod = methodMatch[3];
        }

        // Track brace depth to know when we are inside a method body
        for (const ch of line) {
            if (ch === "{") {
                braceDepth++;
                if (braceDepth === 2) {
                    methodBraceStart = braceDepth;
                    insideMethod = true;
                }
            } else if (ch === "}") {
                if (braceDepth === 2) {
                    insideMethod = false;
                }
                braceDepth = Math.max(0, braceDepth - 1);
            }
        }

        // Emit step call before executable lines inside a method
        if (insideMethod && !nonExecPattern.test(line) && line.trim().length > 0) {
            const lineNo = i + 1;
            const indent = (line.match(/^(\s*)/) || ["", ""])[1];
            result.push(
                `${indent}StepRecorder.step("${className}", "${currentMethod}", ${lineNo});`
            );
        }

        result.push(line);
    }

    if (!importAdded) {
        result.unshift("import org.teavm.visualizer.StepRecorder;");
    }

    return {
        instrumentedSource: result.join("\n"),
        stepRecorderSource: buildStepRecorderSource(),
    };
}

/**
 * Returns the Java source for the StepRecorder helper class that the
 * instrumented code calls.  The callbacks use @JSBody so that they
 * fire into globalThis.$vizStep etc. in this worker.
 */
function buildStepRecorderSource() {
    return `
package org.teavm.visualizer;

import org.teavm.jso.JSBody;

public final class StepRecorder {
    public static final int MAX_STEPS = ${MAX_STEPS};
    private static int stepCount;
    private static boolean truncated;

    private StepRecorder() {}

    public static void step(String className, String methodName, int line) {
        if (truncated) return;
        if (stepCount >= MAX_STEPS) {
            truncated = true;
            jsStepLimitReached();
            return;
        }
        stepCount++;
        jsStep(className, methodName, line);
    }

    public static void enterMethod(String className, String methodName) {
        if (!truncated) jsEnterMethod(className, methodName);
    }

    public static void exitMethod() {
        if (!truncated) jsExitMethod();
    }

    public static void captureVar(String name, Object value) {
        if (!truncated) jsCaptureVar(name, value == null ? "null" : value.toString());
    }

    public static boolean isTruncated() { return truncated; }
    public static int getStepCount()    { return stepCount; }

    @JSBody(params = {"className", "method", "line"},
            script = "if(typeof $vizStep==='function')$vizStep(className,method,line);")
    private static native void jsStep(String className, String method, int line);

    @JSBody(params = {"className", "method"},
            script = "if(typeof $vizEnterMethod==='function')$vizEnterMethod(className,method);")
    private static native void jsEnterMethod(String className, String method);

    @JSBody(params = {}, script = "if(typeof $vizExitMethod==='function')$vizExitMethod();")
    private static native void jsExitMethod();

    @JSBody(params = {"name", "value"},
            script = "if(typeof $vizCaptureVar==='function')$vizCaptureVar(name,value);")
    private static native void jsCaptureVar(String name, String value);

    @JSBody(params = {},
            script = "if(typeof $vizStepLimitReached==='function')$vizStepLimitReached();")
    private static native void jsStepLimitReached();
}
`.trim();
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                           */
/* ------------------------------------------------------------------ */

/** Attempt to detect the public class name from source text. */
function detectClassName(source) {
    const m = /\bpublic\s+class\s+(\w+)/.exec(source);
    return m ? m[1] : null;
}

function postStatus(message) {
    self.postMessage({ type: "status", message });
}
