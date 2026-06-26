import { addReadmeBadge, writeJson } from "../filesystem";

export function addRenovate(root: string): void {
  writeJson(root, "renovate.json", {
    $schema: "https://docs.renovatebot.com/renovate-schema.json",
    extends: ["config:recommended"],
    labels: ["dependencies"],
    rangeStrategy: "bump",
  });
  addReadmeBadge(
    root,
    "[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)",
  );
  console.log("Added Renovate config");
}
