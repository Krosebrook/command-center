import path from "path";

export const DRIVES: string[] = ["D:\\"];
// Fallback for primary drive config maps
export const DRIVE_ROOT = DRIVES[0];

export const FOLDERS = {
  core: path.join(DRIVE_ROOT, "00_Core"),
  system: path.join(DRIVE_ROOT, "00_System"),
  homebase: path.join(DRIVE_ROOT, "01_Homebase"),
  development: path.join(DRIVE_ROOT, "02_Development"),
  intinc: path.join(DRIVE_ROOT, "03_INTInc"),
  media: path.join(DRIVE_ROOT, "04_Media"),
  backups: path.join(DRIVE_ROOT, "05_Backups-Archive"),
  downloads: path.join(DRIVE_ROOT, "07_Downloads"),
  documentation: path.join(DRIVE_ROOT, "08_Documentation"),
  anthropic: path.join(DRIVE_ROOT, "09_Anthropic"),
  google: path.join(DRIVE_ROOT, "10_Google"),
  openai: path.join(DRIVE_ROOT, "11_OpenAI"),
  solemuchbetter: path.join(DRIVE_ROOT, "12_SoleMuchBetter"),
  microsoft: path.join(DRIVE_ROOT, "13_Microsoft-n-Copilot"),
} as const;

export const PROJECTS = [
  {
    name: "FlashFusion",
    path: path.join(FOLDERS.homebase, "01_Source-of-Truth", "FlashFusion"),
    description: "Multi-provider AI integration and e-commerce platform",
    techStack: ["React", "TypeScript", "Vite", "Supabase", "Vercel"],
    status: "active" as const,
  },
  {
    name: "KAR",
    path: path.join(FOLDERS.homebase, "01_Source-of-Truth", "KAR"),
    description: "KAR project",
    techStack: ["TypeScript"],
    status: "active" as const,
  },
  {
    name: "INTINC",
    path: path.join(FOLDERS.intinc, "INTINC"),
    description: "INT Inc / Interact business platform",
    techStack: ["TypeScript", "React"],
    status: "active" as const,
  },
  {
    name: "AIaaS Rollout",
    path: path.join(FOLDERS.homebase, "01_Source-of-Truth", "AIaaSRollOutAutomations"),
    description: "AI-as-a-Service rollout automations",
    techStack: ["n8n", "Make.com", "Zapier"],
    status: "active" as const,
  },
  {
    name: "nexus-app-factory",
    path: path.join(FOLDERS.homebase, "00_Core", "nexus-app-factory"),
    description: "Nexus app factory for scaffolding projects",
    techStack: ["Next.js", "TypeScript", "Tailwind"],
    status: "active" as const,
  },
  {
    name: "Base44 Migration",
    path: path.join(FOLDERS.homebase, "05_Strategy", "Base44PlatformMigrationDocs"),
    description: "Base44 platform migration documentation",
    techStack: ["Documentation"],
    status: "planning" as const,
  },
  {
    name: "Fullstack Framework",
    path: path.join(FOLDERS.homebase, "02_Frameworks", "fullstack-framework-2025"),
    description: "Reusable full-stack project scaffold",
    techStack: ["React", "TypeScript", "Node.js"],
    status: "active" as const,
  },
] as const;

export const AUTOMATION_CATEGORIES = [
  "Agents", "Assistants", "Automations", "Ecom", "Education",
  "HR", "IT", "Marketing", "Media", "Prompts", "RAG",
  "Sales", "Security", "SEO", "Social", "Support", "UI",
] as const;

export const KEY_FILES = {
  index: path.join(FOLDERS.core, "INDEX.md"),
  agents: path.join(FOLDERS.core, "AGENTS.md"),
  changelog: path.join(FOLDERS.core, "CHANGELOG.md"),
  quickRef: path.join(FOLDERS.core, "QUICK-REFERENCE.md"),
  todo: path.join(FOLDERS.core, "TODO.md"),
  claude: path.join(FOLDERS.core, "CLAUDE.md"),
} as const;

export const SORT_RULES: Record<string, { destination: string; label: string }> = {
  ".zip": { destination: path.join(FOLDERS.backups, "Zips"), label: "Archive (Zips)" },
  ".rar": { destination: path.join(FOLDERS.backups, "Zips"), label: "Archive (Zips)" },
  ".7z": { destination: path.join(FOLDERS.backups, "Zips"), label: "Archive (Zips)" },
  ".tar.gz": { destination: path.join(FOLDERS.backups, "Zips"), label: "Archive (Zips)" },
  ".pdf": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".doc": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".docx": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".pptx": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".xlsx": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".csv": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".txt": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".md": { destination: path.join(FOLDERS.documentation, "Documents"), label: "Documentation" },
  ".agent.md": { destination: path.join(FOLDERS.development, "CopilotAgents"), label: "Agent Definition" },
  ".png": { destination: path.join(FOLDERS.media, "Images"), label: "Media (Images)" },
  ".jpg": { destination: path.join(FOLDERS.media, "Images"), label: "Media (Images)" },
  ".jpeg": { destination: path.join(FOLDERS.media, "Images"), label: "Media (Images)" },
  ".gif": { destination: path.join(FOLDERS.media, "Images"), label: "Media (Images)" },
  ".svg": { destination: path.join(FOLDERS.media, "Images"), label: "Media (Images)" },
  ".webp": { destination: path.join(FOLDERS.media, "Images"), label: "Media (Images)" },
  ".mp4": { destination: path.join(FOLDERS.media, "Videos"), label: "Media (Videos)" },
  ".mov": { destination: path.join(FOLDERS.media, "Videos"), label: "Media (Videos)" },
  ".webm": { destination: path.join(FOLDERS.media, "Videos"), label: "Media (Videos)" },
  ".mp3": { destination: path.join(FOLDERS.media, "Audio"), label: "Media (Audio)" },
  ".wav": { destination: path.join(FOLDERS.media, "Audio"), label: "Media (Audio)" },
};

export const GOVERNANCE_FILES = [
  { path: KEY_FILES.index, label: "INDEX.md" },
  { path: KEY_FILES.agents, label: "AGENTS.md" },
  { path: KEY_FILES.changelog, label: "CHANGELOG.md" },
  { path: KEY_FILES.quickRef, label: "QUICK-REFERENCE.md" },
  { path: KEY_FILES.todo, label: "TODO.md" },
  { path: KEY_FILES.claude, label: "CLAUDE.md" },
] as const;

export const STALE_DAYS = 30;
export const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB

/** Path where setup walkthrough actions are logged for undo/history. */
export const WALKTHROUGH_LOG_PATH = path.join(
  FOLDERS.homebase,
  // Nested project structure: 03_Projects/Projects/Active/<app-folder>
  "03_Projects",
  "Projects",
  "Active",
  "command-center",
  ".walkthrough-log.json"
);
