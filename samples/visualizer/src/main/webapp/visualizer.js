/*
 * Pure-browser Java Visualizer – rendering engine
 *
 * Manages the three-panel UI:
 *   Panel 1 – Code editor with line highlighting
 *   Panel 2 – Frames & Locals
 *   Panel 3 – Heap object graph (SVG)
 *
 * External surface
 * ----------------
 *   Visualizer.init()           – wire up DOM after page load
 *   Visualizer.loadTrace(steps) – accept a finished trace array
 *   Visualizer.goToStep(n)      – jump to step index n
 */

"use strict";

const Visualizer = (() => {
    /* ------------------------------------------------------------------ */
    /*  State                                                               */
    /* ------------------------------------------------------------------ */
    let trace      = [];
    let currentIdx = -1;

    /* ------------------------------------------------------------------ */
    /*  DOM refs (populated in init())                                      */
    /* ------------------------------------------------------------------ */
    let editorEl, editorHighlightEl, overlayEl, framesBodyEl, heapSvgEl, stdoutBodyEl;
    let stepCounterEl, stepSliderEl, prevBtnEl, nextBtnEl;

    // Guard against duplicate event listener registration (init() may be
    // called again on tab-switch / trace reset).
    let listenersAttached = false;

    /* ------------------------------------------------------------------ */
    /*  init                                                                */
    /* ------------------------------------------------------------------ */
    function init() {
        editorEl          = document.getElementById("editor");
        editorHighlightEl = document.getElementById("editor-highlight");
        overlayEl         = document.getElementById("editor-overlay");
        framesBodyEl      = document.getElementById("frames-body");
        heapSvgEl         = document.getElementById("heap-svg");
        stdoutBodyEl      = document.getElementById("stdout-body");
        stepCounterEl     = document.getElementById("step-counter");
        stepSliderEl      = document.getElementById("step-slider");
        prevBtnEl         = document.getElementById("prev-btn");
        nextBtnEl         = document.getElementById("next-btn");

        // Reset trace state
        trace      = [];
        currentIdx = -1;

        // Re-render syntax highlight for whatever source is in the editor
        renderHighlightPre(editorEl.value, 0);

        if (listenersAttached) { return; }
        listenersAttached = true;

        prevBtnEl.addEventListener("click",  () => goToStep(currentIdx - 1));
        nextBtnEl.addEventListener("click",  () => goToStep(currentIdx + 1));
        stepSliderEl.addEventListener("input", () => goToStep(Number(stepSliderEl.value)));

        // Keep the pre-overlay in sync when the textarea is scrolled
        editorEl.addEventListener("scroll", () => {
            if (!editorHighlightEl) { return; }
            editorHighlightEl.scrollTop  = editorEl.scrollTop;
            editorHighlightEl.scrollLeft = editorEl.scrollLeft;
        });

        // Re-render syntax highlight when the user types
        editorEl.addEventListener("input", () => {
            const active = (trace.length > 0 && currentIdx >= 0)
                ? trace[currentIdx].line : 0;
            renderHighlightPre(editorEl.value, active);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  loadTrace                                                           */
    /* ------------------------------------------------------------------ */
    function loadTrace(steps) {
        trace      = steps;
        currentIdx = -1;

        stepSliderEl.min   = "0";
        stepSliderEl.max   = String(Math.max(0, steps.length - 1));
        stepSliderEl.value = "0";

        updateControls();
        if (steps.length > 0) {
            goToStep(0);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  goToStep                                                            */
    /* ------------------------------------------------------------------ */
    function goToStep(idx) {
        if (trace.length === 0) {
            return;
        }
        idx = Math.max(0, Math.min(trace.length - 1, idx));
        currentIdx = idx;

        const step = trace[idx];

        // Update controls
        stepSliderEl.value = String(idx);
        stepCounterEl.textContent = `Step ${idx + 1} / ${trace.length}`;
        updateControls();

        // Panel 1 – highlight line
        highlightLine(step.line);

        // Panel 2 – frames & locals
        renderFrames(step);

        // Panel 3 – heap
        renderHeap(step);

        // Stdout
        stdoutBodyEl.textContent = step.stdout || "";
        stdoutBodyEl.scrollTop   = stdoutBodyEl.scrollHeight;
    }

    function updateControls() {
        prevBtnEl.disabled = currentIdx <= 0;
        nextBtnEl.disabled = currentIdx >= trace.length - 1;
    }

    /* ------------------------------------------------------------------ */
    /*  Panel 1 – line highlight                                            */
    /* ------------------------------------------------------------------ */
    function highlightLine(lineNo) {
        if (!editorHighlightEl) { return; }

        // Toggle .hl-active on the matching .code-line element — no pixel math
        const codelines = editorHighlightEl.querySelectorAll(".code-line");
        codelines.forEach((el, i) => {
            el.classList.toggle("hl-active", i + 1 === lineNo);
        });

        if (!lineNo || lineNo < 1) { return; }

        // Auto-scroll editor so active line is visible
        const lhRaw = window.getComputedStyle(editorEl).lineHeight;
        const lineH = lhRaw === "normal" ? 20 : parseFloat(lhRaw);
        const padTop = parseFloat(window.getComputedStyle(editorEl).paddingTop) || 8;
        const editorH  = editorEl.clientHeight;
        const lineTop  = padTop + (lineNo - 1) * lineH;
        const lineBot  = lineTop + lineH;
        const scrollTop = editorEl.scrollTop;

        if (lineTop < scrollTop + 40 || lineBot > scrollTop + editorH - 40) {
            editorEl.scrollTop = lineTop - editorH / 3;
            editorHighlightEl.scrollTop = editorEl.scrollTop;
            requestAnimationFrame(() => highlightLine(lineNo));
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Panel 2 – frames & locals                                           */
    /* ------------------------------------------------------------------ */
    function renderFrames(step) {
        framesBodyEl.innerHTML = "";

        const frames = step.frames && step.frames.length > 0
            ? step.frames
            : [{ className: step.className, method: step.method, line: step.line }];

        // Render innermost (active) frame first
        const reversed = frames.slice().reverse();
        reversed.forEach((frame, i) => {
            const isActive = i === 0;
            const item = document.createElement("div");
            item.className = "frame-item";

            const title = document.createElement("div");
            title.className = "frame-title" + (isActive ? " active" : "");
            title.innerHTML = `<span>${escHtml(frame.className)}.${escHtml(frame.method)}()</span>`
                + `<span class="frame-loc">:${frame.line || step.line}</span>`;
            item.appendChild(title);

            // Show locals only for active frame
            if (isActive && step.vars && step.vars.length > 0) {
                const locals = document.createElement("div");
                locals.className = "frame-locals";
                for (const v of step.vars) {
                    const row = document.createElement("div");
                    row.className = "local-row";
                    const isRef = v.value && v.value.startsWith("@");
                    row.innerHTML =
                        `<span class="local-name">${escHtml(v.name)}</span>`
                        + `<span class="local-eq">&nbsp;=&nbsp;</span>`
                        + `<span class="local-val${isRef ? " is-ref" : ""}">${escHtml(v.value)}</span>`;
                    locals.appendChild(row);
                }
                item.appendChild(locals);
            }

            framesBodyEl.appendChild(item);
        });

        if (frames.length === 0) {
            framesBodyEl.innerHTML = `<div class="info-msg">No frame data</div>`;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Panel 3 – heap (SVG)                                                */
    /* ------------------------------------------------------------------ */

    /**
     * Parses heap objects from the vars at this step.
     * We look for variables whose value starts with "@" (object reference)
     * and collect them as named heap objects.  For this source-level
     * instrumentation demo, heap objects are synthesized from variable values
     * that follow the convention "@ID:ClassName{field=value,...}".
     *
     * Full heap object tracking requires the IR-level StepInstrumentationTransformer.
     */
    function renderHeap(step) {
        const ns  = "http://www.w3.org/2000/svg";
        const svg = heapSvgEl;

        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        // Arrowhead marker
        const defs   = document.createElementNS(ns, "defs");
        const marker = document.createElementNS(ns, "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "8");
        marker.setAttribute("markerHeight", "6");
        marker.setAttribute("refX", "8");
        marker.setAttribute("refY", "3");
        marker.setAttribute("orient", "auto");
        const poly = document.createElementNS(ns, "polygon");
        poly.setAttribute("points", "0 0, 8 3, 0 6");
        poly.setAttribute("fill", "#888");
        marker.appendChild(poly);
        defs.appendChild(marker);
        svg.appendChild(defs);

        const objects = parseHeapObjects(step.vars || []);

        if (objects.length === 0) {
            const msg = document.createElementNS(ns, "text");
            msg.setAttribute("x", "20");
            msg.setAttribute("y", "30");
            msg.setAttribute("font-size", "12");
            msg.setAttribute("fill", "#999");
            msg.textContent = "No heap objects at this step";
            svg.appendChild(msg);
            return;
        }

        const BOX_W    = 180;
        const ROW_H    = 18;
        const HEADER_H = 22;
        const PAD_X    = 20;
        const PAD_Y    = 20;
        const COL_GAP  = 50;

        // Pass 1: compute box positions so arrows know their targets
        const boxPos = {};   // id -> { x, y, w, h }
        let x = PAD_X;
        for (const obj of objects) {
            const boxH = HEADER_H + obj.fields.length * ROW_H + 8;
            boxPos[obj.id] = { x, y: PAD_Y, w: BOX_W, h: boxH };
            x += BOX_W + COL_GAP;
        }
        const totalW = x;
        let maxY = PAD_Y;

        // Pass 2: draw boxes
        const arrowSpecs = [];   // { x1, y1, x2, y2 }

        for (const obj of objects) {
            const { x: bx, y: by, w: bw, h: bh } = boxPos[obj.id];
            maxY = Math.max(maxY, by + bh);

            const g = document.createElementNS(ns, "g");
            g.setAttribute("class", "heap-obj");
            g.setAttribute("data-id", obj.id);

            const rect = document.createElementNS(ns, "rect");
            rect.setAttribute("x", bx);
            rect.setAttribute("y", by);
            rect.setAttribute("width", bw);
            rect.setAttribute("height", bh);
            rect.setAttribute("rx", "4");
            g.appendChild(rect);

            const titleText = document.createElementNS(ns, "text");
            titleText.setAttribute("x", bx + 8);
            titleText.setAttribute("y", by + 15);
            titleText.setAttribute("class", "heap-obj-title");
            titleText.textContent = `@${obj.id} ${obj.typeName}`;
            g.appendChild(titleText);

            const sep = document.createElementNS(ns, "line");
            sep.setAttribute("x1", bx);
            sep.setAttribute("y1", by + HEADER_H);
            sep.setAttribute("x2", bx + bw);
            sep.setAttribute("y2", by + HEADER_H);
            sep.setAttribute("stroke", "#3498db");
            sep.setAttribute("stroke-width", "1");
            g.appendChild(sep);

            obj.fields.forEach((f, fi) => {
                const rowY = by + HEADER_H + fi * ROW_H + ROW_H - 3;
                const isPtr = /^@\d+$/.test(f.value.trim());

                const nameT = document.createElementNS(ns, "text");
                nameT.setAttribute("x", bx + 8);
                nameT.setAttribute("y", rowY);
                nameT.setAttribute("class", "heap-field-name");
                nameT.textContent = f.name;
                g.appendChild(nameT);

                const valT = document.createElementNS(ns, "text");
                valT.setAttribute("x", bx + 90);
                valT.setAttribute("y", rowY);
                valT.setAttribute("class", isPtr ? "heap-field-ptr" : "heap-field-val");
                valT.textContent = f.value;
                g.appendChild(valT);

                // Collect arrow source/target for pass 3
                if (isPtr) {
                    const targetId = f.value.trim().slice(1);
                    const tbox = boxPos[targetId];
                    if (tbox) {
                        const arrowY = rowY - 4;
                        arrowSpecs.push({
                            x1: bx + bw,     y1: arrowY,
                            x2: tbox.x,      y2: tbox.y + tbox.h / 2,
                        });
                    }
                }
            });

            svg.appendChild(g);
        }

        // Pass 3: draw arrows on top of boxes
        for (const { x1, y1, x2, y2 } of arrowSpecs) {
            const path = document.createElementNS(ns, "path");
            const dx = (x2 - x1) / 2;
            path.setAttribute("d",
                `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
            path.setAttribute("class", "heap-arrow");
            path.setAttribute("marker-end", "url(#arrowhead)");
            svg.appendChild(path);
        }

        svg.setAttribute("width",  Math.max(totalW, 300));
        svg.setAttribute("height", maxY + PAD_Y);
    }


    /**
     * Parses heap objects from variables.
     * Recognizes the format:  @ID:TypeName{field1=val1,field2=val2}
     * produced by StepRecorder.captureVar() when the value is an object.
     *
     * @param {Array<{name:string,value:string}>} vars
     * @returns {Array<{id:string,typeName:string,fields:Array<{name,value}>}>}
     */
    function parseHeapObjects(vars) {
        const objects = [];
        const seen    = new Set();

        for (const v of vars) {
            if (!v.value || !v.value.startsWith("@")) {
                continue;
            }
            // Format: @42:SomeClass{x=1, y=2}  or just  @42
            const m = /^@(\d+)(?::([^{]+))?(?:\{([^}]*)\})?$/.exec(v.value.trim());
            if (!m) {
                continue;
            }
            const id       = m[1];
            const typeName = m[2] || "Object";
            const body     = m[3] || "";

            if (seen.has(id)) {
                continue;
            }
            seen.add(id);

            const fields = body.split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((kv) => {
                    const eq = kv.indexOf("=");
                    return eq >= 0
                        ? { name: kv.slice(0, eq).trim(), value: kv.slice(eq + 1).trim() }
                        : { name: kv, value: "" };
                });

            objects.push({ id, typeName, fields });
        }
        return objects;
    }

    /* ------------------------------------------------------------------ */
    /*  Utility                                                             */
    /* ------------------------------------------------------------------ */
    function escHtml(s) {
        if (!s) {
            return "";
        }
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /* ------------------------------------------------------------------ */
    /*  Syntax highlighting                                                 */
    /* ------------------------------------------------------------------ */
    const JAVA_KW = new Set([
        "abstract","assert","boolean","break","byte","case","catch","char",
        "class","const","continue","default","do","double","else","enum",
        "extends","final","finally","float","for","goto","if","implements",
        "import","instanceof","int","interface","long","native","new","null",
        "package","private","protected","public","return","short","static",
        "strictfp","super","switch","synchronized","this","throw","throws",
        "transient","true","false","try","var","void","volatile","while",
    ]);
    const PRIM_TYPES = new Set([
        "boolean","byte","char","double","float","int","long","short","void","var",
    ]);

    /**
     * Tokenizes one line of Java source into an HTML string with `.syn-*` spans.
     * Handles: line comments, string/char literals, numbers, keywords,
     * primitive types, class names, method calls, and annotations.
     */
    function tokenizeJavaLine(line) {
        let out   = "";
        let i     = 0;
        const n   = line.length;

        function emit(cls, raw) {
            out += cls ? `<span class="${cls}">${escHtml(raw)}</span>` : escHtml(raw);
        }

        while (i < n) {
            // Line comment
            if (line[i] === "/" && line[i + 1] === "/") {
                emit("syn-cmt", line.slice(i));
                break;
            }
            // String literal
            if (line[i] === '"') {
                let j = i + 1;
                while (j < n && !(line[j] === '"' && line[j - 1] !== "\\")) { j++; }
                emit("syn-str", line.slice(i, j + 1));
                i = j + 1;
                continue;
            }
            // Char literal
            if (line[i] === "'") {
                let j = i + 1;
                while (j < n && !(line[j] === "'" && line[j - 1] !== "\\")) { j++; }
                emit("syn-str", line.slice(i, j + 1));
                i = j + 1;
                continue;
            }
            // Number
            if (/\d/.test(line[i]) || (line[i] === "-" && /\d/.test(line[i + 1] || ""))) {
                let j = i + 1;
                while (j < n && /[\d.xXbBa-fA-FLlUu_]/.test(line[j])) { j++; }
                emit("syn-num", line.slice(i, j));
                i = j;
                continue;
            }
            // Annotation
            if (line[i] === "@") {
                let j = i + 1;
                while (j < n && /\w/.test(line[j])) { j++; }
                emit("syn-ann", line.slice(i, j));
                i = j;
                continue;
            }
            // Identifier or keyword
            if (/[a-zA-Z_$]/.test(line[i])) {
                let j = i + 1;
                while (j < n && /[\w$]/.test(line[j])) { j++; }
                const word = line.slice(i, j);
                const after = line[j] || "";
                if (JAVA_KW.has(word) && PRIM_TYPES.has(word)) {
                    emit("syn-type", word);
                } else if (JAVA_KW.has(word)) {
                    emit("syn-kw", word);
                } else if (/[A-Z]/.test(word[0])) {
                    emit("syn-class", word);
                } else if (after === "(") {
                    emit("syn-method", word);
                } else {
                    emit(null, word);
                }
                i = j;
                continue;
            }
            // Everything else: output as-is
            emit(null, line[i]);
            i++;
        }
        return out;
    }

    /**
     * Re-renders the `#editor-highlight` pre-overlay with syntax-highlighted
     * lines, line numbers, and a highlight on `activeLine` (1-based).
     */
    function renderHighlightPre(source, activeLine) {
        if (!editorHighlightEl) { return; }
        const lines = source.split("\n");
        const html = lines.map((line, idx) => {
            const num   = idx + 1;
            const cls   = (num === activeLine) ? "code-line hl-active" : "code-line";
            const lineH = tokenizeJavaLine(line) || "&nbsp;";
            return `<div class="${cls}"><span class="line-num">${num}</span>${lineH}</div>`;
        }).join("");
        editorHighlightEl.innerHTML = html;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                          */
    /* ------------------------------------------------------------------ */
    return { init, loadTrace, goToStep };
})();
