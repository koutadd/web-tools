'use client'

import { useState, useMemo } from 'react'
import companiesData from '../../data/companies.json'

type Category = 'holding' | 'group'

interface Company {
  id: string
  company_name: string
  company_name_kana: string
  category: Category
  industry: string
  note: string
  website_url: string
  source_url: string
  is_japan_company: boolean
  ranking_priority: number
  collected_at: string
}

const companies = companiesData as Company[]

type FilterType = 'all' | 'holding' | 'group'
type SortType = 'priority' | 'name'

export default function Home() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('priority')

  const filtered = useMemo(() => {
    let result = companies.filter(c => {
      if (filter === 'holding') return c.category === 'holding'
      if (filter === 'group') return c.category === 'group'
      return true
    })

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(c =>
        c.company_name.toLowerCase().includes(q) ||
        c.company_name_kana.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      )
    }

    if (sort === 'priority') {
      result = [...result].sort((a, b) => a.ranking_priority - b.ranking_priority)
    } else {
      result = [...result].sort((a, b) => a.company_name.localeCompare(b.company_name, 'ja'))
    }

    return result
  }, [search, filter, sort])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
          日本の「ホールディングス」「グループ」企業一覧
        </h1>
        <p style={{ marginTop: 8, color: '#666', fontSize: 14 }}>
          総件数: <strong>{companies.length}社</strong>　表示件数: <strong>{filtered.length}社</strong>
        </p>
      </div>

      {/* コントロールバー */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {/* 検索 */}
        <input
          type="text"
          placeholder="会社名・かな・業種で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 14,
            width: 260,
            outline: 'none',
          }}
        />

        {/* フィルター */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'holding', 'group'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: filter === f ? '#0070f3' : '#ccc',
                backgroundColor: filter === f ? '#0070f3' : '#fff',
                color: filter === f ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === 'all' ? 'すべて' : f === 'holding' ? 'ホールディングス' : 'グループ'}
            </button>
          ))}
        </div>

        {/* 並び替え */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#555' }}>並び替え:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
            style={{
              padding: '6px 10px',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 13,
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="priority">優先順位順</option>
            <option value="name">会社名順</option>
          </select>
        </div>
      </div>

      {/* テーブル */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #e0e0e0' }}>
              <th style={thStyle}>順位</th>
              <th style={thStyle}>会社名</th>
              <th style={thStyle}>かな</th>
              <th style={thStyle}>区分</th>
              <th style={thStyle}>業種</th>
              <th style={thStyle}>公式サイト</th>
              <th style={thStyle}>補足</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr
                key={c.id}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
                }}
              >
                <td style={{ ...tdStyle, textAlign: 'center', width: 50, color: '#888', fontWeight: 600 }}>
                  {c.ranking_priority}
                </td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1a1a1a' }}>
                  {c.company_name}
                </td>
                <td style={{ ...tdStyle, color: '#666', fontSize: 12 }}>
                  {c.company_name_kana}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: c.category === 'holding' ? '#e8f4fd' : '#e8fde8',
                    color: c.category === 'holding' ? '#0070c0' : '#006400',
                    border: `1px solid ${c.category === 'holding' ? '#90caf9' : '#90ee90'}`,
                  }}>
                    {c.category === 'holding' ? 'HD' : 'GRP'}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: '#444' }}>{c.industry}</td>
                <td style={tdStyle}>
                  {c.website_url ? (
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0070f3', textDecoration: 'none', fontSize: 12 }}
                    >
                      サイトを開く →
                    </a>
                  ) : '—'}
                </td>
                <td style={{ ...tdStyle, color: '#666', fontSize: 12, maxWidth: 200 }}>
                  {c.note || '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  該当する企業が見つかりませんでした
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: '#aaa', textAlign: 'right' }}>
        データ最終更新: {companies[0]?.collected_at ? new Date(companies[0].collected_at).toLocaleDateString('ja-JP') : '—'}
      </p>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#555',
  fontSize: 13,
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'top',
}
