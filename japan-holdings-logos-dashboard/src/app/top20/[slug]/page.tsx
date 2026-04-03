'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import companiesRaw from '../../../../data/companies.json'
import top20Raw from '../../../../data/top20_group_map.json'

interface BrandLogo {
  name: string
  type: string
  logo_path: string
  source_url: string
  verified: boolean
}

interface Top20Entry {
  rank: number
  company_name: string
  slug: string
  group_type: string
  business_clusters: string[]
  logo_targets_hint: string[]
  group_logo_path: string
  collected_brand_logos: BrandLogo[]
  missing_brand_logos: string[]
  verification_notes: string
}

interface Company {
  slug: string
  display_name: string
  industry: string
  website_url: string
  category: string
  logo_path: string
  logo_status: string
  note: string
}

const companies = companiesRaw as Company[]
const top20 = top20Raw as Top20Entry[]

export default function Top20DetailPage({ params }: { params: { slug: string } }) {
  const entry = top20.find(e => e.slug === params.slug)
  if (!entry) notFound()

  const company = companies.find(c => c.slug === params.slug)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <Link href="/" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>
        ← 一覧に戻る
      </Link>

      {/* Parent Company Header */}
      <div style={{ marginTop: 24, marginBottom: 40, backgroundColor: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 260, height: 160, backgroundColor: '#f9fafb', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #e5e7eb', padding: 24, flexShrink: 0,
          }}>
            {company?.logo_status === 'collected' && company?.logo_path ? (
              <img
                src={`/${company.logo_path}`}
                alt={entry.company_name}
                style={{ maxWidth: '100%', maxHeight: 130, objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div style={{ fontSize: 18, fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>
                {entry.company_name}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>TOP{entry.rank}</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#111' }}>
              {entry.company_name}
            </h1>
            {company && (
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>{company.industry}</div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {entry.business_clusters.map(bc => (
                <span key={bc} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20,
                  backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
                }}>
                  {bc}
                </span>
              ))}
            </div>
            {company?.website_url && (
              <a href={company.website_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
                公式サイト: {company.website_url}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Collected Brand Logos */}
      {entry.collected_brand_logos.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#111' }}>
            主要事業・子会社・ブランドロゴ（取得済み: {entry.collected_brand_logos.length}件）
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {entry.collected_brand_logos.map(brand => (
              <div key={brand.name} style={{
                backgroundColor: '#fff', borderRadius: 12, padding: 20,
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: '100%', height: 100, backgroundColor: '#f9fafb', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
                }}>
                  <img
                    src={`/${brand.logo_path}`}
                    alt={brand.name}
                    style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', color: '#111' }}>
                  {brand.name}
                </div>
                <a href={brand.source_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#6b7280', textDecoration: 'none' }}>
                  ソース
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Brand Logos */}
      {entry.missing_brand_logos.length > 0 && (
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, padding: 28,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#dc2626' }}>
            ロゴ未取得（{entry.missing_brand_logos.length}件）
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {entry.missing_brand_logos.map(name => (
              <span key={name} style={{
                fontSize: 13, padding: '5px 14px', borderRadius: 8,
                backgroundColor: '#fef2f2', color: '#dc2626',
                border: '1px solid #fecaca',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
