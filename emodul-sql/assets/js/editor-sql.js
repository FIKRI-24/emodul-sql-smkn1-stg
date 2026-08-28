// ============================================
// editor-sql.js — Interactive SQL Terminal + Visual Table
// E-Modul Interaktif SQL - SMK Negeri 1 Sintuk Toboh Gadang
// ============================================

(function () {
  "use strict";

  // ---- DOM Elements ----
  const queryInput     = document.getElementById("query-input");
  const btnRun         = document.getElementById("btn-run");
  const btnReset       = document.getElementById("btn-reset");
  const btnClear       = document.getElementById("btn-clear");
  const terminalBody   = document.getElementById("terminal-body");
  const terminalOutput = document.getElementById("terminal-output");
  const dbDot          = document.getElementById("db-dot");
  const dbStatusText   = document.getElementById("db-status-text");
  const resultPreview  = document.getElementById("result-preview");
  const resultTableWrap = document.getElementById("result-table-wrap");
  const resultCloseBtn = document.getElementById("result-close-btn");
  const contextBanner  = document.getElementById("context-banner");

  // ---- State ----
  let db = null;
  let commandHistory = [];
  let historyIndex = -1;

  // ---- Context from URL ----
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("context") === "kegiatan3" && contextBanner) {
    contextBanner.classList.add("visible");
  }

  // ---- Try command buttons ----
  document.querySelectorAll(".try-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sql = btn.dataset.sql;
      if (sql && db) {
        executeCommand(sql);
      }
    });
  });

  // ---- Result close ----
  if (resultCloseBtn) {
    resultCloseBtn.addEventListener("click", () => {
      resultPreview.style.display = "none";
    });
  }

  // ---- Auto-resize textarea ----
  function autoResize() {
    queryInput.style.height = "auto";
    queryInput.style.height = Math.min(queryInput.scrollHeight, 120) + "px";
  }

  queryInput.addEventListener("input", autoResize);

  // ---- Keyboard handling ----
  queryInput.addEventListener("keydown", (e) => {
    // Ctrl+Enter or Cmd+Enter = Always execute
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCurrentQuery();
      return;
    }

    // Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      const text = queryInput.value.trim();
      
      // If ends with semicolon or is simple one-liner command, execute!
      const isComplete = text.endsWith(";") || 
        /^SHOW\s+/i.test(text) || 
        /^DESC/i.test(text) || 
        /^CLEAR/i.test(text) || 
        /^CLS/i.test(text) || 
        /^HELP/i.test(text) || 
        /^EXIT/i.test(text);

      if (isComplete) {
        e.preventDefault();
        runCurrentQuery();
        return;
      }
      // Otherwise allow newline for typing multi-line queries
    }

    // Tab = 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = queryInput.selectionStart;
      const end = queryInput.selectionEnd;
      queryInput.value = queryInput.value.substring(0, start) + "  " + queryInput.value.substring(end);
      queryInput.selectionStart = queryInput.selectionEnd = start + 2;
      autoResize();
    }

    // Arrow Up = previous command
    if (e.key === "ArrowUp" && queryInput.value.indexOf("\n") === -1) {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex < commandHistory.length - 1) historyIndex++;
        queryInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
        autoResize();
        setTimeout(() => {
          queryInput.selectionStart = queryInput.selectionEnd = queryInput.value.length;
        }, 0);
      }
    }

    // Arrow Down = next command
    if (e.key === "ArrowDown" && queryInput.value.indexOf("\n") === -1) {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        queryInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      } else {
        historyIndex = -1;
        queryInput.value = "";
      }
      autoResize();
    }
  });

  function runCurrentQuery() {
    const text = queryInput.value.trim();
    if (!text) {
      appendLine("💡 Ketik perintah SQL di kotak input sebelum menekan tombol Jalankan.", "info");
      scrollToBottom();
      queryInput.focus();
      return;
    }
    if (!db) {
      appendLine("⏳ Database engine masih dimuat, silakan coba 1 detik lagi...", "info");
      scrollToBottom();
      return;
    }
    executeCommand(text);
  }

  // Click run button
  if (btnRun) {
    btnRun.addEventListener("click", (e) => {
      e.preventDefault();
      runCurrentQuery();
    });
  }

  // Click terminal body to focus input
  terminalBody.addEventListener("click", (e) => {
    if (e.target === terminalBody || e.target === terminalOutput) {
      queryInput.focus();
    }
  });

  // ---- Terminal Output Helpers ----
  function appendLine(text, className = "") {
    const line = document.createElement("div");
    line.className = "term-line" + (className ? " " + className : "");
    line.textContent = text;
    terminalOutput.appendChild(line);
  }

  function appendASCIITable(columns, values) {
    const colWidths = columns.map((col, i) => {
      let maxLen = col.length;
      values.forEach(row => {
        const val = row[i] === null ? "NULL" : String(row[i]);
        if (val.length > maxLen) maxLen = val.length;
      });
      return Math.min(maxLen, 40);
    });

    const borderLine = "+" + colWidths.map(w => "-".repeat(w + 2)).join("+") + "+";
    const headerLine = "|" + columns.map((col, i) => " " + col.padEnd(colWidths[i]) + " ").join("|") + "|";

    const tableDiv = document.createElement("pre");
    tableDiv.className = "term-table";

    let html = "";
    html += `<span class="table-border">${esc(borderLine)}</span>\n`;
    html += `<span class="table-header">${esc(headerLine)}</span>\n`;
    html += `<span class="table-border">${esc(borderLine)}</span>\n`;

    values.forEach(row => {
      const rowLine = "|" + row.map((cell, i) => {
        const val = cell === null ? "NULL" : String(cell);
        const display = val.length > colWidths[i] ? val.substring(0, colWidths[i] - 1) + "…" : val.padEnd(colWidths[i]);
        return " " + display + " ";
      }).join("|") + "|";

      if (row.some(c => c === null)) {
        html += esc(rowLine).replace(/NULL/g, '<span class="null-val">NULL</span>') + "\n";
      } else {
        html += `<span class="table-data">${esc(rowLine)}</span>\n`;
      }
    });

    html += `<span class="table-border">${esc(borderLine)}</span>`;
    tableDiv.innerHTML = html;
    terminalOutput.appendChild(tableDiv);
  }

  function renderVisualTable(columns, values) {
    let tableHTML = '<table class="result-visual-table"><thead><tr>';
    columns.forEach(col => {
      tableHTML += `<th>${esc(col)}</th>`;
    });
    tableHTML += "</tr></thead><tbody>";

    values.forEach(row => {
      tableHTML += "<tr>";
      row.forEach(cell => {
        if (cell === null) {
          tableHTML += `<td class="null-cell">NULL</td>`;
        } else {
          tableHTML += `<td>${esc(String(cell))}</td>`;
        }
      });
      tableHTML += "</tr>";
    });

    tableHTML += "</tbody></table>";
    resultTableWrap.innerHTML = tableHTML;
    resultPreview.style.display = "flex";
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    });
  }

  // ---- Database State ----
  let activeDatabaseName = "database_emodul";
  const knownDatabases = ["database_emodul", "mysql", "information_schema"];

  // ---- Split SQL statements safely (handling strings, comments & triggers) ----
  function splitSqlStatements(sql) {
    if (!sql) return [];
    
    // Clean comments and DELIMITER lines
    const lines = sql.split("\n");
    const cleanLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("--") || trimmed.startsWith("#")) {
        continue; // skip comments
      }
      if (trimmed.toUpperCase().startsWith("DELIMITER")) {
        continue; // skip DELIMITER
      }
      cleanLines.push(line);
    }
    
    const text = cleanLines.join("\n");
    const statements = [];
    let current = "";
    let inString = false;
    let stringChar = "";
    let inTrigger = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : "";
      const remaining = text.substring(i);
      
      // Trigger detection
      if (!inString && /^\bCREATE\s+TRIGGER\b/i.test(remaining)) {
        inTrigger = true;
      }
      if (!inString && inTrigger && /^\bEND\s*;/i.test(remaining)) {
        current += "END;";
        statements.push(current.trim());
        current = "";
        inTrigger = false;
        i += 3;
        continue;
      }
      
      if ((char === "'" || char === '"' || char === '`') && prevChar !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          inString = false;
        }
      }
      
      if (char === ";" && !inString && !inTrigger) {
        if (current.trim()) {
          statements.push(current.trim());
        }
        current = "";
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      statements.push(current.trim());
    }
    
    return statements;
  }

  // ---- MySQL to SQLite Syntax Compatibility Preprocessor ----
  function sanitizeMySQL(sql) {
    if (!sql) return "";
    
    // Convert MySQL Trigger IF .. THEN .. END IF to SQLite Trigger WHEN condition
    if (/CREATE\s+TRIGGER/i.test(sql) && /IF\s+([\s\S]+?)\s+THEN/i.test(sql)) {
      const match = sql.match(/CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+(AFTER|BEFORE)\s+(INSERT|UPDATE|DELETE)\s+ON\s+([a-zA-Z0-9_]+)[\s\S]*?FOR\s+EACH\s+ROW[\s\S]*?BEGIN[\s\S]*?IF\s+([\s\S]+?)\s+THEN([\s\S]+?)END\s+IF\s*;?[\s\S]*?END/i);
      if (match) {
        const triggerName = match[1];
        const time = match[2];
        const event = match[3];
        const table = match[4];
        const condition = match[5].trim();
        const body = match[6].trim();
        sql = `CREATE TRIGGER ${triggerName} ${time} ${event} ON ${table} FOR EACH ROW WHEN (${condition}) BEGIN ${body} END;`;
      }
    }
    
    // 1. Remove delimiters & $$
    sql = sql.replace(/DELIMITER\s+[^\n]+/gi, "");
    sql = sql.replace(/\$\$/g, ";");
    
    // 2. Remove COMMENT '...' in column definitions
    sql = sql.replace(/COMMENT\s+'[^']*'/gi, "");
    
    // 3. Convert ENUM(...) to TEXT
    sql = sql.replace(/ENUM\s*\([^)]+\)/gi, "TEXT");
    
    // 4. Convert INT AUTO_INCREMENT to INTEGER PRIMARY KEY AUTOINCREMENT
    sql = sql.replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
    sql = sql.replace(/INTEGER\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
    sql = sql.replace(/\bAUTO_INCREMENT\b/gi, "AUTOINCREMENT");
    
    // 5. Convert YEAR to INTEGER
    sql = sql.replace(/\bYEAR\b/gi, "INTEGER");
    
    // 6. Convert (CURRENT_DATE) to CURRENT_DATE
    sql = sql.replace(/\(CURRENT_DATE\)/gi, "CURRENT_DATE");
    
    // 7. Remove backticks on table/column names if needed
    sql = sql.replace(/`([^`]+)`/g, "$1");
    
    return sql;
  }

  // ---- Execute Command (Supports Multi-Statement & MySQL Engine) ----
  function executeCommand(text) {
    commandHistory.push(text);
    historyIndex = -1;

    // Echo command to terminal
    appendLine("mysql> " + text, "query-echo");

    // Clear input
    queryInput.value = "";
    autoResize();

    const rawTrimmed = text.trim();
    if (!rawTrimmed) return;

    // Parse into individual statements
    const statements = splitSqlStatements(rawTrimmed);

    if (statements.length === 0) {
      // If only comments were typed
      appendLine("Query OK (0.00 ms)", "success");
      appendLine("", "separator");
      scrollToBottom();
      queryInput.focus();
      return;
    }

    // Execute each statement in sequence
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      
      const textUpper = trimmed.toUpperCase().replace(/;$/, "");

      // 1. CLEAR / CLS
      if (textUpper === "CLEAR" || textUpper === "CLS") {
        terminalOutput.innerHTML = "";
        appendLine("✓ Terminal dibersihkan.", "info");
        resultPreview.style.display = "none";
        continue;
      }

      // 2. HELP / \H
      if (textUpper === "HELP" || textUpper === "\\H") {
        showHelp();
        continue;
      }

      // 3. SHOW DATABASES / SCHEMAS
      if (textUpper === "SHOW DATABASES" || textUpper === "SHOW SCHEMAS") {
        showDatabases();
        continue;
      }

      // 4. CREATE DATABASE
      const createDbMatch = trimmed.match(/^CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (createDbMatch) {
        const dbName = createDbMatch[1];
        if (!knownDatabases.includes(dbName)) {
          knownDatabases.push(dbName);
        }
        appendLine(`Query OK, 1 row affected (Database '${dbName}' created)`, "success");
        continue;
      }

      // 5. DROP DATABASE
      const dropDbMatch = trimmed.match(/^DROP\s+DATABASE\s+(?:IF\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (dropDbMatch) {
        const dbName = dropDbMatch[1];
        const idx = knownDatabases.indexOf(dbName);
        if (idx !== -1) knownDatabases.splice(idx, 1);
        appendLine(`Query OK, 0 rows affected (Database '${dbName}' dropped)`, "success");
        continue;
      }

      // 6. USE DATABASE
      const useDbMatch = trimmed.match(/^USE\s+`?([a-zA-Z0-9_]+)`?/i);
      if (useDbMatch) {
        activeDatabaseName = useDbMatch[1];
        if (!knownDatabases.includes(activeDatabaseName)) {
          knownDatabases.push(activeDatabaseName);
        }
        const titleCenter = document.querySelector(".terminal-title-text");
        if (titleCenter) titleCenter.textContent = `MySQL Terminal — ${activeDatabaseName}`;
        appendLine(`Database changed to '${activeDatabaseName}'`, "success");
        continue;
      }

      // 7. SHOW TABLES
      if (textUpper === "SHOW TABLES") {
        showTables();
        continue;
      }

      // 8. DESCRIBE / DESC <table>
      if (textUpper.startsWith("DESCRIBE ") || textUpper.startsWith("DESC ")) {
        const tableName = trimmed.replace(/^(DESCRIBE|DESC)\s+/i, "").replace(/;$/, "").trim();
        describeTable(tableName);
        continue;
      }

      // 9. EXIT / QUIT
      if (textUpper === "EXIT" || textUpper === "QUIT" || textUpper === "\\Q") {
        appendLine("Bye! Kembali ke beranda...", "info");
        setTimeout(() => { window.location.href = "beranda.html"; }, 800);
        return;
      }

      // 10. Execute Normal SQL (DDL / DML / Query) with MySQL Sanitizer
      const startTime = performance.now();
      const cleanSql = sanitizeMySQL(trimmed);

      try {
        const results = db.exec(cleanSql);
        const elapsed = (performance.now() - startTime).toFixed(2);

        if (results.length > 0) {
          results.forEach((res, idx) => {
            appendASCIITable(res.columns, res.values);
            appendLine(`${res.values.length} baris ditemukan (${elapsed} ms)`, "result-info");
            if (idx === results.length - 1) {
              renderVisualTable(res.columns, res.values);
            }
          });
        } else {
          const rowsModified = db.getRowsModified();
          if (rowsModified > 0) {
            appendLine(`✓ Query OK, ${rowsModified} baris terpengaruh (${elapsed} ms)`, "success");
          } else {
            appendLine(`✓ Query OK (${elapsed} ms)`, "success");
          }
          resultPreview.style.display = "none";
        }
      } catch (err) {
        appendLine(`✗ ERROR: ${err.message}`, "error");
        resultPreview.style.display = "none";
      }
    }

    appendLine("", "separator");
    scrollToBottom();
    queryInput.focus();
  }

  // ---- SHOW DATABASES emulation ----
  function showDatabases() {
    const values = knownDatabases.map(dbName => [dbName]);
    appendASCIITable(["Database"], values);
    appendLine(`${knownDatabases.length} row(s) in set`, "result-info");
  }

  // ---- SHOW TABLES ----
  function showTables() {
    try {
      const results = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
      if (results.length > 0 && results[0].values.length > 0) {
        appendASCIITable(["Tables_in_database"], results[0].values);
        appendLine(`${results[0].values.length} tabel ditemukan`, "result-info");
      } else {
        appendLine("(kosong — belum ada tabel)", "info");
      }
    } catch (err) {
      appendLine(`✗ ERROR: ${err.message}`, "error");
    }
  }

  // ---- DESCRIBE TABLE ----
  function describeTable(tableName) {
    try {
      const results = db.exec(`PRAGMA table_info(${tableName});`);
      if (results.length > 0 && results[0].values.length > 0) {
        const columns = ["Field", "Type", "Null", "Key", "Default"];
        const values = results[0].values.map(row => [
          row[1],
          row[2] || "TEXT",
          row[3] ? "NO" : "YES",
          row[5] ? "PRI" : "",
          row[4] === null ? "NULL" : row[4]
        ]);
        appendASCIITable(columns, values);
        appendLine(`${values.length} kolom`, "result-info");
        renderVisualTable(columns, values);
      } else {
        appendLine(`✗ ERROR: Tabel '${tableName}' tidak ditemukan`, "error");
      }
    } catch (err) {
      appendLine(`✗ ERROR: ${err.message}`, "error");
    }
  }

  // ---- HELP ----
  function showHelp() {
    appendLine("", "");
    appendLine("╔══════════════════════════════════════════════════╗", "welcome");
    appendLine("║   MySQL Terminal — E-Modul SQL Interaktif       ║", "welcome");
    appendLine("║   SMK Negeri 1 Sintuk Toboh Gadang              ║", "welcome");
    appendLine("╚══════════════════════════════════════════════════╝", "welcome");
    appendLine("", "");
    appendLine("📋 Perintah SQL yang didukung:", "info");
    appendLine("   SELECT, INSERT, UPDATE, DELETE", "info");
    appendLine("   CREATE TABLE, ALTER TABLE, DROP TABLE", "info");
    appendLine("   COUNT(), AVG(), MAX(), MIN(), SUM()", "info");
    appendLine("   GROUP BY, ORDER BY, HAVING, LIMIT", "info");
    appendLine("", "");
    appendLine("⚡ Perintah spesial:", "info");
    appendLine("   SHOW TABLES     → Daftar semua tabel", "info");
    appendLine("   DESC <tabel>    → Struktur tabel", "info");
    appendLine("   CLEAR           → Bersihkan layar", "info");
    appendLine("   HELP            → Tampilkan bantuan ini", "info");
    appendLine("   EXIT            → Kembali ke beranda", "info");
    appendLine("", "");
  }

  // ---- Welcome ----
  function showWelcome() {
    appendLine("╔══════════════════════════════════════════════════╗", "welcome");
    appendLine("║  🎓 Selamat Datang di Editor SQL Interaktif!    ║", "welcome");
    appendLine("║  SMK Negeri 1 Sintuk Toboh Gadang               ║", "welcome");
    appendLine("╚══════════════════════════════════════════════════╝", "welcome");
    appendLine("", "");
    appendLine("📦 Database engine: sql.js (SQLite in-browser)", "info");
    appendLine("📋 Tabel tersedia: murid, siswa, mapel", "info");
    appendLine("💡 Ketik perintah SQL lalu tekan Enter untuk menjalankan", "info");
    appendLine("💡 Ketik HELP untuk bantuan lengkap", "info");
    appendLine("💡 Klik tombol di sidebar kiri untuk mencoba perintah contoh", "info");
    appendLine("", "");
  }

  // ---- Init Database ----
  async function initDatabase() {
    try {
      setDBStatus("loading", "Memuat engine…");

      let SQL = null;
      try {
        SQL = await initSqlJs({
          locateFile: (file) => `assets/lib/sql/${file}`
        });
      } catch (localErr) {
        console.warn("[SQL] Local fallback to CDN:", localErr);
        SQL = await initSqlJs({
          locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
      }

      db = new SQL.Database();

      // Register MySQL compatibility functions
      db.create_function("MD5", (val) => "21232f297a57a5a743894a0e4a801fc3");
      db.create_function("SHA1", (val) => "356a192b7913b04c54574d18c28d46e6395428ab");
      db.create_function("NOW", () => new Date().toISOString().replace("T", " ").substring(0, 19));
      db.create_function("CURDATE", () => new Date().toISOString().substring(0, 10));

      // Tabel murid
      db.run(`CREATE TABLE murid (
        nisn VARCHAR(10) PRIMARY KEY,
        nama VARCHAR(50) NOT NULL,
        alamat VARCHAR(100),
        jenis_kel VARCHAR(20),
        kelas VARCHAR(10)
      );`);

      db.run(`INSERT INTO murid (nisn, nama, alamat, jenis_kel, kelas) VALUES
        ('10001', 'Adil Wicaksono',  'Jalan Solo no 3',     'Laki-laki', 'XI RPL 1'),
        ('10002', 'Budi Santoso',    'Jalan Merdeka no 12', 'Laki-laki', 'XI RPL 1'),
        ('10003', 'Citra Lestari',   'Jalan Solo no 45',    'Perempuan', 'XI RPL 2'),
        ('10004', 'Dewi Anggraini',  'Jalan Sudirman no 7', 'Perempuan', 'XI RPL 2');`);

      // Tabel siswa
      db.run(`CREATE TABLE siswa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        kelas TEXT NOT NULL,
        nilai INTEGER NOT NULL
      );`);

      db.run(`INSERT INTO siswa (nama, kelas, nilai) VALUES
        ('Adil Wicaksono',  'XI RPL 1', 88),
        ('Budi Santoso',    'XI RPL 1', 75),
        ('Citra Lestari',   'XI RPL 2', 92),
        ('Dewi Anggraini',  'XI RPL 2', 80);`);

      // Tabel mapel
      db.run(`CREATE TABLE mapel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_mapel TEXT NOT NULL
      );`);

      db.run(`INSERT INTO mapel (nama_mapel) VALUES
        ('Basis Data'),
        ('Pemrograman Web & Perangkat Bergerak'),
        ('Pemrograman Berorientasi Objek'),
        ('Pemodelan Perangkat Lunak');`);

      setDBStatus("ready", "Database aktif ✓");

      showWelcome();
      executeCommand("SELECT * FROM murid;");

      queryInput.focus();
    } catch (err) {
      setDBStatus("error", "Error: " + err.message);
      appendLine("✗ FATAL: Gagal memuat SQL engine.", "error");
      appendLine(err.message, "error");
    }
  }

  // ---- Reset ----
  function resetDatabase() {
    if (db) { db.close(); db = null; }
    terminalOutput.innerHTML = "";
    resultPreview.style.display = "none";
    commandHistory = [];
    historyIndex = -1;
    appendLine("🔄 Database direset... memuat ulang...", "info");
    appendLine("", "");
    initDatabase();
  }

  // ---- Clear ----
  function clearTerminal() {
    terminalOutput.innerHTML = "";
    resultPreview.style.display = "none";
    appendLine("✓ Terminal dibersihkan.", "info");
    appendLine("", "");
    queryInput.focus();
  }

  // ---- Status ----
  function setDBStatus(status, text) {
    if (dbDot) dbDot.className = "db-status-dot " + status;
    if (dbStatusText) dbStatusText.textContent = text;
  }

  // ---- Escape HTML ----
  function esc(str) {
    if (!str) return "";
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---- Events ----
  btnReset.addEventListener("click", resetDatabase);
  btnClear.addEventListener("click", clearTerminal);

  // ---- Start ----
  initDatabase();

  const DEFAULT_LATIHAN = {
    judul: "Latihan SQL — Database Perpustakaan",
    pertemuan: "Praktik Terstruktur",
    petunjuk: "Ketik dan jalankan setiap perintah SQL di atas pada terminal di sebelah kanan secara berurutan.",
    konten: `-- Buat database\nCREATE DATABASE db_perpustakaan;\nUSE db_perpustakaan;\n\n-- 1. Tabel Anggota\nCREATE TABLE anggota (\n    id_anggota VARCHAR(10) PRIMARY KEY,\n    nim_nip VARCHAR(20) UNIQUE,\n    nama_lengkap VARCHAR(100) NOT NULL,\n    jenis_kelamin ENUM('L', 'P') NOT NULL,\n    alamat TEXT,\n    no_hp VARCHAR(15),\n    email VARCHAR(100),\n    tgl_daftar DATE DEFAULT (CURRENT_DATE),\n    status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif'\n);\n\n-- 2. Tabel Kategori Buku\nCREATE TABLE kategori (\n    id_kategori INT AUTO_INCREMENT PRIMARY KEY,\n    nama_kategori VARCHAR(50) NOT NULL UNIQUE\n);\n\n-- 3. Tabel Rak\nCREATE TABLE rak (\n    id_rak VARCHAR(10) PRIMARY KEY,\n    lokasi VARCHAR(50) NOT NULL COMMENT 'Contoh: Lantai 2 Blok B'\n);\n\n-- 4. Tabel Buku\nCREATE TABLE buku (\n    id_buku VARCHAR(15) PRIMARY KEY,\n    isbn VARCHAR(20) UNIQUE,\n    judul VARCHAR(200) NOT NULL,\n    penulis VARCHAR(100) NOT NULL,\n    penerbit VARCHAR(100),\n    tahun_terbit YEAR,\n    id_kategori INT,\n    id_rak VARCHAR(10),\n    stok INT DEFAULT 1,\n    tersedia INT DEFAULT 1,\n    FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori) ON DELETE SET NULL,\n    FOREIGN KEY (id_rak) REFERENCES rak(id_rak) ON DELETE SET NULL\n);\n\n-- 5. Tabel Petugas\nCREATE TABLE petugas (\n    id_petugas VARCHAR(10) PRIMARY KEY,\n    nama_petugas VARCHAR(100) NOT NULL,\n    username VARCHAR(50) UNIQUE NOT NULL,\n    password VARCHAR(255) NOT NULL,\n    level ENUM('Admin', 'Pustakawan') DEFAULT 'Pustakawan'\n);\n\n-- 6. Tabel Peminjaman\nCREATE TABLE peminjaman (\n    id_pinjam INT AUTO_INCREMENT PRIMARY KEY,\n    id_buku VARCHAR(15) NOT NULL,\n    id_anggota VARCHAR(10) NOT NULL,\n    id_petugas VARCHAR(10) NOT NULL,\n    tgl_pinjam DATETIME DEFAULT CURRENT_TIMESTAMP,\n    tgl_jatuh_tempo DATE NOT NULL,\n    tgl_kembali DATETIME DEFAULT NULL,\n    denda INT DEFAULT 0,\n    status ENUM('Dipinjam', 'Dikembalikan', 'Terlambat') DEFAULT 'Dipinjam',\n    FOREIGN KEY (id_buku) REFERENCES buku(id_buku),\n    FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota),\n    FOREIGN KEY (id_petugas) REFERENCES petugas(id_petugas)\n);\n\n-- 7. Trigger: Kurangi stok saat pinjam\nDELIMITER $$\nCREATE TRIGGER kurangi_stok AFTER INSERT ON peminjaman\nFOR EACH ROW\nBEGIN\n    UPDATE buku SET tersedia = tersedia - 1 \n    WHERE id_buku = NEW.id_buku;\nEND$$\nDELIMITER ;\n\n-- 8. Trigger: Tambah stok saat kembali\nDELIMITER $$\nCREATE TRIGGER tambah_stok AFTER UPDATE ON peminjaman\nFOR EACH ROW\nBEGIN\n    IF NEW.tgl_kembali IS NOT NULL AND OLD.tgl_kembali IS NULL THEN\n        UPDATE buku SET tersedia = tersedia + 1 \n        WHERE id_buku = NEW.id_buku;\n        -- Update status jadi Dikembalikan\n        UPDATE peminjaman SET status = 'Dikembalikan' \n        WHERE id_pinjam = NEW.id_pinjam;\n    END IF;\nEND$$\nDELIMITER ;\n\n-- Contoh isi data awal\nINSERT INTO kategori (nama_kategori) VALUES \n('Teknologi'), ('Sastra'), ('Sejarah'), ('Agama'), ('Skripsi');\n\nINSERT INTO rak VALUES \n('R1A', 'Lantai 1 Rak A'), ('R2B', 'Lantai 2 Rak B');\n\nINSERT INTO petugas VALUES \n('P001', 'Admin Utama', 'admin', MD5('admin123'), 'Admin');`
  };

  // ---- Load Latihan SQL from Firestore ----
  async function loadLatihanSQL() {
    try {
      const { db: fireDb, collection, query, where, getDocs, limit } = await import('./firebase-config.js');
      
      const q = query(
        collection(fireDb, 'latihan_sql'),
        where('aktif', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        renderLatihan(data);
      } else {
        // Tampilkan default latihan jika belum ada dari guru
        renderLatihan(DEFAULT_LATIHAN);
      }
    } catch (err) {
      console.warn('[SQL Editor] Fallback ke default latihan:', err);
      renderLatihan(DEFAULT_LATIHAN);
    }
  }

  function renderLatihan(data) {
    const body = document.getElementById('latihan-sql-body');
    const titleEl = document.querySelector('.latihan-sql-title');
    if (!body) return;

    if (titleEl && data.judul) {
      titleEl.textContent = '📝 ' + data.judul;
    }

    const highlighted = highlightSQL(data.konten || '');
    
    let html = `<pre class="latihan-code">${highlighted}</pre>`;
    
    if (data.petunjuk) {
      html += `<div class="latihan-meta-box">
        <span class="latihan-meta-tag">PETUNJUK</span>
        <span>${escLatihan(data.petunjuk)}</span>
      </div>`;
    }

    if (data.pertemuan) {
      html += `<div class="latihan-meta-box" style="border-top:1px dashed #21262d;">
        <span class="latihan-meta-tag" style="background:#1f6feb;">${escLatihan(data.pertemuan)}</span>
        <span style="color:#8b949e;font-size:11px;">Studi Kasus Praktik Terstruktur</span>
      </div>`;
    }
    
    body.innerHTML = html;
  }

  function highlightSQL(code) {
    if (!code) return '';
    
    const lines = code.split('\n');
    return lines.map(line => {
      const trimmed = line.trimStart();
      // Whole-line comment
      if (trimmed.startsWith('--')) {
        return `<span class="sql-comment">${escLatihan(line)}</span>`;
      }
      
      let mainPart = line;
      let commentPart = '';
      const commentIdx = line.indexOf('--');
      if (commentIdx !== -1) {
        mainPart = line.substring(0, commentIdx);
        commentPart = `<span class="sql-comment">${escLatihan(line.substring(commentIdx))}</span>`;
      }
      
      // Tokenize strings ('...') first
      const strTokens = [];
      mainPart = mainPart.replace(/'([^'\\]|\\.)*'/g, (m) => {
        const id = `___STRTOK${strTokens.length}___`;
        strTokens.push(`<span class="sql-string">${escLatihan(m)}</span>`);
        return id;
      });
      
      // Escape HTML
      mainPart = escLatihan(mainPart);
      
      // Highlight keywords
      const keywords = ['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE',
        'CREATE','TABLE','DATABASE','DROP','ALTER','ADD','COLUMN','PRIMARY','KEY','FOREIGN','REFERENCES',
        'NOT','NULL','DEFAULT','AUTO_INCREMENT','AUTOINCREMENT','UNIQUE','INDEX','ON','IF','EXISTS',
        'AND','OR','IN','LIKE','BETWEEN','ORDER','BY','GROUP','HAVING','LIMIT','JOIN','LEFT','RIGHT',
        'INNER','OUTER','AS','DISTINCT','COUNT','SUM','AVG','MAX','MIN','USE','SHOW','DESCRIBE','DESC',
        'AFTER','BEFORE','FOR','EACH','ROW','BEGIN','END','DELIMITER','TRIGGER','ENUM',
        'CURRENT_DATE','CURRENT_TIMESTAMP','IS','THEN','NEW','OLD'];
      
      const kwRegex = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'gi');
      mainPart = mainPart.replace(kwRegex, (m) => `<span class="sql-keyword">${m.toUpperCase()}</span>`);
      
      // Highlight data types
      const types = ['VARCHAR','INT','INTEGER','TEXT','DATE','DATETIME','YEAR','BOOLEAN','FLOAT','DOUBLE','DECIMAL','CHAR','BLOB','TIMESTAMP'];
      const typeRegex = new RegExp('\\b(' + types.join('|') + ')\\b', 'gi');
      mainPart = mainPart.replace(typeRegex, (m) => `<span class="sql-type">${m.toUpperCase()}</span>`);
      
      // Highlight functions
      const funcs = ['MD5','SHA1','NOW','CURDATE','CONCAT','SUBSTRING','UPPER','LOWER','TRIM','LENGTH','REPLACE'];
      const funcRegex = new RegExp('\\b(' + funcs.join('|') + ')\\b', 'gi');
      mainPart = mainPart.replace(funcRegex, (m) => `<span class="sql-function">${m.toUpperCase()}</span>`);
      
      // Highlight numbers
      mainPart = mainPart.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');
      
      // Restore string tokens
      strTokens.forEach((strHtml, i) => {
        mainPart = mainPart.replace(`___STRTOK${i}___`, strHtml);
      });
      
      return mainPart + commentPart;
    }).join('\n');
  }

  function escLatihan(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Copy button (if exists in DOM)
  const btnCopyLatihan = document.getElementById('btn-copy-latihan');
  if (btnCopyLatihan) {
    btnCopyLatihan.addEventListener('click', () => {
      const codeEl = document.querySelector('.latihan-code');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          btnCopyLatihan.textContent = '✅ Tersalin!';
          setTimeout(() => { btnCopyLatihan.textContent = '📋 Salin'; }, 2000);
        });
      }
    });
  }

  // Load latihan from Firestore or fallback
  loadLatihanSQL();
})();
