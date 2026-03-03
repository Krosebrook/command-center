import fs from "fs/promises";
import path from "path";
import { FOLDERS, AUTOMATION_CATEGORIES } from "@/lib/config";
import { countFiles } from "@/lib/scanner";

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
        subfolders = entries
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        itemCount = entries.length;
      } catch {}

      return { name: cat, path: catPath, itemCount, subfolders };
    })
  );
}

const categoryIcons: Record<string, string> = {
  Agents: "bot",
  Assistants: "headphones",
  Automations: "repeat",
  Ecom: "shopping-cart",
  Education: "book",
  HR: "users",
  IT: "server",
  Marketing: "megaphone",
  Media: "film",
  Prompts: "message-square",
  RAG: "database",
  Sales: "trending-up",
  Security: "shield",
  SEO: "search",
  Social: "share-2",
  Support: "life-buoy",
  UI: "layout",
};

export default async function AutomationsPage() {
  const categories = await getCategories();
  const totalItems = categories.reduce((sum, c) => sum + c.itemCount, 0);

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Automation Library
        </h1>
        <p className="text-muted-foreground mt-1">
          {categories.length} categories &middot; {totalItems} total items
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{cat.name}</h3>
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                {cat.itemCount} items
              </span>
            </div>
            {cat.subfolders.length > 0 ? (
              <div className="space-y-1">
                {cat.subfolders.slice(0, 5).map((sf) => (
                  <p
                    key={sf}
                    className="text-xs text-muted-foreground truncate"
                    title={sf}
                  >
                    {sf}
                  </p>
                ))}
                {cat.subfolders.length > 5 && (
                  <p className="text-xs text-primary">
                    +{cat.subfolders.length - 5} more
                  </p>
                )}
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
