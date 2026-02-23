/**
 * Passphrase Generator — Application Logic
 * Uses crypto.getRandomValues for cryptographically secure randomness.
 */
(function () {
  "use strict";

  // ── DOM Elements ──────────────────────────────────────
  const wordCountInput = document.getElementById("word-count");
  const separatorInput = document.getElementById("separator");
  const builtinListSelect = document.getElementById("builtin-list");
  const generateBtn = document.getElementById("generate-btn");
  const passphraseOutput = document.getElementById("passphrase-output");
  const passphraseCountEl = document.getElementById("passphrase-count");
  const copyBtn = document.getElementById("copy-btn");
  const validationMsg = document.getElementById("validation-msg");
  const wordTextarea = document.getElementById("word-textarea");
  const fileInput = document.getElementById("file-input");
  const resetBtn = document.getElementById("reset-btn");
  const wordCountInfo = document.getElementById("word-count-info");
  const controlsHeader = document.getElementById("controls-header");
  const controlsToggle = document.getElementById("controls-toggle");
  const controlsBody = document.getElementById("controls-body");
  const includeNumberSelect = document.getElementById("include-number");
  const garbleMaxInput = document.getElementById("garble-max");

  // ── State ─────────────────────────────────────────────
  let activeWords = [];

  // ── Built-in Word Lists ───────────────────────────────
  const BUILTIN_LISTS = {
    shortlist: WORDS_SHORTLIST,
    longlist: WORDS_LONGLIST,
    "3letter": WORDS_3LETTER,
  };

  // ── Garbling rules ───────────────────────────────────
  // mapping of lowercase characters to a single phonetically similar
  // substitution.  used to build variants of words without changing length.
  const PHONETIC_MAP = {
    a: "e",
    b: "p",
    c: "k",
    d: "t",
    e: "i",
    f: "v",
    g: "j",
    i: "y",
    j: "g",
    k: "c",
    l: "r",
    m: "n",
    n: "m",
    o: "u",
    p: "b",
    q: "k",
    r: "l",
    s: "z",
    t: "d",
    u: "o",
    v: "w",
    w: "v",
    x: "z",
    y: "i",
    z: "s",
  };

  /**
   * Return a set of all unique garbled variants of `word` constructed by
   * substituting any subset of mappable letters.  The original word is not
   * included; if no substitution is possible the result is an empty array.
   */
  function garbledVariants(word) {
    // produce variants where exactly one character (if mappable) is replaced
    const results = new Set();
    const letters = word.split("");

    letters.forEach((ch, idx) => {
      const lower = ch.toLowerCase();
      const mapped = PHONETIC_MAP[lower];
      if (!mapped) return;
      const rep = ch === ch.toUpperCase() ? mapped.toUpperCase() : mapped;
      if (rep === ch) return;
      const copy = letters.slice();
      copy[idx] = rep;
      const candidate = copy.join("");
      if (candidate !== word) results.add(candidate);
    });

    return Array.from(results);
  }

  /**
   * Return the list of words to actually use when generating a passphrase.
   * If the garble setting is enabled (garbleMax > 0) we include all unique
   * variants alongside the base words for purposes of counts and statistics.
   */
  function getEffectiveWordList() {
    let list = activeWords.slice();
    const garbleMax = garbleMaxInput ? parseInt(garbleMaxInput.value, 10) || 0 : 0;
    if (garbleMax > 0) {
      const set = new Set(list);
      list.forEach((w) => {
        const vars = garbledVariants(w);
        vars.forEach((v) => set.add(v));
      });
      list = Array.from(set);
    }
    return list;
  }

  // ── Crypto RNG ────────────────────────────────────────

  /**
   * Returns a cryptographically secure random integer in [0, max).
   * Uses rejection sampling to avoid modulo bias.
   */
  function getSecureRandomIndex(max) {
    if (max <= 0) throw new RangeError("max must be > 0");
    const limit = Math.floor(0xffffffff / max) * max; // largest multiple of max ≤ 2^32-1
    let value;
    do {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= limit);
    return value % max;
  }

  // ── Passphrase Generation ─────────────────────────────

  /**
   * Picks `garbleMax` random words from `baseWords` plus garbled variants,
   * then `count` minus `garbleMax` random words from `baseWords`, and returns
   * a joined passphrase where up to `garbleMax` of the chosen words have been
   * replaced with a single-character garbled variant (if available).
   */
  function generatePassphrase(baseWords, count, separator, garbleMax) {
    const picked = [];
    if (garbleMax > 0) {
      let garbledWords = getEffectiveWordList();
      for (let i = 0; i < garbleMax; i++) {
        const w = garbledWords[getSecureRandomIndex(garbledWords.length)];
        picked.push(w);
      }
    }
    for (let i = garbleMax; i < count; i++) {
      const w = baseWords[getSecureRandomIndex(baseWords.length)];
      picked.push(w);
    }

    for (let i = picked.length - 1; i > 0; i--) {
      const j = getSecureRandomIndex(i + 1);
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }

    // capitalize first letter of each word
    const finalWords = picked.map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w));
    return finalWords.join(separator);
  }

  // ── Word List Helpers ─────────────────────────────────

  /**
   * Parses raw text into a clean, deduplicated word array.
   */
  function parseWordList(text) {
    const seen = new Set();
    return text
      .split(/[\r\n,]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => {
        if (!w || seen.has(w)) return false;
        seen.add(w);
        return true;
      });
  }

  /**
   * Loads a built-in word list by key into the textarea and activeWords.
   */
  function loadBuiltinList(key) {
    const words = BUILTIN_LISTS[key];
    if (!words) {
      validationMsg.textContent = "Unknown word list: " + key;
      return;
    }
    activeWords = [...words];
    wordTextarea.value = words.join("\n");
    updateWordCountInfo();
    validationMsg.textContent = "";
  }

  /**
   * Reads a File object and updates the textarea + active word list.
   */
  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const words = parseWordList(text);
      if (words.length === 0) {
        validationMsg.textContent = "Uploaded file contained no valid words.";
        return;
      }
      activeWords = words;
      wordTextarea.value = words.join("\n");
      updateWordCountInfo();
      validationMsg.textContent = "";
    };
    reader.readAsText(file);
  }

  /**
   * Syncs activeWords from the textarea content.
   */
  function syncWordsFromTextarea() {
    activeWords = parseWordList(wordTextarea.value);
    updateWordCountInfo();
  }

  /**
   * Updates the small word-count label.
   */
  function updateWordCountInfo() {
    const base = activeWords.length;
    let text = `${base} words loaded`;
    const garbleMax = garbleMaxInput ? parseInt(garbleMaxInput.value, 10) || 0 : 0;
    if (garbleMax > 0) {
      const total = getEffectiveWordList().length;
      text += ` (+${total - base} variants available, max ${garbleMax})`;
    }
    wordCountInfo.textContent = text;
  }

  // ── UI Wiring ─────────────────────────────────────────

  // Load the default built-in word list
  loadBuiltinList(builtinListSelect.value);

  // Built-in list selector
  builtinListSelect.addEventListener("change", function () {
    if (builtinListSelect.value === "custom") {
      // Switch to custom mode — keep textarea as-is so user can edit
      syncWordsFromTextarea();
    } else {
      loadBuiltinList(builtinListSelect.value);
    }
    generateAndDisplay();
  });

  // auto-generate when any other setting changes
  wordCountInput.addEventListener("input", generateAndDisplay);
  separatorInput.addEventListener("input", generateAndDisplay);
  includeNumberSelect.addEventListener("change", generateAndDisplay);
  wordTextarea.addEventListener("input", function () {
    // if the user types or modifies the textarea, assume they intend to use a
    // custom word list and update the selector accordingly.  (setting
    // `.value` programmatically doesn't fire this handler, so built-in list
    // loads are unaffected.)
    if (builtinListSelect.value !== "custom") {
      builtinListSelect.value = "custom";
    }
    generateAndDisplay();
  });
  if (garbleMaxInput) {
    // ensure initial max matches the word-count control
    garbleMaxInput.max = wordCountInput.value;
    garbleMaxInput.addEventListener("input", function () {
      const maxVal = parseInt(wordCountInput.value, 10) || 0;
      if (parseInt(garbleMaxInput.value, 10) > maxVal) {
        garbleMaxInput.value = maxVal;
      }
      updateWordCountInfo();
      generateAndDisplay();
    });
    // clamp when the word-count changes
    wordCountInput.addEventListener("input", function () {
      const maxVal = parseInt(wordCountInput.value, 10) || 0;
      garbleMaxInput.max = maxVal;
      if (parseInt(garbleMaxInput.value, 10) > maxVal) {
        garbleMaxInput.value = maxVal;
      }
    });
  }

  // core generation logic factored out so it can be invoked from multiple places
  function generateAndDisplay() {
    syncWordsFromTextarea();

    const count = parseInt(wordCountInput.value, 10);
    const separator = separatorInput.value;

    // use the possibly-expanded list when making decisions
    const wordsForGen = getEffectiveWordList();

    // Validate
    if (isNaN(count) || count < 1) {
      validationMsg.textContent = "Word count must be at least 1.";
      return;
    }
    if (wordsForGen.length === 0) {
      validationMsg.textContent = "The word list is empty. Add words or reset to default.";
      return;
    }
    if (wordsForGen.length < count) {
      validationMsg.textContent = `Not enough words (${wordsForGen.length}) for a ${count}-word passphrase. Add more words or reduce the count.`;
      return;
    }

    validationMsg.textContent = "";
    const garbleMax = garbleMaxInput ? parseInt(garbleMaxInput.value, 10) || 0 : 0;
    let passphrase = generatePassphrase(activeWords, count, separator, garbleMax);

    const includeSetting = includeNumberSelect.value; // 'end','anywhere','none'
    const includeNumber = includeSetting !== "none";
    if (includeNumber) {
      const digit = getSecureRandomIndex(10);
      if (includeSetting === "end") {
        passphrase += separator + digit;
      } else if (includeSetting === "anywhere") {
        // insert digit as its own element at a random position among words
        const parts = passphrase.split(separator);
        const pos = getSecureRandomIndex(parts.length + 1);
        parts.splice(pos, 0, digit.toString());
        passphrase = parts.join(separator);
      }
    }

    passphraseOutput.textContent = passphrase;
    passphraseOutput.classList.remove("placeholder");
    copyBtn.disabled = false;

    // update actual length display
    const currentLenEl = document.getElementById("passphrase-current-length");
    currentLenEl.textContent = passphrase.length;

    // compute number of possible passphrases matching the generation logic
    // Model: up to `garbleMax` positions may be garbled variants (from V distinct
    // variants), the remaining positions are base words (B distinct base words).
    // Each sequence is an ordered length-`count` string where the number of
    // variant positions k satisfies 0 <= k <= min(garbleMax, count). For each k
    // there are C(count,k) ways to choose positions, V^k choices for variants,
    // and B^(count-k) choices for base words.
    function binomialBig(n, k) {
      if (k < 0 || k > n) return 0n;
      k = Math.min(k, n - k);
      let res = 1n;
      for (let i = 1; i <= k; i++) {
        res = (res * BigInt(n - k + i)) / BigInt(i);
      }
      return res;
    }

    const Bn = BigInt(activeWords.length);
    const En = BigInt(wordsForGen.length);
    const Vn = En >= Bn ? En - Bn : 0n;
    const maxG = Math.max(0, Math.min(garbleMax, count));
    let possible = 0n;
    for (let k = 0; k <= maxG; k++) {
      const comb = binomialBig(count, k);
      const term = comb * (Vn ** BigInt(k)) * (Bn ** BigInt(count - k));
      possible += term;
    }
    if (includeNumber) {
      // always have 10 choices for digit
      possible *= 10n;
      if (includeSetting === "anywhere") {
        // digit can appear in any of the count+1 slots
        possible *= BigInt(count + 1);
      }
    }
    // format using thousands separators
    const possibleStr = possible.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    passphraseCountEl.textContent = possibleStr;

    // compute strength in bits (base-2 logarithm)
    // converting to Number is safe for typical ranges
    const strength = Math.log2(Number(possible));
    const strengthStr = Math.floor(strength).toString();
    const strengthEl = document.getElementById("passphrase-strength");
    strengthEl.textContent = `${strengthStr}`;

    // compute possible length range based on wordsForGen lengths
    const lengths = wordsForGen.map((w) => w.length);
    const minWord = Math.min(...lengths);
    const maxWord = Math.max(...lengths);
    let minLen = minWord * count;
    let maxLen = maxWord * count;
    if (separator) {
      minLen += separator.length * (count - 1);
      maxLen += separator.length * (count - 1);
    }
    if (includeNumber) {
      // separator before digit as done above
      minLen += separator.length + 1;
      maxLen += separator.length + 1;
    }
    const minLenEl = document.getElementById("passphrase-min-length");
    const maxLenEl = document.getElementById("passphrase-max-length");
    minLenEl.textContent = `${minLen}`;
    maxLenEl.textContent = `${maxLen}`;
  }

  // Generate button
  generateBtn.addEventListener("click", generateAndDisplay);


  // Copy button
  copyBtn.addEventListener("click", function () {
    const text = passphraseOutput.textContent;
    if (!text) return;

    navigator.clipboard.writeText(text).then(function () {
      const original = copyBtn.textContent;
      copyBtn.textContent = "Copied ✓";
      copyBtn.classList.add("copy-feedback");
      setTimeout(function () {
        copyBtn.textContent = original;
        copyBtn.classList.remove("copy-feedback");
      }, 1500);
    });
  });

  // File upload
  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      loadFile(fileInput.files[0]);
      builtinListSelect.value = "custom";
    }
    fileInput.value = ""; // allow re-uploading the same file
  });

  // Reset to default
  resetBtn.addEventListener("click", function () {
    builtinListSelect.value = "shortlist";
    loadBuiltinList("shortlist");
    if (garbleMaxInput) garbleMaxInput.value = 0;
  });

  // Toggle controls section
  if (controlsHeader && controlsBody && controlsToggle) {
    // ensure initial collapsed state
    controlsBody.classList.add("collapsed");
    controlsToggle.textContent = "Show ▾";

    controlsHeader.addEventListener("click", function () {
      const isCollapsed = controlsBody.classList.toggle("collapsed");
      controlsToggle.textContent = isCollapsed ? "Show ▾" : "Hide ▴";
    });
  }

  // Allow Enter key to generate
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && document.activeElement !== wordTextarea) {
      generateBtn.click();
    }
  });

  // Automatically generate a passphrase once the page has initialized
  // (ensures default word list is loaded first).
  generateBtn.click();
})();
