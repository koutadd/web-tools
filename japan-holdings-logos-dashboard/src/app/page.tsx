'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import companiesRaw from '../../data/companies.json'

type Category = 'holding' | 'group'
interface Company {
  id: string
  ranking_priority: number
  company_name: string
  display_name: string
  slug: string
  category: Category
  industry: string
  note: string
  website_url: string
  logo_status: string
  logo_path: string
  has_top20_detail: boolean
}
const companies = companiesRaw as Company[]
type FilterType = 'all' | 'holding' | 'group'
type SortType = 'priority' | 'name'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('priority')

  const filtered = useMemo(() => {
    let list = companies.filter(c => {
      if (filter === 'holding') return c.category === 'holding'
      if (filter === 'group') return c.category === 'group'
      return true
    })
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c =>
        c.company_name.toLowerCase().includes(q) ||
        c.display_name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      )
    }
    if (sort === 'priority') list = [...list].sort((a, b) => a.ranking_priority - b.ranking_priority)
    else list = [...list].sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'))
    return list
  }, [search, filter, sort])

  const totalCollected = companies.filter(c => c.logo_status === 'collected').length
  const totalMissing = companies.filter(c => c.logo_status === 'missing').length
  const totalPending = companies.filter(c => c.logo_status === 'pending').length

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#111' }}>
          日本の「ホールディングス」「グループ」企業ロゴ一覧
        </h1>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, color: '#555' }}>
          <span>総件数: <strong style={{ color: '#111' }}>{companies.length}社</strong></span>
          <span>ロゴ取得済み: <strong style={{ color: '#16a34a' }}>{totalCollected}</strong></span>
          <span>missing: <strong style={{ color: '#dc2626' }}>{totalMissing}</strong></span>
          {totalPending > 0 && <span>pending: <strong style={{ color: '#d97706' }}>{totalPending}</strong></span>}
          <span>表示中: <strong style={{ color: '#111' }}>{filtered.length}社</strong></span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="会社名・業種で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 8,
            fontSize: 14, width: 280, outline: 'none', backgroundColor: '#fff',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'holding', 'group'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid', borderColor: filter === f ? '#2563eb' : '#d1d5db',
              backgroundColor: filter === f ? '#2563eb' : '#fff',
              color: filter === f ? '#fff' : '#374151',
              cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 700 : 400,
            }}>
              {f === 'all' ? 'すべて' : f === 'holding' ? 'ホールディングス' : 'グループ'}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortType)} style={{
          padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
          fontSize: 13, backgroundColor: '#fff', cursor: 'pointer',
        }}>
          <option value="priority">優先順位順</option>
          <option value="name">会社名順</option>
        </select>
      </div>

      {/* Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 20,
      }}>
        {filtered.map(c => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 16 }}>
          該当する企業が見つかりませんでした
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company: c }: { company: Company }) {
  const hasLogo = c.logo_status === 'collected' && c.logo_path
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Logo Area */}
      <div style={{
        height: 160,
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{
          position: 'absolute', top: 10, left: 10,
          backgroundColor: '#111', color: '#fff',
          borderRadius: 6, padding: '2px 8px',
          fontSize: 11, fontWeight: 700,
        }}>
          #{c.ranking_priority}
        </div>
        {c.has_top20_detail && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            backgroundColor: '#f59e0b', color: '#fff',
            borderRadius: 6, padding: '2px 8px',
            fontSize: 10, fontWeight: 700,
          }}>
            TOP20
          </div>
        )}
        {hasLogo ? (
          <img
            src={`/${c.logo_path}`}
            alt={c.display_name}
            style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{
            fontSize: 15, fontWeight: 700, color: '#6b7280',
            textAlign: 'center', lineHeight: 1.5,
          }}>
            {c.display_name}
          </div>
        )}
      </div>

      {/* Info Area */}
      <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.4 }}>
          {c.display_name}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            backgroundColor: c.category === 'holding' ? '#eff6ff' : '#f0fdf4',
            color: c.category === 'holding' ? '#1d4ed8' : '#15803d',
            border: `1px solid ${c.category === 'holding' ? '#bfdbfe' : '#bbf7d0'}`,
          }}>
            {c.category === 'holding' ? 'HD' : 'GRP'}
          </span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{c.industry}</span>
        </div>
        {c.logo_status === 'missing' && (
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 500 }}>ロゴ未取得</div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={c.website_url} target="_blank" rel="noopener noreferrer" style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 6,
            border: '1px solid #d1d5db', color: '#374151',
            textDecoration: 'none', backgroundColor: '#f9fafb',
          }}>
            公式サイト
          </a>
          {c.has_top20_detail && (
            <Link href={`/top20/${c.slug}`} style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 6,
              border: '1px solid #2563eb', color: '#2563eb',
              textDecoration: 'none', backgroundColor: '#eff6ff',
              fontWeight: 600,
            }}>
              グループ詳細
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
