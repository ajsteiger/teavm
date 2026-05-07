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
const COMPILER_RUNTIME_URL = "playground/compiler.wasm-runtime.js";
const COMPILER_WASM_URL    = "playground/compiler.wasm";
const SDK_URL              = "playground/compile-classlib-teavm.bin";
const CLASSLIB_URL         = "playground/runtime-classlib-teavm.bin";

/** Maximum number of steps the instrumented program may record. */
const MAX_STEPS = 10_000;

/* ------------------------------------------------------------------ */
/*  State                                                               */
/* ------------------------------------------------------------------ */
let compilerLib    = null;   // teavm-javac CompilerLibrary object
let compiler       = null;   // reusable Compiler instance
let runtimeModule  = null;   // imported compiler.wasm-runtime module (load fn)
let sdkBuf         = null;   // Int8Array – javac SDK archive
let classlibBuf    = null;   // Int8Array – TeaVM classlib archive

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
    let loadedModule;
    try {
        loadedModule = await import(runtimeUrl);
    } finally {
        URL.revokeObjectURL(runtimeUrl);
    }
    runtimeModule = loadedModule;  // save for use in runInstrumented()

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
    compiler.addSourceFile(detectedClass + ".java",   instrumentedSource);
    compiler.addSourceFile("StepRecorder.java",        stepRecorderSource);

    // Collect diagnostics
    const diagnostics = [];
    const diagReg = compiler.onDiagnostic((d) => diagnostics.push(d));

    let compileOk;
    try {
        compileOk = compiler.compile();
    } finally {
        if (diagReg && typeof diagReg.destroy === "function") diagReg.destroy();
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

    // Use detectMainClasses() to find the entry point reliably
    let mainClassForWasm = detectedClass;
    try {
        const mains = compiler.detectMainClasses();
        if (mains && mains.length > 0) {
            mainClassForWasm = mains[0];
        }
    } catch (_) { /* ignore, fall back to detectedClass */ }

    const wasmDiags = [];
    const wasmDiagReg = compiler.onDiagnostic((d) => wasmDiags.push(d));
    let wasmOk;
    try {
        wasmOk = compiler.generateWebAssembly({ outputName: "app", mainClass: mainClassForWasm });
    } finally {
        if (wasmDiagReg && typeof wasmDiagReg.destroy === "function") wasmDiagReg.destroy();
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

    // ---- 5. Retrieve the Wasm module bytes --------------------------
    // The same compiler.wasm-runtime.js load() function works for user wasm too.
    // Output is just "app.wasm"; there is no separate runtime output file.
    let wasmBytes = compiler.getWebAssemblyOutputFile("app.wasm");
    if (!wasmBytes) {
        // Fallback: list actual output files and try the first .wasm one
        const outputFiles = compiler.listWebAssemblyOutputFiles
            ? compiler.listWebAssemblyOutputFiles()
            : [];
        const wasmFile = outputFiles.find(f => f.endsWith(".wasm"));
        if (wasmFile) {
            wasmBytes = compiler.getWebAssemblyOutputFile(wasmFile);
        }
    }

    if (!wasmBytes) {
        throw new Error("Generated Wasm output not found.");
    }

    // ---- 6. Run the instrumented Wasm and collect the trace ---------
    postStatus("Running…");
    const { trace, truncated, stdout } = await runInstrumented(wasmBytes);

    postStatus("Done.");
    self.postMessage({ type: "trace-complete", trace, truncated, stdout });
}

/* ------------------------------------------------------------------ */
/*  Run instrumented Wasm and collect trace                            */
/* ------------------------------------------------------------------ */
async function runInstrumented(wasmBytes) {
    const trace   = [];
    let   truncated = false;
    let   stdout  = "";

    const VIZ_PREFIX = "\u0000VIZ:";

    try {
        // The same load() from compiler.wasm-runtime.js works for user-generated wasm.
        // Pass bytes directly (Int8Array accepted alongside URL strings).
        const userTeavm = await runtimeModule.load(wasmBytes, {
            installImports(o) {
                // Wire up stdout/stderr character-by-character handlers
                let stdoutLine = "";
                let stderrLine = "";
                if (o.teavmConsole) {
                    o.teavmConsole.putcharStdout = (ch) => {
                        if (ch === 0x0A) {
                            stdout += stdoutLine + "\n";
                            stdoutLine = "";
                        } else {
                            stdoutLine += String.fromCharCode(ch);
                        }
                    };
                    o.teavmConsole.putcharStderr = (ch) => {
                        if (ch === 0x0A) {
                            const line = stderrLine;
                            stderrLine = "";
                            if (line.startsWith(VIZ_PREFIX)) {
                                const raw = line.slice(VIZ_PREFIX.length);
                                // Protocol: "step:cls:meth:line:...|name=val|name=val"
                                // Split frames section (before first |) from vars section
                                const pipeIdx   = raw.indexOf("|");
                                const framesRaw = pipeIdx >= 0 ? raw.slice(0, pipeIdx) : raw;
                                const varsRaw   = pipeIdx >= 0 ? raw.slice(pipeIdx + 1) : "";
                                const parts     = framesRaw.split(":");
                                if (parts[0] === "step" && parts.length >= 4) {
                                    if (!truncated) {
                                        const frames = [];
                                        for (let fi = 1; fi + 2 < parts.length; fi += 3) {
                                            frames.push({
                                                className: parts[fi],
                                                method:    parts[fi + 1],
                                                line:      parseInt(parts[fi + 2], 10),
                                            });
                                        }
                                        const vars = varsRaw
                                            ? varsRaw.split("|").map(p => {
                                                const eq = p.indexOf("=");
                                                return eq >= 0
                                                    ? { name: p.slice(0, eq), value: p.slice(eq + 1) }
                                                    : null;
                                            }).filter(Boolean)
                                            : [];
                                        const top = frames[frames.length - 1] || {};
                                        trace.push({
                                            line:      top.line || 0,
                                            className: top.className || "?",
                                            method:    top.method || "?",
                                            frames,
                                            vars,
                                            stdout,
                                        });
                                        if (trace.length >= MAX_STEPS) truncated = true;
                                    }
                                } else if (parts[0] === "truncated") {
                                    truncated = true;
                                }
                            } else {
                                stdout += line + "\n";
                            }
                        } else {
                            stderrLine += String.fromCharCode(ch);
                        }
                    };
                }
            }
        });
        // Run the main() entry point.
        await userTeavm.exports.main([]);
    } catch (e) {
        // A thrown exception from user code is normal (e.g. unhandled RuntimeException).
        stdout += "\n[Exception: " + String(e) + "]\n";
    }

    return { trace, truncated, stdout };
}

/* ------------------------------------------------------------------ */
/*  Source-level Java instrumentation                                   */
/*                                                                      */
/*  Lightweight line-based transformation.  Injects StepRecorder       */
/*  enter/exit/step calls.  A preprocessing pass expands single-line   */
/*  inline returns (e.g. "if (x) { return y; }") to multi-line form   */
/*  so the instrumenter can correctly inject exit() before every       */
/*  return path.                                                        */
/*                                                                      */
/*  Local variable tracking: primitive typed variables declared at     */
/*  method-body scope are reported with each step via varPairs, which  */
/*  the visualizer shows in the Frames & Locals panel.                 */
/*                                                                      */
/*  When compiler.wasm gains a generateVisualizer() API this transform  */
/*  can be replaced with an IR-level call that does it properly.       */
/* ------------------------------------------------------------------ */

/**
 * Expands single-line blocks that contain a bare return statement so the
 * main pass can inject exit() before the return.
 *
 * Example:
 *   if (n <= 1) { return n; }
 * → if (n <= 1) {
 *       return n;
 *   }
 *
 * Returns { lines, originalLineNos } where originalLineNos[i] is the
 * 1-based line number in the ORIGINAL source that preprocessed line i
 * came from.  The step() injections use originalLineNos so that line
 * highlighting aligns with the editor's unmodified source.
 */
function preprocessInlineReturns(rawLines) {
    const lines          = [];
    const originalLineNos = [];
    // Matches: <indent><anything-not-return> { return <expr>; } EOL
    const re = /^(\s*)((?:[^{]|(?!\breturn\b))*)\{\s*(return\s+[^;]+;)\s*\}\s*$/;
    for (let i = 0; i < rawLines.length; i++) {
        const origNo = i + 1;
        const m = re.exec(rawLines[i]);
        if (m) {
            const indent = m[1];
            const before = m[2].trimEnd();
            const ret    = m[3];
            lines.push(`${indent}${before}{`);       originalLineNos.push(origNo);
            lines.push(`${indent}    ${ret}`);        originalLineNos.push(origNo);
            lines.push(`${indent}}`);                 originalLineNos.push(origNo);
        } else {
            lines.push(rawLines[i]);
            originalLineNos.push(origNo);
        }
    }
    return { lines, originalLineNos };
}

/** Parses a method's parameter list and returns [{name, type}] for primitives. */
function parseMethodParams(paramStr) {
    const vars = [];
    if (!paramStr || !paramStr.trim()) return vars;
    for (const p of paramStr.split(",")) {
        const m = p.trim().match(/^(int|long|double|float|boolean|char|byte|short|String)\s+(\w+)$/);
        if (m) vars.push({ name: m[2], type: m[1] });
    }
    return vars;
}

/** Builds the varPairs tail of a StepRecorder.step() call for current vars. */
function buildVarArgs(vars) {
    if (vars.length === 0) return "";
    return ", " + vars.map(v => `"${v.name}", String.valueOf(${v.name})`).join(", ");
}

/**
 * Instruments javaSource with StepRecorder calls.
 *
 * Injects before each executable line:
 *   - StepRecorder.enter(cls, meth)          — first executable line of each method
 *   - StepRecorder.step(cls, meth, line, …)  — every executable line (with var pairs)
 *   - StepRecorder.exit()                    — before every return statement
 *                                              before method's implicit closing }
 *
 * @param {string} javaSource
 * @param {string} className
 * @returns {{ instrumentedSource: string, stepRecorderSource: string }}
 */
function instrumentSource(javaSource, className) {
    const { lines, originalLineNos } = preprocessInlineReturns(javaSource.split("\n"));
    const result = [];

    let insideMethod          = false;
    let currentMethod         = "?";
    let braceDepth            = 0;
    let pendingEnter          = false;
    let lastMethodReturnDepth = -1;
    let methodVars            = [];
    let pendingMethodParams   = [];

    const methodPattern  = /^\s*(?:public|private|protected|static|\s)*(?:void|int|long|double|float|boolean|String|[A-Z]\w*)\s+(\w+)\s*\(([^)]*)\)/;
    const nonExecPattern = /^\s*(\/\/|\/\*|\*|package\s|import\s|class\s|interface\s|enum\s|@|\}|\{|$)/;
    const returnPattern  = /^\s*return\b/;
    const localVarRe     = /^\s*(int|long|double|float|boolean|char|byte|short|String)\s+(\w+)\s*=/;

    for (let i = 0; i < lines.length; i++) {
        const line    = lines[i];
        const trimmed = line.trim();
        const indent  = line.match(/^(\s*)/)[1];

        const methodMatch = methodPattern.exec(line);
        if (methodMatch) {
            currentMethod       = methodMatch[1];
            pendingMethodParams = parseMethodParams(methodMatch[2] || "");
        }

        let opens = 0, closes = 0;
        for (const ch of line) {
            if (ch === "{") opens++;
            else if (ch === "}") closes++;
        }
        const newDepth = braceDepth + opens - closes;

        // Inject exit() before the method's implicit closing brace (void methods, etc.)
        if (insideMethod && newDepth < 2 && lastMethodReturnDepth !== braceDepth) {
            result.push(`${indent}StepRecorder.exit();`);
        }

        const isExec = insideMethod && !nonExecPattern.test(line) && trimmed.length > 0;
        if (isExec) {
            const lineNo  = originalLineNos[i];
            const varArgs = buildVarArgs(methodVars);

            if (pendingEnter) {
                result.push(`${indent}StepRecorder.enter("${className}", "${currentMethod}");`);
                pendingEnter = false;
            }

            if (returnPattern.test(line)) {
                // step() then exit() — step shows the return line, exit() pops the frame
                result.push(`${indent}StepRecorder.step("${className}", "${currentMethod}", ${lineNo}${varArgs});`);
                result.push(`${indent}StepRecorder.exit();`);
                if (braceDepth === 2) lastMethodReturnDepth = braceDepth;
            } else {
                result.push(`${indent}StepRecorder.step("${className}", "${currentMethod}", ${lineNo}${varArgs});`);
                if (braceDepth === 2) lastMethodReturnDepth = -1;
            }
        }

        result.push(line);

        // Record local primitive declarations at method-body depth AFTER step injection
        // so the var appears from the NEXT step onward (once it has a value).
        if (insideMethod && braceDepth === 2) {
            const varMatch = localVarRe.exec(line);
            if (varMatch) methodVars.push({ name: varMatch[2], type: varMatch[1] });
        }

        braceDepth = newDepth;
        if (braceDepth === 2 && opens > closes && !insideMethod) {
            insideMethod          = true;
            pendingEnter          = true;
            lastMethodReturnDepth = -1;
            methodVars            = [...pendingMethodParams];
        } else if (braceDepth < 2) {
            insideMethod  = false;
            pendingEnter  = false;
            methodVars    = [];
        }
    }

    return {
        instrumentedSource: result.join("\n"),
        stepRecorderSource: buildStepRecorderSource(),
    };
}

/**
 * Returns the Java source for the StepRecorder helper class (default package).
 * Tracks a call-stack of frames via enter/exit.
 * Each step() call accepts an optional varargs of name/value string pairs
 * for the active frame's locals.
 *
 * Output format on stderr:
 *   \0VIZ:step:cls0:meth0:line0:...:clsN:methN:lineN|name=val|name=val
 *   (frames outermost→innermost; vars for innermost frame only)
 */
function buildStepRecorderSource() {
    return `
public final class StepRecorder {
    private static final String PREFIX = "\\u0000VIZ:";
    public static final int MAX_STEPS = ${MAX_STEPS};
    private static int stepCount;
    private static boolean truncated;

    private static final int MAX_DEPTH = 64;
    private static final String[] frameClass = new String[MAX_DEPTH];
    private static final String[] frameMeth  = new String[MAX_DEPTH];
    private static final int[]    frameLine  = new int[MAX_DEPTH];
    private static int depth = 0;

    private StepRecorder() {}

    public static void enter(String cls, String meth) {
        if (depth < MAX_DEPTH) {
            frameClass[depth] = cls;
            frameMeth[depth]  = meth;
            frameLine[depth]  = 0;
            depth++;
        }
    }

    public static void exit() {
        if (depth > 0) depth--;
    }

    public static void step(String cls, String meth, int line, String... varPairs) {
        if (truncated) return;
        if (stepCount >= MAX_STEPS) {
            truncated = true;
            System.err.println(PREFIX + "truncated");
            return;
        }
        stepCount++;
        if (depth > 0) frameLine[depth - 1] = line;
        StringBuilder sb = new StringBuilder(PREFIX + "step");
        for (int i = 0; i < depth; i++) {
            sb.append(":").append(frameClass[i])
              .append(":").append(frameMeth[i])
              .append(":").append(frameLine[i]);
        }
        for (int i = 0; i + 1 < varPairs.length; i += 2) {
            sb.append("|").append(varPairs[i]).append("=").append(varPairs[i + 1]);
        }
        System.err.println(sb.toString());
    }

    public static boolean isTruncated() { return truncated; }
    public static int getStepCount()    { return stepCount; }
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
