import fs from "fs/promises";
import path from "path";
import { PROJECTS, FOLDERS } from "@/lib/config";
import { countFiles, fileExists } from "@/lib/scanner";
import { readFileContent } from "@/lib/parser";
import { ProjectCard } from "@/components/ProjectCard";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProjectDetail {
  name: string;
  description: string;
  techStack: readonly string[];
  status: string;
  path: string;
  fileCount: number;
  lastModified: string;
  indexContent: string | null;
  exists: boolean;
}

async function getProjectDetails(): Promise<ProjectDetail[]> {
  return Promise.all(
    PROJECTS.map(async (project) => {
      const exists = await fileExists(project.path);
      let fileCount = 0;
      let lastModified = "Unknown";
      let indexContent: string | null = null;

      if (exists) {
        fileCount = await countFiles(project.path);
        try {
          const stat = await fs.stat(project.path);
          lastModified = formatDate(stat.mtime);
        } catch {}
        const indexPath = path.join(project.path, "_INDEX.md");
        if (await fileExists(indexPath)) {
          indexContent = await readFileContent(indexPath);
        }
      }

      return {
        ...project,
        fileCount,
        lastModified,
        indexContent,
        exists,
      };
    })
  );
}

async function getActiveProjects(): Promise<string[]> {
  try {
    const activePath = path.join(FOLDERS.homebase, "03_Projects", "Projects", "Active");
    const entries = await fs.readdir(activePath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const [projects, activeNames] = await Promise.all([
    getProjectDetails(),
    getActiveProjects(),
  ]);

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Explorer</h1>
        <p className="text-muted-foreground mt-1">
          {projects.length} defined projects &middot;{" "}
          {activeNames.length} in Active folder
        </p>
      </div>

      {/* Key Projects */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Source-of-Truth Projects</h2>
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.name}
              name={p.name}
              description={p.description}
              techStack={p.techStack}
              status={p.exists ? p.status : "missing"}
              path={p.path}
              fileCount={p.fileCount}
              lastModified={p.lastModified}
            />
          ))}
        </div>
      </div>

      {/* Active Projects */}
      {activeNames.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Active Projects ({path.join(FOLDERS.homebase, "03_Projects", "Projects", "Active") + path.sep})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {activeNames.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="font-medium text-sm">{name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Active/{name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
