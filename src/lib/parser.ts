import fs from "fs/promises";

export interface AgentInfo {
  name: string;
  file: string;
  role: string;
  purpose: string;
  version: string;
  status: string;
}

export interface InfraComponent {
  number: string;
  component: string;
  file: string;
  purpose: string;
}

export interface SkillPlatform {
  platform: string;
  location: string;
  contents: string;
}

export interface AutomationCategory {
  name: string;
  description: string;
  path: string;
  itemCount: number;
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

export function parseAgentsTable(markdown: string): AgentInfo[] {
  const agents: AgentInfo[] = [];
  const lines = markdown.split("\n");

  let inCopilotTable = false;
  for (const line of lines) {
    if (line.includes("### Copilot Agents")) {
      inCopilotTable = true;
      continue;
    }
    if (inCopilotTable && line.startsWith("###")) {
      break;
    }
    if (!inCopilotTable) continue;

    const match = line.match(
      /^\|\s*(\w+)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/
    );
    if (match && match[1] !== "Agent") {
      agents.push({
        name: match[1].trim(),
        file: match[2].trim(),
        role: match[3].trim(),
        purpose: match[4].trim(),
        version: match[5].trim(),
        status: match[6].trim(),
      });
    }
  }

  return agents;
}

export function parseInfraTable(markdown: string): InfraComponent[] {
  const components: InfraComponent[] = [];
  const lines = markdown.split("\n");

  let inInfraTable = false;
  for (const line of lines) {
    if (line.includes("### Agent Infrastructure")) {
      inInfraTable = true;
      continue;
    }
    if (inInfraTable && line.startsWith("###")) {
      break;
    }
    if (!inInfraTable) continue;

    const match = line.match(
      /^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*`([^`]+)`\s*\|\s*([^|]+)\|/
    );
    if (match) {
      components.push({
        number: match[1].trim(),
        component: match[2].trim(),
        file: match[3].trim(),
        purpose: match[4].trim(),
      });
    }
  }

  return components;
}

export function parseSkillsTable(markdown: string): SkillPlatform[] {
  const skills: SkillPlatform[] = [];
  const lines = markdown.split("\n");

  let inSkillsTable = false;
  for (const line of lines) {
    if (line.includes("### Multi-Platform Skills")) {
      inSkillsTable = true;
      continue;
    }
    if (inSkillsTable && line.startsWith("###")) {
      break;
    }
    if (!inSkillsTable) continue;

    const match = line.match(
      /^\|\s*([^|]+)\|\s*`([^`]+)`\s*\|\s*([^|]+)\|/
    );
    if (match && match[1].trim() !== "Platform") {
      skills.push({
        platform: match[1].trim(),
        location: match[2].trim(),
        contents: match[3].trim(),
      });
    }
  }

  return skills;
}

export function parseTodoItems(markdown: string): { text: string; done: boolean; section: string }[] {
  const items: { text: string; done: boolean; section: string }[] = [];
  let currentSection = "";

  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "").trim();
    }
    const todoMatch = line.match(/^- \[([ x])\] (.+)/);
    if (todoMatch) {
      items.push({
        done: todoMatch[1] === "x",
        text: todoMatch[2].trim(),
        section: currentSection,
      });
    }
  }

  return items;
}
