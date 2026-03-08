import path from "path";
import { KEY_FILES, FOLDERS } from "@/lib/config";
import { readFileContent, parseAgentsTable, parseInfraTable, parseSkillsTable } from "@/lib/parser";
import { AgentCard } from "@/components/AgentCard";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const content = await readFileContent(KEY_FILES.agents);
  const agents = parseAgentsTable(content);
  const infra = parseInfraTable(content);
  const skills = parseSkillsTable(content);

  const hasData = agents.length > 0 || infra.length > 0 || skills.length > 0;

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Agent Registry</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {hasData
            ? <>{agents.length} Copilot agents &middot; {infra.length} infrastructure components &middot; {skills.length} skill platforms</>
            : "No agent data found — check that AGENTS.md exists"}
        </p>
      </div>

      {!hasData && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1H3v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7 18a1 1 0 001 1h8a1 1 0 001-1" />
          </svg>
          <h3 className="text-sm font-semibold mb-1">No agents registered</h3>
          <p className="text-sm text-muted-foreground">
            Create an AGENTS.md file in D:\00_Core\ with a Copilot Agents table to see agents here.
          </p>
        </div>
      )}

      {/* Copilot Agents */}
      {agents.length > 0 && (
        <section aria-labelledby="copilot-heading">
          <h2 id="copilot-heading" className="text-lg font-semibold mb-4">
            Copilot Agents
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline">
              {path.join(FOLDERS.development, "CopilotAgents") + path.sep}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.name} {...agent} />
            ))}
          </div>
        </section>
      )}

      {/* Infrastructure */}
      {infra.length > 0 && (
        <section aria-labelledby="infra-heading">
          <h2 id="infra-heading" className="text-lg font-semibold mb-4">
            Agent Infrastructure
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline">
              {path.join(FOLDERS.development, "Github-Agents") + path.sep}
            </span>
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-accent">
                  <th className="text-left p-3 font-medium" scope="col">#</th>
                  <th className="text-left p-3 font-medium" scope="col">Component</th>
                  <th className="text-left p-3 font-medium" scope="col">File</th>
                  <th className="text-left p-3 font-medium" scope="col">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {infra.map((comp) => (
                  <tr key={comp.number} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-primary">{comp.number}</td>
                    <td className="p-3 font-medium">{comp.component}</td>
                    <td className="p-3 font-mono text-xs">{comp.file}</td>
                    <td className="p-3 text-muted-foreground">{comp.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section aria-labelledby="skills-heading">
          <h2 id="skills-heading" className="text-lg font-semibold mb-4">
            Multi-Platform Skills
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline">
              {path.join(FOLDERS.development, "Skills") + path.sep}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <div key={skill.platform} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-1">{skill.platform}</h3>
                <p className="text-xs font-mono text-muted-foreground mb-2">{skill.location}</p>
                <p className="text-sm text-muted-foreground">{skill.contents}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
