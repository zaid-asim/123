export interface Source {
  id: string;
  workspaceId: string;
  name: string;
  type: 'txt' | 'md' | 'csv' | 'json' | 'pdf' | 'docx';
  owner: string;
  scope: 'private' | 'shared' | 'public';
  trustScore: number;
  freshness: Date;
  versionHash: string;
  tokenCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Chunk {
  id: string;
  sourceId: string;
  text: string;
  embedding: number[]; // 768-dimension or similar
  page?: number;
  section?: string;
  tokenCount: number;
}
