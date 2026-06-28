import { write } from "../filesystem";
import { agentsMd } from "../templates/projectTemplates";

export function syncAgents(root: string): void {
  write(root, "AGENTS.md", agentsMd());
  console.log("Synced AGENTS.md.");
}
