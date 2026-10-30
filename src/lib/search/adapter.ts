export interface SearchResult {
  id: string;
  doctype: string;
  title: string;
  description?: string;
  url: string;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchOptions {
  doctypes?: string[];
  tenantId?: string;
  companyId?: string;
  limit?: number;
  offset?: number;
}

export interface ISearchAdapter {
  search(query: string, options?: SearchOptions): Promise<{ results: SearchResult[]; total: number }>;
  index(doctype: string, id: string, data: Record<string, unknown>): Promise<void>;
  remove(doctype: string, id: string): Promise<void>;
  reindex(doctype: string): Promise<void>;
}

interface IndexedDocument {
  id: string;
  doctype: string;
  tenantId?: string;
  companyId?: string;
  title: string;
  description?: string;
  url: string;
  content: string;
  data: Record<string, unknown>;
}

/**
 * In-Memory Search Adapter Implementation
 * 
 * Provides full-text token matching, multi-field scoring,
 * highlight snippets, and multi-tenant isolation.
 * Can be replaced by Postgres Full-Text Search (tsvector) or Meilisearch/Typesense.
 */
export class InMemorySearchAdapter implements ISearchAdapter {
  private documents = new Map<string, IndexedDocument>();

  private getDocKey(doctype: string, id: string): string {
    return `${doctype}:${id}`;
  }

  async index(doctype: string, id: string, data: Record<string, unknown>): Promise<void> {
    const title = String(data.title || data.name || data.id || id);
    const description = data.description ? String(data.description) : undefined;
    const url = String(data.url || `/app/${doctype.toLowerCase()}/${id}`);
    const tenantId = data.tenant_id ? String(data.tenant_id) : (data.tenantId ? String(data.tenantId) : undefined);
    const companyId = data.company_id ? String(data.company_id) : (data.companyId ? String(data.companyId) : undefined);

    // Concatenate all text values into searchable index content
    const content = Object.values(data)
      .filter((v) => typeof v === 'string' || typeof v === 'number')
      .join(' ')
      .toLowerCase();

    const doc: IndexedDocument = {
      id,
      doctype,
      tenantId,
      companyId,
      title,
      description,
      url,
      content,
      data,
    };

    this.documents.set(this.getDocKey(doctype, id), doc);
  }

  async remove(doctype: string, id: string): Promise<void> {
    this.documents.delete(this.getDocKey(doctype, id));
  }

  async reindex(doctype: string): Promise<void> {
    // Retains documents for other doctypes, clearing the target doctype
    for (const [key, doc] of this.documents.entries()) {
      if (doc.doctype.toLowerCase() === doctype.toLowerCase()) {
        this.documents.delete(key);
      }
    }
  }

  async search(
    query: string,
    options?: SearchOptions
  ): Promise<{ results: SearchResult[]; total: number }> {
    const cleanedQuery = query.trim().toLowerCase();
    if (!cleanedQuery) {
      return { results: [], total: 0 };
    }

    const queryTerms = cleanedQuery.split(/\s+/).filter(Boolean);
    const scored: Array<{ doc: IndexedDocument; score: number; highlights?: Record<string, string[]> }> = [];

    for (const doc of this.documents.values()) {
      // Tenant filter
      if (options?.tenantId && doc.tenantId && doc.tenantId !== options.tenantId) {
        continue;
      }
      // Company filter
      if (options?.companyId && doc.companyId && doc.companyId !== options.companyId) {
        continue;
      }
      // Doctype filter
      if (options?.doctypes && options.doctypes.length > 0) {
        const matchesDoctype = options.doctypes.some(
          (dt) => dt.toLowerCase() === doc.doctype.toLowerCase()
        );
        if (!matchesDoctype) {
          continue;
        }
      }

      let score = 0;
      const lowerTitle = doc.title.toLowerCase();
      const lowerDesc = (doc.description || '').toLowerCase();
      const lowerContent = doc.content;
      const matchedHighlights: Record<string, string[]> = {};

      for (const term of queryTerms) {
        // Exact title match weight
        if (lowerTitle.includes(term)) {
          score += 10;
          if (!matchedHighlights.title) matchedHighlights.title = [];
          matchedHighlights.title.push(doc.title);
        }

        // Description match weight
        if (lowerDesc.includes(term)) {
          score += 5;
          if (!matchedHighlights.description && doc.description) {
            matchedHighlights.description = [doc.description];
          }
        }

        // General content match weight
        if (lowerContent.includes(term)) {
          score += 1;
        }
      }

      if (score > 0) {
        scored.push({
          doc,
          score,
          highlights: Object.keys(matchedHighlights).length > 0 ? matchedHighlights : undefined,
        });
      }
    }

    // Sort by highest score descending
    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    const paginated = scored.slice(offset, offset + limit);

    const results: SearchResult[] = paginated.map(({ doc, score, highlights }) => ({
      id: doc.id,
      doctype: doc.doctype,
      title: doc.title,
      description: doc.description,
      url: doc.url,
      score,
      highlights,
    }));

    return { results, total };
  }
}

export function createSearchAdapter(): ISearchAdapter {
  return new InMemorySearchAdapter();
}
