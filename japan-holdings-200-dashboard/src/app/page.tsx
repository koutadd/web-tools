'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

// 型定義
interface Company {
  id: string
  ranking_priority: number
  company_name: string
  display_name: string
  slug: string
  category: string
  matched_keyword: string
  industry: string
  note: string
  website_url: string
  source_url: string
  verification_note: string
  logo_status: string
  logo_path: string
}

// JSONは動的ロード
import companiesJson from '../../data/companies.json'
const allCompanies = companiesJson as Company[]

type FilterType = 'all' | 'holding' | 'group' | 'holdings_en' | 'group_en'
type SortType = 'priority' | 'name' | 'logo_first'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('priority')

  const filtered = useMemo(() => {
    let list = allCompanies.filter(c => {
      if (filter !== 'all' && c.category !== filter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return c.company_name.toLowerCase().includes(q) || c.display_name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)
      }
      return true
    })
    if (sort === 'priority') list = [...list].sort((a, b) => a.ranking_priority - b.ranking_priority)
    else if (sort === 'name') list = [...list].sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'))
    else list = [...list].sort((a, b) => {
      if (a.logo_status === 'collected' && b.logo_status !== 'collected') return -1
      if (a.logo_status !== 'collected' && b.logo_status === 'collected') return 1
      return a.ranking_priority - b.ranking_priority
    })
    return list
  }, [search, filter, sort])

  const totalCollected = allCompanies.filter(c => c.logo_status === 'collected').length
  const totalMissing = allCompanies.filter(c => c.logo_status === 'missing').length

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'holding', label: 'ホールディングス' },
    { key: 'group', label: 'グループ' },
    { key: 'holdings_en', label: 'HOLDINGS' },
    { key: 'group_en', label: 'GROUP' },
  ]

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px' }}>
          日本の「ホールディングス / グループ」企業 200社ロゴ一覧
        </h1>
        <div style={{ display: 'flex', gap: 20, fontSize: 14, color: '#555', flexWrap: 'wrap' }}>
          <span>総件数: <b style={{ color: '#111' }}>{allCompanies.length}社</b></span>
          <span>ロゴ取得: <b style={{ color: '#16a34a' }}>{totalCollected}社</b></span>
          <span>未取得: <b style={{ color: '#dc2626' }}>{totalMissing}社</b></span>
          <span>表示中: <b>{filtered.length}社</b></span>
        </div>
      </div>

      {/* コントロール */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text" placeholder="会社名・業種で検索..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 260, outline: 'none', backgroundColor: '#fff' }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid',
              borderColor: filter === f.key ? '#2563eb' : '#d1d5db',
              backgroundColor: filter === f.key ? '#2563eb' : '#fff',
              color: filter === f.key ? '#fff' : '#374151',
              cursor: 'pointer', fontSize: 12, fontWeight: filter === f.key ? 700 : 400,
            }}>{f.label}</button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortType)} style={{
          padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, backgroundColor: '#fff', cursor: 'pointer',
        }}>
          <option value="priority">優先順位順</option>
          <option value="name">会社名順</option>
          <option value="logo_first">ロゴ取得済み優先</option>
        </select>
      </div>

      {/* カードグリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {filtered.map(c => <CompanyCard key={c.id} c={c} />)}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 16 }}>
          該当する企業が見つかりませんでした
        </div>
      )}
    </div>
  )
}

function CompanyCard({ c }: { c: Company }) {
  const hasLogo = c.logo_status === 'collected' && c.logo_path
  const catColors: Record<string, { bg: string; color: string; border: string }> = {
    holding: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    group: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    holdings_en: { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
    group_en: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    mixed: { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
  }
  const cc = catColors[c.category] || catColors.mixed
  const catLabel: Record<string, string> = { holding: 'HD', group: 'GRP', holdings_en: 'HOLDINGS', group_en: 'GROUP', mixed: 'MIXED' }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ロゴエリア */}
      <div style={{ height: 150, backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#111', color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
          #{c.ranking_priority}
        </div>
        {hasLogo ? (
          <img src={`/${c.logo_path}`} alt={c.display_name} style={{ maxWidth: '100%', maxHeight: 115, objectFit: 'contain' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', lineHeight: 1.5, marginBottom: 6 }}>{c.display_name}</div>
            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: 10 }}>ロゴ未取得</span>
          </div>
        )}
      </div>
      {/* 情報エリア */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: '#111' }}>{c.display_name}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, backgroundColor: cc.bg, color: cc.color, border: `1px solid ${cc.border}` }}>
            {catLabel[c.category] || c.category}
          </span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{c.industry}</span>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {c.website_url && (
            <a href={c.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none', backgroundColor: '#f9fafb' }}>
              公式 →
            </a>
          )}
          <Link href={`/company/${c.slug}`} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #2563eb', color: '#2563eb', textDecoration: 'none', backgroundColor: '#eff6ff' }}>
            詳細
          </Link>
        </div>
      </div>
    </div>
  )
}
