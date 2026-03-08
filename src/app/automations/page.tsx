import fs from "fs/promises";
import path from "path";
import { FOLDERS, AUTOMATION_CATEGORIES } from "@/lib/config";
import { AutomationRunner } from "@/components/AutomationRunner";

export const dynamic = "force-dynamic";

interface CategoryInfo {
  name: string;
  path: string;
  itemCount: number;
  subfolders: string[];
}

async function getCategories(): Promise<CategoryInfo[]> {
  const basePath = path.join(FOLDERS.homebase, "02_Automations");

  return Promise.all(
    AUTOMATION_CATEGORIES.map(async (cat) => {
      const catPath = path.join(basePath, cat);
      let itemCount = 0;
      let subfolders: string[] = [];

      try {
        const entries = await fs.readdir(catPath, { withFileTypes: true });
        subfolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
        itemCount = entries.length;
      } catch {
        // Category folder may not exist
      }

      return { name: cat, path: catPath, itemCount, subfolders };
    }),
  );
}

export default async function AutomationsPage() {
  const categories = await getCategories();
  const totalItems = categories.reduce((sum, c) => sum + c.itemCount, 0);

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Automation Library
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {categories.length} categories &middot; {totalItems} total items
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="hud-card p-5 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{cat.name}</h3>
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                {cat.itemCount} items
              </span>
            </div>
            {cat.subfolders.length > 0 ? (
              <div className="space-y-4">
                {cat.subfolders.map((sf) => (
                  <div key={sf} className="flex flex-col gap-1 border-b border-border/50 pb-2 last:border-0">
                    <p
                      className="text-xs text-foreground font-medium truncate"
                      title={sf}
                    >
                      {sf}
                    </p>
                    <AutomationRunner 
                      label={sf} 
                      targetPath={path.join(cat.path, sf)} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No templates yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
