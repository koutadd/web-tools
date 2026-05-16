export interface SearchParams {
  industry: string
  siteType: string
  tones: string[]
  sections: string[]
  requiredSections: string[]
  excludeTypes: string[]
  uploadedImage?: string // base64
}

export interface SiteReasons {
  sectionMatch: string
  companyScale: string
  toneMatch: string
  overall: string
}

export interface SiteResult {
  id: string
  siteName: string
  url: string
  thumbnailUrl: string   // thum.io PC URL
  thumbnailSpUrl: string // thum.io SP URL
  industry: string
  siteType: string
  companyScaleScore: number  // 0-100
  sectionMatchScore: number  // 0-100
  orderMatchScore: number    // 0-100
  designScore: number        // 0-100
  totalScore: number         // 0-100
  matchedSections: string[]
  toneTags: string[]
  reasons: SiteReasons
  notes: string
  isFavorite: boolean
}

export type SortKey = 'totalScore' | 'sectionMatchScore' | 'companyScaleScore' | 'designScore' | 'orderMatchScore'
export type ViewMode = 'pc' | 'sp' | 'both'
