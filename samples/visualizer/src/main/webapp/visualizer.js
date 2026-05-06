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
    let editorEl, overlayEl, framesBodyEl, heapSvgEl, stdoutBodyEl;
    let stepCounterEl, stepSliderEl, prevBtnEl, nextBtnEl;

    // Character metrics for the plain-textarea editor line highlighting
    let lineHeightPx  = 0;
    let editorPadPx   = 8;

    /* ------------------------------------------------------------------ */
    /*  init                                                                */
    /* ------------------------------------------------------------------ */
    function init() {
        editorEl      = document.getElementById("editor");
        overlayEl     = document.getElementById("editor-overlay");
        framesBodyEl  = document.getElementById("frames-body");
        heapSvgEl     = document.getElementById("heap-svg");
        stdoutBodyEl  = document.getElementById("stdout-body");
        stepCounterEl = document.getElementById("step-counter");
        stepSliderEl  = document.getElementById("step-slider");
        prevBtnEl     = document.getElementById("prev-btn");
        nextBtnEl     = document.getElementById("next-btn");

        // Compute line height from a sample text node
        computeLineHeight();

        prevBtnEl.addEventListener("click", () => goToStep(currentIdx - 1));
        nextBtnEl.addEventListener("click", () => goToStep(currentIdx + 1));
        stepSliderEl.addEventListener("input", () => goToStep(Number(stepSliderEl.value)));

        // Recompute line height if editor is resized
        new ResizeObserver(computeLineHeight).observe(editorEl);
    }

    function computeLineHeight() {
        // Create a hidden span in a clone of the editor's computed style
        const el = document.createElement("pre");
        el.style.cssText = window.getComputedStyle(editorEl).cssText;
        el.style.visibility = "hidden";
        el.style.position = "absolute";
        el.style.height = "auto";
        el.style.width = "auto";
        el.textContent = "A";
        document.body.appendChild(el);
        lineHeightPx = el.getBoundingClientRect().height;
        el.remove();
        if (lineHeightPx < 4) {
            lineHeightPx = 20; // fallback
        }
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
        // Clear previous highlights
        while (overlayEl.firstChild) {
            overlayEl.removeChild(overlayEl.firstChild);
        }
        if (!lineNo || lineNo < 1) {
            return;
        }

        const scrollTop = editorEl.scrollTop;
        const top  = editorPadPx + (lineNo - 1) * lineHeightPx - scrollTop;
        const bar  = document.createElement("div");
        bar.className = "line-highlight";
        bar.style.top    = top + "px";
        bar.style.height = lineHeightPx + "px";
        overlayEl.appendChild(bar);

        // Scroll editor so the highlighted line is visible
        const editorH  = editorEl.clientHeight;
        const lineTop  = editorPadPx + (lineNo - 1) * lineHeightPx;
        const lineBot  = lineTop + lineHeightPx;
        if (lineTop < scrollTop + 40 || lineBot > scrollTop + editorH - 40) {
            editorEl.scrollTop = lineTop - editorH / 3;
            // Re-render overlay after scroll
            requestAnimationFrame(() => highlightLine(lineNo));
        }
    }

    // Re-render highlight when the editor is scrolled
    window.addEventListener("scroll", () => {
        if (trace.length > 0 && currentIdx >= 0) {
            highlightLine(trace[currentIdx].line);
        }
    }, true);

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

        // Clear previous
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        // Arrowhead marker
        const defs  = document.createElementNS(ns, "defs");
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

        // Collect heap objects from vars using the "@ID:Type{...}" convention
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
        const ROW_H    = 16;
        const HEADER_H = 22;
        const PAD_X    = 30;
        const PAD_Y    = 30;
        const COL_GAP  = 40;

        let x = PAD_X;
        let maxY = PAD_Y;

        for (const obj of objects) {
            const fieldCount = obj.fields.length;
            const boxH = HEADER_H + fieldCount * ROW_H + 8;

            // Group
            const g = document.createElementNS(ns, "g");
            g.setAttribute("class", "heap-obj");
            g.setAttribute("data-id", obj.id);

            // Background rect
            const rect = document.createElementNS(ns, "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", PAD_Y);
            rect.setAttribute("width", BOX_W);
            rect.setAttribute("height", boxH);
            rect.setAttribute("rx", "4");
            g.appendChild(rect);

            // Header: "@1 ClassName"
            const titleText = document.createElementNS(ns, "text");
            titleText.setAttribute("x", x + 8);
            titleText.setAttribute("y", PAD_Y + 15);
            titleText.setAttribute("class", "heap-obj-title");
            titleText.textContent = `@${obj.id} ${obj.typeName}`;
            g.appendChild(titleText);

            // Separator line
            const sep = document.createElementNS(ns, "line");
            sep.setAttribute("x1", x);
            sep.setAttribute("y1", PAD_Y + HEADER_H);
            sep.setAttribute("x2", x + BOX_W);
            sep.setAttribute("y2", PAD_Y + HEADER_H);
            sep.setAttribute("stroke", "#3498db");
            sep.setAttribute("stroke-width", "1");
            g.appendChild(sep);

            // Fields
            obj.fields.forEach((f, fi) => {
                const rowY = PAD_Y + HEADER_H + fi * ROW_H + ROW_H - 3;

                const nameT = document.createElementNS(ns, "text");
                nameT.setAttribute("x", x + 8);
                nameT.setAttribute("y", rowY);
                nameT.setAttribute("class", "heap-field-name");
                nameT.textContent = f.name;
                g.appendChild(nameT);

                const valT = document.createElementNS(ns, "text");
                valT.setAttribute("x", x + 90);
                valT.setAttribute("y", rowY);
                valT.setAttribute("class", "heap-field-val");
                valT.textContent = f.value;
                g.appendChild(valT);
            });

            svg.appendChild(g);

            x += BOX_W + COL_GAP;
            maxY = Math.max(maxY, PAD_Y + boxH);
        }

        svg.setAttribute("width",  Math.max(x, 300));
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
    /*  Public API                                                          */
    /* ------------------------------------------------------------------ */
    return { init, loadTrace, goToStep };
})();
