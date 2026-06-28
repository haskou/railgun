export function releaseUi(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Railgun Release</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; color: #17202a; background: #f6f7f9; }
      header { background: #101820; color: white; padding: 16px 24px; }
      main { padding: 20px; max-width: 1180px; margin: 0 auto; }
      label { display: block; font-weight: 650; margin-bottom: 6px; }
      input, select, button { font: inherit; padding: 8px 10px; border: 1px solid #bec7d0; border-radius: 6px; background: white; }
      button { cursor: pointer; font-weight: 650; }
      table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #d9dfe7; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #edf0f4; vertical-align: top; }
      th { background: #eef2f6; }
      .grid { display: grid; grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr) repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; align-items: end; }
      .panel { background: white; border: 1px solid #d9dfe7; padding: 14px; margin-bottom: 16px; border-radius: 8px; }
      .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .badge { display: inline-block; padding: 3px 7px; border-radius: 999px; background: #e8eef5; font-size: 12px; }
      .muted { color: #526070; }
      .selected { background: #f0fbf5; }
      .present { opacity: 0.58; }
      .error { color: #b42318; white-space: pre-wrap; }
      .ok { color: #067647; white-space: pre-wrap; }
      .swap { width: 44px; padding-left: 0; padding-right: 0; }
      .warning { color: #9a6700; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <header><h1>Railgun Release</h1></header>
    <main>
      <section class="panel">
        <div class="grid">
          <div><label for="source">Source</label><select id="source"></select></div>
          <div><button class="swap" id="swap" type="button">⇆</button></div>
          <div><label for="target">Target</label><select id="target"></select></div>
          <div><label for="version">Version</label><input id="version" /></div>
          <div><label for="releaseBranch">Release branch</label><input id="releaseBranch" /></div>
        </div>
        <div class="actions">
          <button id="refresh">Refresh</button>
          <button id="selectAll">Select all</button>
          <button id="preflight">Preflight</button>
          <button id="create">Create release branch</button>
          <span id="summary"></span>
          <span class="muted" id="status"></span>
        </div>
      </section>
      <section class="panel">
        <div id="versionInfo"></div>
        <div id="messages"></div>
      </section>
      <table>
        <thead>
          <tr>
            <th>Select</th><th>Hash</th><th>Author</th><th>Date</th><th>Subject</th><th>Type</th><th>Reason</th><th>Status</th>
          </tr>
        </thead>
        <tbody id="commits"></tbody>
      </table>
    </main>
    <script>
      const state = {
        branchTouched: false,
        branches: [],
        commits: [],
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
      const selectedHashes = () => [...document.querySelectorAll("input[data-hash]:checked")].map((input) => input.dataset.hash);
      const show = (message, className = "") => { $("messages").className = className; $("messages").textContent = message; };
      const setStatus = (message) => { $("status").textContent = message; };
      const setBusy = (busy) => {
        for (const id of ["refresh", "swap", "selectAll", "preflight", "create"]) {
          $(id).disabled = busy;
        }
      };
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
          .map((branch) => '<option value="' + branch + '">' + branch + '</option>')
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
        refresh();
      }
      function selectAllPending() {
        document.querySelectorAll("input[data-hash]:not(:disabled)").forEach((input) => { input.checked = true; });
        calculate();
      }
      async function refresh() {
        setBusy(true);
        setStatus("Refreshing...");
        show("");
        try {
          await loadBranches();
          renderBranchSelects($("source").value, $("target").value);
          const source = $("source").value;
          const target = $("target").value;
          const [compare, version] = await Promise.all([
            api("/api/compare?source=" + encodeURIComponent(source) + "&target=" + encodeURIComponent(target)),
            api("/api/version?target=" + encodeURIComponent(target)),
          ]);
          state.commits = compare.commits;
          $("versionInfo").textContent = "Latest release on " + target + ": " + (version.latestRelease || "none") + " (" + version.latestVersion + ")";
          renderCommits();
          await calculate();
          setStatus("Refreshed " + state.commits.length + " commits.");
        } catch (error) {
          setStatus("Refresh failed.");
          show(error.stack || String(error), "error");
        } finally {
          setBusy(false);
        }
      }
      async function calculate() {
        const pending = state.commits.filter((commit) => commit.status === "pending").map((commit) => commit.hash);
        const selected = selectedHashes();
        const commits = selected.length ? selected : pending;
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
        $("summary").textContent = "Bump: " + result.bump;
      }
      function renderCommits() {
        $("commits").innerHTML = state.commits.map((commit) => {
          const disabled = commit.status !== "pending" ? "disabled" : "";
          const rowClass = commit.status === "present" ? "present" : "";
          return '<tr class="' + rowClass + '"><td><input data-hash="' + commit.hash + '" type="checkbox" ' + disabled + ' /></td><td>' + commit.shortHash + '</td><td>' + commit.author + '</td><td>' + commit.date.slice(0, 10) + '</td><td>' + commit.subject + '</td><td><span class="badge">' + commit.type + '</span></td><td>' + commit.reason + '</td><td>' + commit.status + '</td></tr>';
        }).join("");
        document.querySelectorAll("input[data-hash]").forEach((input) => input.addEventListener("change", calculate));
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
      function failureSummary(result) {
        if (result.error === "CHERRY_PICK_CONFLICT") {
          return [
            "Cherry-pick conflict.",
            "Failed commit: " + result.failedCommit,
            "Files:",
            ...result.conflictedFiles.map((file) => "- " + file),
          ].join("\\n");
        }

        return result.error || "Unknown error.";
      }
      async function submit(path) {
        const isPreflight = path === "/api/preflight";
        setBusy(true);
        setStatus(isPreflight ? "Running preflight..." : "Creating release branch...");
        show("");
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
            setStatus(isPreflight ? "Preflight passed." : "Release branch created.");
            show(releaseSummary(result), "ok");
          } else {
            setStatus(isPreflight ? "Preflight failed." : "Create release failed.");
            show(failureSummary(result), "error");
          }
        } catch (error) {
          setStatus(isPreflight ? "Preflight failed." : "Create release failed.");
          show(error.stack || String(error), "error");
        } finally {
          setBusy(false);
        }
      }
      $("refresh").addEventListener("click", refresh);
      $("swap").addEventListener("click", swapBranches);
      $("selectAll").addEventListener("click", selectAllPending);
      $("source").addEventListener("change", () => { renderBranchSelects($("source").value, $("target").value); resetSuggestion(); refresh(); });
      $("target").addEventListener("change", () => { renderBranchSelects($("source").value, $("target").value); resetSuggestion(); refresh(); });
      $("version").addEventListener("input", () => { state.versionTouched = true; });
      $("releaseBranch").addEventListener("input", () => { state.branchTouched = true; });
      $("preflight").addEventListener("click", () => submit("/api/preflight"));
      $("create").addEventListener("click", () => submit("/api/create-release"));
      load().catch((error) => show(error.stack || String(error), "error"));
    </script>
  </body>
</html>`;
}
