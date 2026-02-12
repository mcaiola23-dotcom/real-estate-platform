export type WebsiteModuleKey =
  | 'at_a_glance'
  | 'schools'
  | 'taxes'
  | 'walk_score'
  | 'points_of_interest'
  | 'listings';

export interface ModuleConfig {
  id: string;
  tenantId: string;
  moduleKey: WebsiteModuleKey;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteConfig {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  modules: ModuleConfig[];
}
