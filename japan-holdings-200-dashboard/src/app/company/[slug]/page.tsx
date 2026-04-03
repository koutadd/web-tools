import { notFound } from 'next/navigation'
import Link from 'next/link'
import companiesJson from '../../../../data/companies.json'
import top50MapJson from '../../../../data/top50_group_map.json'

interface Company {
  id: string; ranking_priority: number; company_name: string; display_name: string;
  slug: string; category: string; matched_keyword: string; industry: string; note: string;
  website_url: string; source_url: string; verification_source_type: string;
  is_japan_company: boolean; verified: boolean; verification_note: string;
  logo_status: string; logo_path: string;
}
const companies = companiesJson as Company[]

interface BrandTarget {
  name: string
  website_url: string
  type: string
  logo_path: string
  logo_status: string
  source_url: string
}

interface Top50Entry {
  rank: number
  slug: string
  company_name: string
  brand_targets: BrandTarget[]
}

const top50Map = top50MapJson as Top50Entry[]

export function generateStaticParams() {
  return companies.map(c => ({ slug: c.slug }))
}

export default function CompanyDetailPage({ params }: { params: { slug: string } }) {
  const c = companies.find(c => c.slug === params.slug)
  if (!c) notFound()

  const hasLogo = c.logo_status === 'collected' && c.logo_path

  const top50Entry = top50Map.find(e => e.slug === params.slug)
  const collectedBrands = top50Entry?.brand_targets.filter(b => b.logo_status === 'collected') || []
  const missingBrands = top50Entry?.brand_targets.filter(b => b.logo_status !== 'collected') || []

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <Link href="/" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>← 一覧に戻る</Link>

      <div style={{ marginTop: 24, backgroundColor: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* ロゴ特大表示 */}
        <div style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, minHeight: 200 }}>
          {hasLogo ? (
            <img src={`/${c.logo_path}`} alt={c.display_name} style={{ maxWidth: '70%', maxHeight: 160, objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#6b7280' }}>{c.display_name}</div>
              <div style={{ marginTop: 12, fontSize: 13, color: '#ef4444' }}>ロゴ未取得</div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>#{c.ranking_priority}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px' }}>{c.company_name}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['業種', c.industry],
            ['区分', c.category],
            ['マッチキーワード', c.matched_keyword],
            ['日本企業', c.is_japan_company ? 'はい' : 'いいえ'],
            ['検証済み', c.verified ? 'Yes' : '未検証'],
            ['ロゴ状態', c.logo_status],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{String(value)}</div>
            </div>
          ))}
        </div>

        {c.verification_note && (
          <div style={{ marginTop: 20, padding: '12px 16px', backgroundColor: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 11, color: '#92400e', marginBottom: 4 }}>検証メモ</div>
            <div style={{ fontSize: 13, color: '#78350f' }}>{c.verification_note}</div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {c.website_url && (
            <a href={c.website_url} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              公式サイトを開く →
            </a>
          )}
          {c.source_url && c.source_url !== c.website_url && (
            <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
              情報ソース →
            </a>
          )}
        </div>

        {c.logo_path && (
          <div style={{ marginTop: 20, padding: '10px 14px', backgroundColor: '#f9fafb', borderRadius: 8, fontSize: 12, color: '#6b7280' }}>
            ロゴファイル: <code>{c.logo_path}</code>
          </div>
        )}
        {c.logo_status === 'missing' && (
          <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
            このロゴは自動収集で取得できませんでした。公式サイトで確認し、手動で <code>public/logos/companies/{c.slug}.png</code> に配置してください。
          </div>
        )}

        {/* 傘下ブランドロゴセクション */}
        {top50Entry && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #e5e7eb' }}>
              グループ傘下ブランド ({top50Entry.brand_targets.length}社)
            </h2>

            {collectedBrands.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>取得済みロゴ ({collectedBrands.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {collectedBrands.map(brand => (
                    <a
                      key={brand.name}
                      href={brand.website_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        backgroundColor: '#f9fafb',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        textDecoration: 'none',
                        minHeight: 100,
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      {brand.logo_path ? (
                        <img
                          src={`/${brand.logo_path}`}
                          alt={brand.name}
                          style={{ maxWidth: 140, maxHeight: 60, objectFit: 'contain', marginBottom: 8 }}
                        />
                      ) : null}
                      <div style={{ fontSize: 11, color: '#374151', fontWeight: 600, textAlign: 'center' }}>{brand.name}</div>
                      <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{brand.type}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {missingBrands.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>未取得 ({missingBrands.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {missingBrands.map(brand => (
                    <div
                      key={brand.name}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef2f2',
                        borderRadius: 6,
                        border: '1px solid #fecaca',
                        fontSize: 12,
                        color: '#dc2626',
                      }}
                    >
                      {brand.name}
                      {brand.website_url && (
                        <a
                          href={brand.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: 6, color: '#2563eb', fontSize: 10 }}
                        >
                          →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
