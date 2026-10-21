/* =========================================================
   Simple & Scientific Calculator
   - Own expression parser (no eval) for safe calculation
   ========================================================= */

// ENGINE START
const FUNCS = ["asin", "acos", "atan", "sin", "cos", "tan", "log", "ln", "√"];
let angleMode = "deg"; // "deg" or "rad"

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }

    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const text = src.slice(i, j);
      if (text === "." || (text.match(/\./g) || []).length > 1) throw new Error("Invalid input");
      let value = parseFloat(text);

      // Scientific notation typed with the EXP key, e.g. 2E3 = 2 × 10^3
      if (src[j] === "E") {
        let k = j + 1;
        let sign = 1;
        if (src[k] === "+") k++;
        else if (src[k] === "-" || src[k] === "−") { sign = -1; k++; }
        const digitsStart = k;
        while (k < src.length && /[0-9]/.test(src[k])) k++;
        if (k === digitsStart) throw new Error("Invalid input");
        value *= Math.pow(10, sign * parseInt(src.slice(digitsStart, k), 10));
        j = k;
      }

      tokens.push({ type: "num", value });
      i = j;
      continue;
    }

    const fn = FUNCS.find(f => src.startsWith(f, i));
    if (fn) { tokens.push({ type: "func", value: fn }); i += fn.length; continue; }

    if (ch === "π") { tokens.push({ type: "num", value: Math.PI }); i++; continue; }
    if (ch === "e") { tokens.push({ type: "num", value: Math.E }); i++; continue; }

    const opMap = { "+": "+", "-": "-", "−": "-", "×": "*", "*": "*", "÷": "/", "/": "/",
                    "^": "^", "(": "(", ")": ")", "!": "!", "%": "%" };
    if (opMap[ch]) { tokens.push({ type: "op", value: opMap[ch] }); i++; continue; }

    throw new Error("Invalid input");
  }
  return tokens;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error("Invalid input");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function applyFunc(name, x) {
  const toRad = v => (angleMode === "deg" ? (v * Math.PI) / 180 : v);
  const toAngle = v => (angleMode === "deg" ? (v * 180) / Math.PI : v);
  switch (name) {
    case "sin": return Math.sin(toRad(x));
    case "cos": return Math.cos(toRad(x));
    case "tan":
      if (angleMode === "deg" && Math.abs((x - 90) % 180) === 0) throw new Error("Invalid input");
      return Math.tan(toRad(x));
    case "asin": if (Math.abs(x) > 1) throw new Error("Invalid input"); return toAngle(Math.asin(x));
    case "acos": if (Math.abs(x) > 1) throw new Error("Invalid input"); return toAngle(Math.acos(x));
    case "atan": return toAngle(Math.atan(x));
    case "log": if (x <= 0) throw new Error("Invalid input"); return Math.log10(x);
    case "ln":  if (x <= 0) throw new Error("Invalid input"); return Math.log(x);
    case "√":   if (x < 0) throw new Error("Invalid input"); return Math.sqrt(x);
  }
  throw new Error("Invalid input");
}

function evaluate(src) {
  // Auto-close any open brackets
  const open = (src.match(/\(/g) || []).length;
  const close = (src.match(/\)/g) || []).length;
  if (close > open) throw new Error("Invalid input");
  src += ")".repeat(open - close);

  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const isOp = v => peek() && peek().type === "op" && peek().value === v;
  const startsOperand = () => {
    const t = peek();
    return t && (t.type === "num" || t.type === "func" || (t.type === "op" && t.value === "("));
  };

  function parseExpr() {
    let v = parseTerm();
    while (isOp("+") || isOp("-")) {
      const op = next().value;
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  function parseTerm() {
    let v = parseUnary();
    while (true) {
      if (isOp("*") || isOp("/")) {
        const op = next().value;
        const r = parseUnary();
        if (op === "/") {
          if (r === 0) throw new Error("Cannot divide by 0");
          v /= r;
        } else {
          v *= r;
        }
      } else if (startsOperand()) {
        v *= parseUnary(); // implicit multiplication: 2π, 3(4+5)
      } else break;
    }
    return v;
  }

  function parseUnary() {
    if (isOp("-")) { next(); return -parseUnary(); }
    if (isOp("+")) { next(); return parseUnary(); }
    return parsePower();
  }

  function parsePower() {
    const base = parsePostfix();
    if (isOp("^")) { next(); return Math.pow(base, parseUnary()); }
    return base;
  }

  function parsePostfix() {
    let v = parsePrimary();
    while (isOp("!") || isOp("%")) {
      v = next().value === "!" ? factorial(v) : v / 100;
    }
    return v;
  }

  function parsePrimary() {
    const t = next();
    if (!t) throw new Error("Incomplete expression");
    if (t.type === "num") return t.value;
    if (t.type === "func") {
      if (!isOp("(")) throw new Error("Invalid input");
      next();
      const arg = parseExpr();
      if (!isOp(")")) throw new Error("Invalid input");
      next();
      return applyFunc(t.value, arg);
    }
    if (t.type === "op" && t.value === "(") {
      const v = parseExpr();
      if (!isOp(")")) throw new Error("Invalid input");
      next();
      return v;
    }
    throw new Error("Invalid input");
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error("Invalid input");
  return result;
}

function formatResult(n) {
  if (!Number.isFinite(n)) throw new Error("Invalid input");
  if (Math.abs(n) < 1e-12) return "0"; // clears floating-point noise like sin(180°)
  return parseFloat(n.toPrecision(12)).toString();
}

function calculate(src) {
  return formatResult(evaluate(src));
}
// ENGINE END

/* ---------------- UI ---------------- */
if (typeof document !== "undefined") {
  const calculatorEl = document.getElementById("calculator");
  const exprEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const acBtn = document.getElementById("ac-btn");
  const invBtn = document.getElementById("inv-btn");
  const degBtn = document.getElementById("deg-btn");
  const radBtn = document.getElementById("rad-btn");
  const historyBtn = document.getElementById("history-btn");
  const historyPanel = document.getElementById("history-panel");
  const historyList = document.getElementById("history-list");
  const historyClear = document.getElementById("history-clear");
  const modeToggle = document.getElementById("mode-toggle");

  const OPERATORS = ["+", "−", "×", "÷", "^"];
  const MAX_LEN = 80;

  let expr = "";        // what the user is typing
  let lastExpr = "";    // expression of the last "=" press
  let lastResult = "";  // text shown after "=" (answer or error message)
  let lastAnswer = "";  // last successful answer (used by Ans)
  let justEvaluated = false;
  let hasError = false;
  let invActive = false;
  const history = [];

  // Spaces around operators for display only: 7852÷7 -> 7852 ÷ 7
  const prettify = s => s.replace(/([0-9.)!%πe])([+−×÷])/g, "$1 $2 ");
  // Results use "e" for exponents; the expression syntax uses "E"
  const toExprNumber = s => s.replace("e", "E");

  /* ---------- Rendering ---------- */
  function render() {
    let top, main;
    if (justEvaluated) {
      top = `${prettify(lastExpr)} =`;
      main = lastResult;
    } else {
      top = `Ans = ${lastAnswer || "0"}`;
      main = expr ? prettify(expr) : "0";
    }
    const isError = justEvaluated && hasError;
    exprEl.textContent = top;
    resultEl.textContent = main;
    resultEl.classList.toggle("error", isError);
    resultEl.classList.toggle("long", !isError && main.length > 12);
    resultEl.scrollLeft = resultEl.scrollWidth;
    acBtn.textContent = !justEvaluated && expr ? "CE" : "AC";
  }

  function refreshInv() {
    invBtn.classList.toggle("on", invActive);
    document.querySelectorAll(".key[data-inv-value]").forEach(k => {
      if (!k.dataset.label) k.dataset.label = k.innerHTML;
      k.innerHTML = invActive ? k.dataset.invLabel : k.dataset.label;
    });
  }

  /* ---------- Typing ---------- */
  function startFresh(keepAnswer) {
    if (!justEvaluated) return;
    expr = keepAnswer && !hasError && lastAnswer ? toExprNumber(lastAnswer) : "";
    justEvaluated = false;
    hasError = false;
  }

  function insert(type, value) {
    startFresh(["op", "post", "suffix"].includes(type));
    if (expr.length >= MAX_LEN) return render();

    const last = expr.slice(-1);

    switch (type) {
      case "digit":
        if (value === ".") {
          const segment = expr.match(/[0-9.]*$/)[0];
          if (segment.includes(".") || /E[+\-−]?[0-9]*$/.test(expr)) return render();
          if (segment === "") value = "0.";
        }
        expr += value;
        break;

      case "op":
        if (expr === "") {
          if (value !== "−") return render(); // only a minus sign can start an expression
        } else if (OPERATORS.includes(last)) {
          expr = expr.slice(0, -1);
          if (expr === "" && value !== "−") return render();
        } else if (last === "(" && value !== "−") {
          return render();
        }
        expr += value;
        break;

      case "post":
      case "suffix":
        if (expr === "" || OPERATORS.includes(last) || last === "(") return render();
        expr += value;
        break;

      case "close": {
        const unmatched = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
        if (unmatched <= 0 || OPERATORS.includes(last) || last === "(") return render();
        expr += value;
        break;
      }

      default: // func, const, open
        expr += value;
    }
    render();
  }

  function insertExp() {
    startFresh(true);
    if (!/[0-9]$/.test(expr) || /E[+\-−]?[0-9]*$/.test(expr)) return render();
    expr += "E";
    render();
  }

  function insertAns() {
    const v = lastAnswer || "0";
    insert("const", toExprNumber(v.startsWith("-") ? `(${v})` : v));
  }

  function deleteLast() {
    if (justEvaluated) return clearAll();
    const token = ["asin(", "acos(", "atan(", "sin(", "cos(", "tan(", "log(", "ln(", "√(", "10^(", "e^("]
      .find(t => expr.endsWith(t));
    expr = token ? expr.slice(0, -token.length) : expr.slice(0, -1);
    render();
  }

  function clearAll() {
    expr = "";
    lastExpr = "";
    lastResult = "";
    justEvaluated = false;
    hasError = false;
    render();
  }

  function equals() {
    if (expr === "" || justEvaluated) return;
    lastExpr = expr;
    try {
      lastResult = calculate(expr);
      lastAnswer = lastResult;
      hasError = false;
      addHistory(lastExpr, lastResult);
    } catch (err) {
      lastResult = err.message;
      hasError = true;
    }
    justEvaluated = true;
    render();
  }

  function setAngle(mode) {
    angleMode = mode;
    degBtn.classList.toggle("active", mode === "deg");
    radBtn.classList.toggle("active", mode === "rad");
  }

  /* ---------- History ---------- */
  function addHistory(e, r) {
    history.unshift({ expr: e, result: r });
    if (history.length > 50) history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = "";
    if (history.length === 0) {
      const li = document.createElement("li");
      li.className = "history-empty";
      li.textContent = "No history yet";
      historyList.appendChild(li);
      historyClear.hidden = true;
      return;
    }
    historyClear.hidden = false;
    history.forEach(item => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "history-item";
      const e = document.createElement("span");
      e.className = "exp";
      e.textContent = `${prettify(item.expr)} =`;
      const r = document.createElement("span");
      r.className = "res";
      r.textContent = item.result;
      btn.append(e, r);
      btn.addEventListener("click", () => {
        expr = toExprNumber(item.result);
        justEvaluated = false;
        hasError = false;
        toggleHistory(false);
        render();
      });
      li.appendChild(btn);
      historyList.appendChild(li);
    });
  }

  function toggleHistory(open) {
    const show = open === undefined ? historyPanel.hidden : open;
    historyPanel.hidden = !show;
    historyBtn.setAttribute("aria-expanded", String(show));
  }

  historyBtn.addEventListener("click", () => toggleHistory());
  historyClear.addEventListener("click", () => { history.length = 0; renderHistory(); });

  /* ---------- Events ---------- */
  document.addEventListener("click", e => {
    // Close history when clicking outside it
    if (!historyPanel.hidden && !e.target.closest("#history-panel") && !e.target.closest("#history-btn")) {
      toggleHistory(false);
    }

    // Switch between the scientific and the simple calculator
    if (e.target.closest("#mode-toggle")) {
      const scientific = calculatorEl.classList.toggle("scientific");
      modeToggle.textContent = scientific ? "Simple calculator" : "Scientific calculator";
      return;
    }

    const key = e.target.closest(".key, .seg");
    if (!key || !calculatorEl.contains(key)) return;

    switch (key.dataset.action) {
      case "clear":  return acBtn.textContent === "CE" ? deleteLast() : clearAll();
      case "equals": return equals();
      case "ans":    return insertAns();
      case "exp":    return insertExp();
      case "deg":    return setAngle("deg");
      case "rad":    return setAngle("rad");
      case "inv":    invActive = !invActive; return refreshInv();
    }

    let type = key.dataset.type;
    let value = key.dataset.value;
    if (invActive && key.dataset.invValue) {
      type = key.dataset.invType;
      value = key.dataset.invValue;
      invActive = false;
      refreshInv();
    }
    insert(type, value);
  });

  // Keyboard support
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;

    if (/^[0-9.]$/.test(k)) insert("digit", k);
    else if (k === "+") insert("op", "+");
    else if (k === "-") insert("op", "−");
    else if (k === "*") insert("op", "×");
    else if (k === "/") { e.preventDefault(); insert("op", "÷"); }
    else if (k === "^") insert("op", "^");
    else if (k === "(") insert("open", "(");
    else if (k === ")") insert("close", ")");
    else if (k === "!" || k === "%") insert("post", k);
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
    else if (k === "Backspace") deleteLast();
    else if (k === "Escape" || k === "Delete") clearAll();
  });

  renderHistory();
  render();
}
