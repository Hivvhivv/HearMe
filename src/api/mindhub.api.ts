import type { MindHubContent } from "../types";
import { mindHubContents as mockContents } from "../data/mockData";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// mind_hub_contents table: id, category, title, content, image, duration, published, created_at, updated_at
// SELECT * FROM mind_hub_contents WHERE published = true ORDER BY created_at DESC
// ======================================================

const KEY = "hearme_mindhub_admin";

function all(): MindHubContent[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const init: MindHubContent[] = mockContents.map((c) => ({
      ...c,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    localStorage.setItem(KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(raw);
}
function save(c: MindHubContent[]) { localStorage.setItem(KEY, JSON.stringify(c)); }

export const mindHubAPI = {
  getAll: async (publishedOnly = true): Promise<MindHubContent[]> => {
    return publishedOnly ? all().filter((c) => c.published) : all();
  },

  getById: async (id: string): Promise<MindHubContent | null> => {
    return all().find((c) => c.id === id) || null;
  },

  create: async (data: Omit<MindHubContent, "id" | "createdAt" | "updatedAt">): Promise<MindHubContent> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → INSERT INTO mind_hub_contents (...) VALUES (...)
    const item: MindHubContent = {
      ...data,
      id: `mh_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save([...all(), item]);
    return item;
  },

  update: async (id: string, data: Partial<MindHubContent>): Promise<MindHubContent> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → UPDATE mind_hub_contents SET ... WHERE id = ?
    const updated = all().map((c) => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c);
    save(updated);
    return updated.find((c) => c.id === id)!;
  },

  delete: async (id: string): Promise<void> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → DELETE FROM mind_hub_contents WHERE id = ?
    save(all().filter((c) => c.id !== id));
  },

  togglePublish: async (id: string): Promise<void> => {
    save(all().map((c) => c.id === id ? { ...c, published: !c.published, updatedAt: new Date().toISOString() } : c));
  },
};
