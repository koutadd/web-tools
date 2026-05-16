import { SiteResult } from './types'

export function exportCSV(sites: SiteResult[]): void {
  const headers = [
    'サイト名', 'URL', '業種', 'サイトタイプ',
    '総合スコア', 'セクション一致率', '順序一致率', '企業規模スコア', 'デザインスコア',
    '一致セクション', 'トンマナ', '類似理由', '大手理由', 'メモ'
  ]
  const rows = sites.map(s => [
    s.siteName,
    s.url,
    s.industry,
    s.siteType,
    s.totalScore,
    s.sectionMatchScore,
    s.orderMatchScore,
    s.companyScaleScore,
    s.designScore,
    s.matchedSections.join(' / '),
    s.toneTags.join(' / '),
    s.reasons.overall,
    s.reasons.companyScale,
    s.notes,
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `design-scout-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
