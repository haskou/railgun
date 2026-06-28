export function releaseUi(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Railgun Release</title>
    <style>
      :root {
        --bg: #f6f8fb;
        --surface: #ffffff;
        --surface-muted: #eef3f7;
        --border: #d6dee8;
        --text: #17202a;
        --muted: #627083;
        --success: #057a55;
        --warning: #b7791f;
        --error: #c53030;
        --focus: #2563eb;
      }

      * { box-sizing: border-box; }
      body { font-family: system-ui, sans-serif; margin: 0; color: var(--text); background: var(--bg); }
      header { padding: 18px 24px 10px; }
      main { padding: 0 24px 24px; max-width: 1280px; margin: 0 auto; }
      h1 { font-size: 26px; line-height: 1.2; margin: 0; }
      p { margin: 0; }
      label { display: block; font-weight: 650; margin-bottom: 6px; }
      input, select, button { font: inherit; border: 1px solid var(--border); border-radius: 7px; }
      input, select { width: 100%; padding: 9px 10px; background: var(--surface); color: var(--text); }
      input:focus, select:focus, button:focus { outline: 2px solid var(--focus); outline-offset: 2px; }
      button { padding: 9px 12px; background: var(--surface); color: var(--text); cursor: pointer; font-weight: 650; }
      button:disabled { cursor: not-allowed; opacity: 0.52; }
      table { width: 100%; min-width: 980px; border-collapse: collapse; background: var(--surface); }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #edf0f4; vertical-align: middle; }
      th { background: var(--surface-muted); color: #334155; font-size: 12px; text-transform: uppercase; }
      tr[data-selectable="true"] { cursor: pointer; }
      tr[data-selectable="true"]:hover { background: #f8fbff; }

      .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .badge { display: inline-flex; align-items: center; min-height: 22px; padding: 3px 8px; border-radius: 999px; background: #e8eef5; font-size: 12px; font-weight: 650; white-space: nowrap; }
      .badge.major { background: #fde8e8; color: #9b1c1c; }
      .badge.minor { background: #e6f0ff; color: #1d4ed8; }
      .badge.patch { background: #e9f7ef; color: #047857; }
      .badge.unknown { background: #f5f0df; color: #92400e; }
      .branch-grid { display: grid; grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr); gap: 12px; align-items: end; }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
      .compact { width: 1%; white-space: nowrap; }
      .empty { padding: 28px; text-align: center; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-top: 0; }
      .header-subtitle { margin-top: 5px; color: var(--muted); }
      .layout { display: grid; gap: 16px; }
      .muted { color: var(--muted); }
      .page-head { max-width: 1280px; margin: 0 auto; }
      .plan-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .plan-item { padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: #fbfcfe; }
      .plan-label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
      .plan-value { display: block; margin-top: 5px; font-weight: 750; overflow-wrap: anywhere; }
      .primary { background: #17202a; color: white; border-color: #17202a; }
      .primary:disabled { background: #17202a; color: white; }
      .secondary { background: #f8fafc; }
      .section-title { font-size: 15px; margin: 0 0 12px; }
      .selected-row { background: #f0fbf5; }
      .status { display: block; min-height: 44px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); white-space: pre-wrap; }
      .status.info { border-color: #b9d7f5; background: #f2f8ff; }
      .status.success { border-color: #a7e3c1; background: #f0fbf5; color: var(--success); }
      .status.warning { border-color: #f4d28a; background: #fff8e8; color: var(--warning); }
      .status.error { border-color: #f0b4b4; background: #fff5f5; color: var(--error); }
      .swap { width: 44px; padding-left: 0; padding-right: 0; font-size: 18px; }
      .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
      .toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
      .wide { width: 38%; }

      @media (max-width: 840px) {
        main { padding: 0 14px 18px; }
        header { padding: 14px 14px 8px; }
        .branch-grid, .plan-grid { grid-template-columns: 1fr; }
        .swap { width: 100%; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="page-head">
        <h1>Railgun Release</h1>
        <p class="header-subtitle">Compose a release branch from selected commits.</p>
      </div>
    </header>
    <main>
      <div class="layout">
        <section class="card">
          <h2 class="section-title">Branches</h2>
          <div class="branch-grid">
            <div><label for="source">Source branch</label><select id="source"></select></div>
            <div><button class="swap" id="swap" type="button" title="Swap source and target branches" aria-label="Swap source and target branches">⇆</button></div>
            <div><label for="target">Target branch</label><select id="target"></select></div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Release plan</h2>
          <div class="plan-grid">
            <div class="plan-item"><span class="plan-label">Latest release</span><span class="plan-value" id="latestRelease">-</span></div>
            <div class="plan-item"><span class="plan-label">Base version</span><span class="plan-value" id="baseVersion">0.0.0</span></div>
            <div class="plan-item"><span class="plan-label">Bump</span><span class="plan-value" id="bump">-</span></div>
            <div class="plan-item"><label class="plan-label" for="version">Next version</label><input id="version" /></div>
            <div class="plan-item"><label class="plan-label" for="releaseBranch">Release branch</label><input id="releaseBranch" /></div>
            <div class="plan-item"><span class="plan-label">Selected commits</span><span class="plan-value" id="selectedCount">0</span></div>
          </div>
        </section>

        <section class="card">
          <div class="toolbar">
            <div class="actions">
              <button class="secondary" id="refresh" type="button">Refresh</button>
              <button class="secondary" id="selectAll" type="button">Select pending</button>
              <button class="primary" id="preflight" type="button">Run preflight</button>
              <button class="primary" id="create" type="button">Create release branch</button>
            </div>
            <span class="muted" id="selectionSummary">No commits selected.</span>
          </div>
        </section>

        <section aria-live="polite" class="status info" id="feedback">Loading repository data...</section>

        <section>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="compact"></th><th class="compact">Hash</th><th>Author</th><th class="compact">Date</th><th class="wide">Subject</th><th class="compact">Type</th><th>Reason</th><th class="compact">Status</th>
                </tr>
              </thead>
              <tbody id="commits"></tbody>
            </table>
            <div class="empty" hidden id="emptyState">
              <strong>No pending commits found.</strong><br />
              The target branch already contains all equivalent patches from the selected source branch.
            </div>
          </div>
        </section>
      </div>
    </main>
    <script>
      const state = {
        appliedHashes: [],
        branchTouched: false,
        branches: [],
        busy: false,
        commits: [],
        conflictHash: "",
        latestRelease: "",
        latestVersion: "0.0.0",
        preflightValid: false,
        releaseCreated: false,
        selectedHashes: [],
        versionTouched: false,
      };
      const $ = (id) => document.getElementById(id);
      const api = async (url, options = {}) => {
        const response = await fetch(url, {
          headers: { "content-type": "application/json" },
          ...options,
        });
        return response.json();
      };
      const selectedHashes = () => state.selectedHashes;
      const pendingCommits = () => state.commits.filter((commit) => commit.status === "pending");
      const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);
      function setFeedback(message, kind = "info") {
        $("feedback").className = "status " + kind;
        $("feedback").textContent = message;
      }
      function setBusy(busy, message) {
        state.busy = busy;
        if (message) {
          setFeedback(message, "info");
        }
        updateActions();
      }
      function invalidatePreflight() {
        state.preflightValid = false;
        state.releaseCreated = false;
        state.appliedHashes = [];
        state.conflictHash = "";
        updateCommits();
      }
      async function load() {
        const repo = await loadBranches();
        const params = new URLSearchParams(location.search);
        renderBranchSelects(
          params.get("source") || repo.defaultSource,
          params.get("target") || repo.currentBranch,
        );
        $("version").value = params.get("version") || "";
        $("releaseBranch").value = params.get("branch") || "";
        state.versionTouched = params.has("version");
        state.branchTouched = params.has("branch");
        await refresh();
      }
      async function loadBranches() {
        const [repo, branches] = await Promise.all([api("/api/repo"), api("/api/branches")]);
        state.branches = branches.branches;

        return repo;
      }
      function branchOptions(selected, excluded) {
        return state.branches
          .filter((branch) => branch === selected || branch !== excluded)
          .map((branch) => '<option value="' + escapeHtml(branch) + '">' + escapeHtml(branch) + '</option>')
          .join("");
      }
      function chooseBranch(preferred, excluded) {
        if (preferred && preferred !== excluded && state.branches.includes(preferred)) {
          return preferred;
        }

        return state.branches.find((branch) => branch !== excluded) || "";
      }
      function renderBranchSelects(source, target) {
        const nextSource = chooseBranch(source, target);
        const nextTarget = chooseBranch(target, nextSource);
        $("source").innerHTML = branchOptions(nextSource, nextTarget);
        $("target").innerHTML = branchOptions(nextTarget, nextSource);
        $("source").value = nextSource;
        $("target").value = nextTarget;
      }
      function resetSuggestion() {
        state.versionTouched = false;
        state.branchTouched = false;
        $("version").value = "";
        $("releaseBranch").value = "";
      }
      function swapBranches() {
        const source = $("source").value;
        renderBranchSelects($("target").value, source);
        resetSuggestion();
        invalidatePreflight();
        refresh();
      }
      function selectAllPending() {
        state.selectedHashes = pendingCommits().map((commit) => commit.hash);
        invalidatePreflight();
        updateCommits();
        calculate();
      }
      async function refresh() {
        setBusy(true, "Refreshing commits and branch metadata...");
        try {
          await loadBranches();
          renderBranchSelects($("source").value, $("target").value);
          const source = $("source").value;
          const target = $("target").value;
          const [compare, version] = await Promise.all([
            api("/api/compare?source=" + encodeURIComponent(source) + "&target=" + encodeURIComponent(target)),
            api("/api/version?target=" + encodeURIComponent(target)),
          ]);
          state.latestRelease = version.latestRelease || "none";
          state.latestVersion = version.latestVersion;
          state.commits = compare.commits;
          state.selectedHashes = state.selectedHashes.filter((hash) => state.commits.some((commit) => commit.hash === hash && commit.status === "pending"));
          invalidatePreflight();
          updatePlan();
          updateCommits();
          await calculate();
          setFeedback(pendingCommits().length + " pending commits loaded from " + source + " compared against " + target + ".", "info");
        } catch (error) {
          setFeedback(error.stack || String(error), "error");
        } finally {
          setBusy(false);
        }
      }
      async function calculate() {
        const selected = selectedHashes();
        const commits = selected.length ? selected : pendingCommits().map((commit) => commit.hash);
        const result = await api("/api/suggest", {
          method: "POST",
          body: JSON.stringify({ source: $("source").value, target: $("target").value, commits }),
        });
        if (!state.versionTouched) {
          $("version").value = result.version;
        }
        if (!state.branchTouched) {
          $("releaseBranch").value = result.branch;
        }
        $("bump").textContent = result.bump;
        updatePlan();
        updateActions();
        if (result.warnings.length) {
          setFeedback(result.warnings.join("\\n"), "warning");
        }
      }
      function updatePlan() {
        $("latestRelease").textContent = state.latestRelease;
        $("baseVersion").textContent = state.latestVersion;
        $("selectedCount").textContent = String(state.selectedHashes.length);
        $("selectionSummary").textContent = selectionSummary();
      }
      function selectionSummary() {
        const selected = state.selectedHashes.length;
        const bump = $("bump").textContent || "-";
        const version = $("version").value || "-";

        if (selected === 0) {
          return "No commits selected.";
        }

        return selected + " commits selected · bump " + bump + " · next version " + version;
      }
      function updateActions() {
        const hasSelection = state.selectedHashes.length > 0;
        $("refresh").disabled = state.busy;
        $("swap").disabled = state.busy;
        $("selectAll").disabled = state.busy || pendingCommits().length === 0;
        $("preflight").disabled = state.busy || !hasSelection;
        $("create").disabled = state.busy || !hasSelection || !state.preflightValid || state.releaseCreated;
      }
      function commitStatus(commit) {
        if (commit.status === "present") {
          return { className: "patch", label: "already present" };
        }
        if (state.appliedHashes.includes(commit.hash)) {
          return { className: "patch", label: "applied" };
        }
        if (state.conflictHash === commit.hash) {
          return { className: "major", label: "conflict" };
        }
        if (state.preflightValid && state.selectedHashes.includes(commit.hash)) {
          return { className: "patch", label: "preflight ok" };
        }
        if (state.selectedHashes.includes(commit.hash)) {
          return { className: "minor", label: "selected" };
        }

        return { className: "unknown", label: "pending" };
      }
      function updateCommits() {
        $("commits").innerHTML = state.commits.map((commit) => {
          const selectable = commit.status === "pending";
          const checked = state.selectedHashes.includes(commit.hash) ? "checked" : "";
          const disabled = selectable ? "" : "disabled";
          const rowClass = state.selectedHashes.includes(commit.hash) ? "selected-row" : "";
          const status = commitStatus(commit);
          const reason = commit.reason ? commit.reason.replace("branch:", "branch ") : "";
          return '<tr class="' + rowClass + '" data-hash="' + escapeHtml(commit.hash) + '" data-selectable="' + String(selectable) + '"><td class="compact"><input aria-label="Select commit ' + escapeHtml(commit.shortHash) + '" data-hash="' + escapeHtml(commit.hash) + '" type="checkbox" ' + checked + " " + disabled + ' /></td><td class="compact">' + escapeHtml(commit.shortHash) + '</td><td>' + escapeHtml(commit.author) + '</td><td class="compact">' + escapeHtml(commit.date.slice(0, 10)) + '</td><td>' + escapeHtml(commit.subject) + '</td><td class="compact"><span class="badge ' + escapeHtml(commit.type) + '">' + escapeHtml(commit.type) + '</span></td><td>' + escapeHtml(reason) + '</td><td class="compact"><span class="badge ' + status.className + '">' + status.label + '</span></td></tr>';
        }).join("");
        $("emptyState").hidden = pendingCommits().length > 0;
        document.querySelectorAll("input[data-hash]").forEach((input) => input.addEventListener("change", (event) => {
          event.stopPropagation();
          toggleCommit(input.dataset.hash, input.checked);
        }));
        document.querySelectorAll("tr[data-selectable='true']").forEach((row) => row.addEventListener("click", (event) => {
          if (event.target.tagName === "INPUT") {
            return;
          }
          const hash = row.dataset.hash;
          toggleCommit(hash, !state.selectedHashes.includes(hash));
        }));
        updatePlan();
        updateActions();
      }
      function toggleCommit(hash, selected) {
        if (!hash) {
          return;
        }
        if (selected && !state.selectedHashes.includes(hash)) {
          state.selectedHashes = [...state.selectedHashes, hash];
        }
        if (!selected) {
          state.selectedHashes = state.selectedHashes.filter((selectedHash) => selectedHash !== hash);
        }
        invalidatePreflight();
        updateCommits();
        calculate();
      }
      function releaseSummary(result) {
        const lines = [
          "Release branch: " + result.releaseBranch,
          "Version: " + result.nextVersion,
          "Bump: " + result.bump,
          "Commits: " + result.commits.length,
        ];

        if (result.warnings.length) {
          lines.push("", "Warnings:", ...result.warnings.map((warning) => "- " + warning));
        }

        return lines.join("\\n");
      }
      function preflightSummary(result) {
        return "Preflight passed. " + result.commits.length + " commits can be cherry-picked cleanly.\\n\\n" + releaseSummary(result);
      }
      function failureSummary(result) {
        if (result.error === "CHERRY_PICK_CONFLICT") {
          state.conflictHash = result.failedCommit;
          updateCommits();
          return [
            "Conflict detected while applying " + result.failedCommit + ".",
            "Conflicted files:",
            ...result.conflictedFiles.map((file) => "- " + file),
          ].join("\\n");
        }

        return result.error || "Unknown error.";
      }
      async function submit(path) {
        const isPreflight = path === "/api/preflight";
        setBusy(true, isPreflight ? "Running preflight..." : "Creating release branch...");
        try {
          const result = await api(path, {
            method: "POST",
            body: JSON.stringify({
              source: $("source").value,
              target: $("target").value,
              releaseBranch: $("releaseBranch").value,
              version: $("version").value,
              commits: selectedHashes(),
            }),
          });
          if (result.ok) {
            if (isPreflight) {
              state.preflightValid = true;
              setFeedback(preflightSummary(result), "success");
            } else {
              state.releaseCreated = true;
              state.appliedHashes = result.appliedCommits || selectedHashes();
              setFeedback("Release branch created.\\n\\n" + releaseSummary(result), "success");
            }
          } else {
            state.preflightValid = false;
            setFeedback(failureSummary(result), "error");
          }
          updateCommits();
        } catch (error) {
          state.preflightValid = false;
          setFeedback(error.stack || String(error), "error");
        } finally {
          setBusy(false);
        }
      }
      function versionChanged() {
        state.versionTouched = true;
        if (!state.branchTouched && $("version").value) {
          $("releaseBranch").value = "release/v" + $("version").value;
        }
        invalidatePreflight();
        updatePlan();
      }
      function branchChanged() {
        renderBranchSelects($("source").value, $("target").value);
        resetSuggestion();
        invalidatePreflight();
        refresh();
      }
      $("refresh").addEventListener("click", refresh);
      $("swap").addEventListener("click", swapBranches);
      $("selectAll").addEventListener("click", selectAllPending);
      $("source").addEventListener("change", branchChanged);
      $("target").addEventListener("change", branchChanged);
      $("version").addEventListener("input", versionChanged);
      $("releaseBranch").addEventListener("input", () => { state.branchTouched = true; invalidatePreflight(); });
      $("preflight").addEventListener("click", () => submit("/api/preflight"));
      $("create").addEventListener("click", () => submit("/api/create-release"));
      load().catch((error) => setFeedback(error.stack || String(error), "error"));
    </script>
  </body>
</html>`;
}
