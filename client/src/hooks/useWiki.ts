async createWikiEntry(entry: schema.InsertWikiEntry) {
        const now = new Date();
        const [e] = await db.insert(schema.wikiEntries)
            .values({ ...entry, createdAt: now, updatedAt: now })
            .returning();
        return e;
    }

    async updateWikiEntry(id: number, patch: Partial<schema.WikiEntry>) {
        const [e] = await db.update(schema.wikiEntries)
            .set({ ...patch, updatedAt: new Date() })
            .where(eq(schema.wikiEntries.id, id))
            .returning();
        return e;
    }