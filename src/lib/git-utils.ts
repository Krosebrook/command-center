import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { logger } from "./logger";

const execAsync = promisify(exec);

export interface GitStatus {
  isRepo: boolean;
  branch: string | null;
  hasChanges: boolean;
  unpushed: boolean;
}

export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  const defaultStatus: GitStatus = {
    isRepo: false,
    branch: null,
    hasChanges: false,
    unpushed: false,
  };

  try {
    // Check if .git folder exists
    const gitPath = path.join(projectPath, ".git");
    const stat = await fs.stat(gitPath).catch(() => null);
    
    if (!stat) {
      return defaultStatus;
    }

    defaultStatus.isRepo = true;

    // Get current branch
    const { stdout: branchOut } = await execAsync("git branch --show-current", { cwd: projectPath });
    defaultStatus.branch = branchOut.trim() || null;

    // Get changes (modified, added, deleted, untracked)
    const { stdout: statusOut } = await execAsync("git status --porcelain", { cwd: projectPath });
    defaultStatus.hasChanges = statusOut.trim().length > 0;

    // Get unpushed changes (commits ahead of origin)
    try {
      // Need to fetch remote info first if not fresh, but for local speed we just compare to tracked branch
      const { stdout: cherryOut } = await execAsync(`git cherry -v`, { cwd: projectPath });
      defaultStatus.unpushed = cherryOut.trim().length > 0;
    } catch {
      // No upstream or generic error
    }

    return defaultStatus;
  } catch (error) {
    logger.warn(`Failed to get git status for ${projectPath}`, { error });
    return defaultStatus;
  }
}
