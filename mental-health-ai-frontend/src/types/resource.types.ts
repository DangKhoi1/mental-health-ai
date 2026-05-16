export interface ResourceItem {
  resourceId: string;
  title: string;
  description: string;
  categoryCode: 'RES_MEDITATION' | 'RES_BREATHING' | 'RES_ARTICLE' | 'RES_VIDEO' | 'RES_MUSIC';
  typeCode: 'TYPE_VIDEO' | 'TYPE_ARTICLE' | 'TYPE_AUDIO';
  contentUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourcePayload {
  title: string;
  description: string;
  categoryCode: string;
  typeCode: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  isActive?: boolean;
}

export interface PaginatedResourcesResponse {
  resources: ResourceItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
