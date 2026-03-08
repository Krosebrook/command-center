import { describe, it, expect } from "vitest";
import {
  parseAgentsTable,
  parseInfraTable,
  parseSkillsTable,
  parseTodoItems,
} from "../parser";

describe("parseAgentsTable", () => {
  it("returns empty for empty string", () => {
    expect(parseAgentsTable("")).toEqual([]);
  });

  it("returns empty for no matching section", () => {
    expect(parseAgentsTable("# Other\nsome text")).toEqual([]);
  });

  it("parses valid agent rows", () => {
    const md = [
      "### Copilot Agents",
      "| Agent | File | Role | Purpose | Version | Status |",
      "|---|---|---|---|---|---|",
      "| TestBot | `test.md` | Helper | Helps | v1 | Active |",
    ].join("\n");
    const result = parseAgentsTable(md);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("TestBot");
    expect(result[0].file).toBe("test.md");
    expect(result[0].role).toBe("Helper");
    expect(result[0].purpose).toBe("Helps");
    expect(result[0].version).toBe("v1");
    expect(result[0].status).toBe("Active");
  });

  it("skips header row", () => {
    const md = [
      "### Copilot Agents",
      "| Agent | File | Role | Purpose | Version | Status |",
      "|---|---|---|---|---|---|",
      "| Bot1 | `b1.md` | R1 | P1 | v1 | Ok |",
    ].join("\n");
    const result = parseAgentsTable(md);
    // "Agent" header row should be filtered out by the regex check
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bot1");
  });

  it("stops at next ### section", () => {
    const md = [
      "### Copilot Agents",
      "| Bot | `b.md` | R | P | v1 | Ok |",
      "### Other Section",
      "| X | `x.md` | R | P | v1 | Ok |",
    ].join("\n");
    expect(parseAgentsTable(md)).toHaveLength(1);
  });

  it("parses multiple agents", () => {
    const md = [
      "### Copilot Agents",
      "| Alpha | `a.md` | R | P | v1 | Active |",
      "| Beta | `b.md` | R | P | v2 | Idle |",
    ].join("\n");
    const result = parseAgentsTable(md);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alpha");
    expect(result[1].name).toBe("Beta");
  });
});

describe("parseTodoItems", () => {
  it("returns empty for empty string", () => {
    expect(parseTodoItems("")).toEqual([]);
  });

  it("parses checked and unchecked items", () => {
    const md = "## Tasks\n- [ ] Do thing\n- [x] Done thing";
    const items = parseTodoItems(md);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ text: "Do thing", done: false, section: "Tasks" });
    expect(items[1]).toEqual({ text: "Done thing", done: true, section: "Tasks" });
  });

  it("tracks sections", () => {
    const md = "## A\n- [ ] one\n## B\n- [ ] two";
    const items = parseTodoItems(md);
    expect(items[0].section).toBe("A");
    expect(items[1].section).toBe("B");
  });

  it("ignores malformed lines", () => {
    const md = "- not a todo\n- [] missing space\n- [ ] valid";
    expect(parseTodoItems(md)).toHaveLength(1);
  });

  it("defaults section to empty string", () => {
    const md = "- [ ] no section above";
    const items = parseTodoItems(md);
    expect(items[0].section).toBe("");
  });
});

describe("parseInfraTable", () => {
  it("returns empty for no section", () => {
    expect(parseInfraTable("# Other")).toEqual([]);
  });

  it("parses infrastructure rows", () => {
    const md = [
      "### Agent Infrastructure",
      "| # | Component | File | Purpose |",
      "|---|---|---|---|",
      "| 1 | Router | `router.ts` | Routes things |",
    ].join("\n");
    const result = parseInfraTable(md);
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe("1");
    expect(result[0].component).toBe("Router");
    expect(result[0].file).toBe("router.ts");
    expect(result[0].purpose).toBe("Routes things");
  });

  it("stops at next section", () => {
    const md = [
      "### Agent Infrastructure",
      "| 1 | Router | `router.ts` | Routes |",
      "### Other",
      "| 2 | Other | `other.ts` | Other |",
    ].join("\n");
    expect(parseInfraTable(md)).toHaveLength(1);
  });
});

describe("parseSkillsTable", () => {
  it("returns empty for no section", () => {
    expect(parseSkillsTable("# Other")).toEqual([]);
  });

  it("parses skill rows", () => {
    const md = [
      "### Multi-Platform Skills",
      "| Platform | Location | Contents |",
      "|---|---|---|",
      "| VSCode | `skills/` | All skills |",
    ].join("\n");
    const result = parseSkillsTable(md);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("VSCode");
    expect(result[0].location).toBe("skills/");
    expect(result[0].contents).toBe("All skills");
  });

  it("skips header row", () => {
    const md = [
      "### Multi-Platform Skills",
      "| Platform | Location | Contents |",
      "| VSCode | `skills/` | Stuff |",
    ].join("\n");
    // "Platform" header is filtered by match[1].trim() !== "Platform"
    const result = parseSkillsTable(md);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("VSCode");
  });
});
