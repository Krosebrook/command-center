import { KEY_FILES } from "@/lib/config";
import { readFileContent, parseAgentsTable, parseInfraTable, parseSkillsTable } from "@/lib/parser";
import { AgentCard } from "@/components/AgentCard";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const content = await readFileContent(KEY_FILES.agents);
  const agents = parseAgentsTable(content);
  const infra = parseInfraTable(content);
  const skills = parseSkillsTable(content);

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Registry</h1>
        <p className="text-muted-foreground mt-1">
          {agents.length} Copilot agents &middot; {infra.length} infrastructure
          components &middot; {skills.length} skill platforms
        </p>
      </div>

      {/* Copilot Agents */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Copilot Agents
          <span className="text-sm font-normal text-muted-foreground ml-2">
            D:\02_Development\CopilotAgents\
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.name} {...agent} />
          ))}
        </div>
      </div>

      {/* Infrastructure */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Agent Infrastructure
          <span className="text-sm font-normal text-muted-foreground ml-2">
            D:\02_Development\Github-Agents\
          </span>
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent">
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Component</th>
                <th className="text-left p-3 font-medium">File</th>
                <th className="text-left p-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {infra.map((comp) => (
                <tr
                  key={comp.number}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3 font-mono text-primary">{comp.number}</td>
                  <td className="p-3 font-medium">{comp.component}</td>
                  <td className="p-3 font-mono text-xs">{comp.file}</td>
                  <td className="p-3 text-muted-foreground">{comp.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skills */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Multi-Platform Skills
          <span className="text-sm font-normal text-muted-foreground ml-2">
            D:\02_Development\Skills\
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.platform}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold mb-1">{skill.platform}</h3>
              <p className="text-xs font-mono text-muted-foreground mb-2">
                {skill.location}
              </p>
              <p className="text-sm text-muted-foreground">{skill.contents}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
