/*
 * Pure-browser Java Visualizer – Web Worker
 *
 * Responsibilities
 * ----------------
 *  1. Load compiler.wasm once and cache the Compiler instance.
 *  2. On a "compile" message from the main thread:
 *     a. Compile the user's Java source via compiler.wasm's visualizer API.
 *     b. The compiler installs StepInstrumentationTransformer and
 *        AllFieldsReflectionSupplier before generating user Wasm.
 *     c. Run the resulting Wasm in this worker.
 *     d. Collect the execution trace from \0VIZ lines written to stderr.
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
 * Required visualizer API:
 *   compiler.generateVisualizer({
 *     outputName: "app",
 *     mainClass: "...",
 *     maxSteps: 10000,
 *     transformerClass: "org.teavm.visualizer.StepInstrumentationTransformer",
 *     reflectionSupplierClass: "org.teavm.visualizer.AllFieldsReflectionSupplier"
 *   })
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

    if (typeof compiler.generateVisualizer !== "function") {
        throw new Error("The bundled compiler.wasm does not expose generateVisualizer(). "
            + "Rebuild playground/compiler.wasm from teavm-javac with "
            + "org.teavm.visualizer.StepInstrumentationTransformer and "
            + "org.teavm.visualizer.AllFieldsReflectionSupplier.");
    }

    return runIrCompilation(javaSource, mainClass);
}

/* ------------------------------------------------------------------ */
/*  IR-level compilation path                                          */
/* ------------------------------------------------------------------ */
async function runIrCompilation(javaSource, mainClass) {
    const detectedClass = detectClassName(javaSource) || mainClass;

    postStatus("Compiling…");
    compiler.clearSourceFiles();
    compiler.clearOutputFiles();
    compiler.addSourceFile(detectedClass + ".java", javaSource);

    const diagnostics = [];
    const diagReg = compiler.onDiagnostic((d) => diagnostics.push(d));

    let vizOk;
    try {
        vizOk = compiler.generateVisualizer({
            outputName: "app",
            mainClass: detectedClass,
            maxSteps: MAX_STEPS,
            transformerClass: "org.teavm.visualizer.StepInstrumentationTransformer",
            reflectionSupplierClass: "org.teavm.visualizer.AllFieldsReflectionSupplier",
        });
    } finally {
        if (diagReg && typeof diagReg.destroy === "function") diagReg.destroy();
    }

    for (const d of diagnostics) {
        self.postMessage({
            type:         "diagnostic",
            severity:     d.severity,
            fileName:     d.fileName,
            lineNumber:   d.lineNumber,
            columnNumber: d.columnNumber || 0,
            message:      d.message,
        });
    }

    if (!vizOk) {
        postStatus("Compilation failed.");
        return;
    }

    postStatus("Generating WebAssembly…");
    let wasmBytes = compiler.getWebAssemblyOutputFile("app.wasm");
    if (!wasmBytes) {
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

    // Declare line buffers in the outer function scope so they can be
    // flushed after main() returns (handles output not ending in '\n').
    let stdoutLine = "";
    let stderrLine = "";

    function processStderrLine(line) {
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
            } else if (parts[0] === "var" && trace.length > 0) {
                // IR path: "\0VIZ:var:name=value" — append to current step
                const nvStr = raw.slice(4); // skip "var:"
                const eqIdx = nvStr.indexOf("=");
                if (eqIdx >= 0) {
                    trace[trace.length - 1].vars.push({
                        name: nvStr.slice(0, eqIdx),
                        value: nvStr.slice(eqIdx + 1),
                    });
                }
            }
        } else {
            stdout += line + "\n";
        }
    }

    try {
        // The same load() from compiler.wasm-runtime.js works for user-generated wasm.
        // Pass bytes directly (Int8Array accepted alongside URL strings).
        const userTeavm = await runtimeModule.load(wasmBytes, {
            installImports(o) {
                // Wire up stdout/stderr character-by-character handlers
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
                            processStderrLine(line);
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

    // Flush any partial line that was not terminated by '\n'.
    if (stdoutLine.length > 0) {
        stdout += stdoutLine;
        stdoutLine = "";
    }
    if (stderrLine.length > 0) {
        processStderrLine(stderrLine);
        stderrLine = "";
    }

    return { trace, truncated, stdout };
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                           */
/* ------------------------------------------------------------------ */

/**
 * Attempt to detect the public class name from source text.
 *
 * Handles optional class modifiers (abstract, final, strictfp) and returns
 * a fully-qualified name when a package declaration is present.
 */
function detectClassName(source) {
    const pkgMatch = /^\s*package\s+([\w.]+)\s*;/m.exec(source);
    const pkg = pkgMatch ? pkgMatch[1] + "." : "";
    const m = /\bpublic\s+(?:(?:abstract|final|strictfp)\s+)*class\s+(\w+)/.exec(source);
    return m ? pkg + m[1] : null;
}

function postStatus(message) {
    self.postMessage({ type: "status", message });
}
