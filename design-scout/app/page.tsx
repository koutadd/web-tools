'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchParams, SiteResult, SortKey } from '@/lib/types'
import { exportCSV } from '@/lib/export'

// ─── Quota ───────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 1500
const SAFE_LIMIT = 1470 // stop here to avoid any risk of charges

interface UsageData { date: string; count: number }

function getTodayKey() { return new Date().toISOString().slice(0, 10) }

function loadUsage(): UsageData {
  try {
    const raw = localStorage.getItem('gemini-daily-usage')
    if (raw) {
      const d = JSON.parse(raw) as UsageData
      if (d.date === getTodayKey()) return d
    }
  } catch {}
  return { date: getTodayKey(), count: 0 }
}

function saveUsage(u: UsageData) {
  try { localStorage.setItem('gemini-daily-usage', JSON.stringify(u)) } catch {}
}

function QuotaMeter({ count }: { count: number }) {
  const pct = Math.min((count / DAILY_LIMIT) * 100, 100)
  const remaining = Math.max(DAILY_LIMIT - count, 0)
  const isWarn = pct >= 80
  const isStop = count >= SAFE_LIMIT
  const barColor = isStop ? 'bg-red-500' : isWarn ? 'bg-yellow-500' : 'bg-emerald-500'
  const textColor = isStop ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-gray-400'

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <p className={`text-xs font-medium ${textColor}`}>
          {isStop ? '上限到達 — 0 回' : `残り ${remaining.toLocaleString()} 回`}
        </p>
        <p className="text-xs text-gray-600">{count.toLocaleString()} / {DAILY_LIMIT.toLocaleString()} 今日</p>
      </div>
      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const INDUSTRY_OPTIONS = ['SaaS/IT', '医療/ヘルスケア', '美容/コスメ', '教育', '不動産', '金融/保険', '製造業', 'EC/小売', '人材', '食品/飲料', 'エンタメ', '建設/建築', 'コンサルティング', '物流', 'その他']
const SITE_TYPE_OPTIONS = ['サービスサイト', '採用サイト', 'ブランドサイト', 'LP', 'コーポレートサイト', 'EC', 'メディア', 'ポートフォリオ']
const TONE_OPTIONS = ['高級感', '信頼感', '先進性', '誠実', 'やさしい', '女性向け', 'BtoB感', 'スタートアップ感', 'ポップ', 'シンプル', '力強い', '親しみやすい']
const SECTION_PRESETS = ['ファーストビュー', '課題提起', '特徴・強み', '選ばれる理由', '導入事例', 'お客様の声', '料金・プラン', 'FAQ', 'CTA', '会社概要', 'フッター', 'サービス一覧', '実績数字', 'メディア掲載', 'チーム紹介', '採用情報', 'ニュース']
const EXCLUDE_OPTIONS = ['海外サイト', '個人ブログ', 'アフィリエイト', 'まとめサイト', 'LP', 'EC', 'メディア']

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'totalScore', label: '総合スコア' },
  { key: 'sectionMatchScore', label: 'セクション一致率' },
  { key: 'companyScaleScore', label: '企業規模スコア' },
  { key: 'designScore', label: 'デザインスコア' },
  { key: 'orderMatchScore', label: '順序一致率' },
]

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-lg font-bold ${color}`}>{score}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

// ─── Section Chip ─────────────────────────────────────────────────────────────

function Chip({ label, variant = 'default' }: { label: string; variant?: 'default' | 'matched' | 'tone' }) {
  const cls = {
    default: 'bg-gray-800 text-gray-300',
    matched: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
    tone: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  }[variant]
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{label}</span>
}

// ─── Site Card ────────────────────────────────────────────────────────────────

function SiteCard({
  site,
  onFavorite,
  onNoteChange,
  onDetail,
}: {
  site: SiteResult
  onFavorite: (id: string) => void
  onNoteChange: (id: string, note: string) => void
  onDetail: (site: SiteResult) => void
}) {
  const [imgError, setImgError] = useState(false)

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col hover:border-gray-600 transition-colors">
      {/* Thumbnail */}
      <div
        className="relative cursor-pointer group"
        onClick={() => onDetail(site)}
      >
        {!imgError ? (
          <img
            src={site.thumbnailUrl}
            alt={site.siteName}
            className="w-full h-40 object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-40 bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
            スクショ取得失敗
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">詳細を見る</span>
        </div>
        {/* Total score overlay */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${site.totalScore >= 80 ? 'bg-emerald-500' : site.totalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
          {site.totalScore}点
        </div>
        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(site.id) }}
          className="absolute top-2 left-2 text-lg hover:scale-110 transition-transform"
        >
          {site.isFavorite ? '⭐' : '☆'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-white truncate">{site.siteName}</h3>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {site.url}
          </a>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Chip label={site.industry} />
            <Chip label={site.siteType} />
          </div>
        </div>

        {/* Scores row */}
        <div className="grid grid-cols-4 gap-1 py-2 border-t border-b border-gray-800">
          <ScoreBadge score={site.totalScore} label="総合" color={scoreColor(site.totalScore)} />
          <ScoreBadge score={site.sectionMatchScore} label="セクション" color={scoreColor(site.sectionMatchScore)} />
          <ScoreBadge score={site.companyScaleScore} label="企業規模" color={scoreColor(site.companyScaleScore)} />
          <ScoreBadge score={site.designScore} label="デザイン" color={scoreColor(site.designScore)} />
        </div>

        {/* Matched sections */}
        {site.matchedSections.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">一致セクション</p>
            <div className="flex flex-wrap gap-1">
              {site.matchedSections.map((s) => (
                <Chip key={s} label={s} variant="matched" />
              ))}
            </div>
          </div>
        )}

        {/* Tone tags */}
        {site.toneTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {site.toneTags.map((t) => (
              <Chip key={t} label={t} variant="tone" />
            ))}
          </div>
        )}

        {/* Overall reason */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 leading-relaxed">{site.reasons.overall}</p>
        </div>

        {/* Expandable reasons */}
        <details className="text-xs">
          <summary className="text-gray-500 cursor-pointer hover:text-gray-300">詳細理由を見る</summary>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-blue-400 font-medium">セクション: </span>
              <span className="text-gray-400">{site.reasons.sectionMatch}</span>
            </div>
            <div>
              <span className="text-emerald-400 font-medium">大手判定: </span>
              <span className="text-gray-400">{site.reasons.companyScale}</span>
            </div>
            <div>
              <span className="text-purple-400 font-medium">トンマナ: </span>
              <span className="text-gray-400">{site.reasons.toneMatch}</span>
            </div>
          </div>
        </details>

        {/* Note */}
        <textarea
          value={site.notes}
          onChange={(e) => onNoteChange(site.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="メモ..."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 p-2 resize-none focus:outline-none focus:border-gray-500 placeholder-gray-600"
        />
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ site, onClose }: { site: SiteResult; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{site.siteName}</h2>
              <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">{site.url}</a>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none ml-4">×</button>
          </div>

          {/* Screenshots side by side */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-2 uppercase">PC (1280px)</p>
              <img src={site.thumbnailUrl} alt="PC" className="w-full rounded-lg border border-gray-800" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div className="w-32 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-2 uppercase">SP (390px)</p>
              <img src={site.thumbnailSpUrl} alt="SP" className="w-full rounded-lg border border-gray-800" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          </div>

          {/* Score grid */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: '総合スコア', value: site.totalScore },
              { label: 'セクション一致', value: site.sectionMatchScore },
              { label: '順序一致', value: site.orderMatchScore },
              { label: '企業規模', value: site.companyScaleScore },
              { label: 'デザイン', value: site.designScore },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">一致セクション</h3>
              <div className="flex flex-wrap gap-1">
                {site.matchedSections.map(s => <Chip key={s} label={s} variant="matched" />)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">推定トンマナ</h3>
              <div className="flex flex-wrap gap-1">
                {site.toneTags.map(t => <Chip key={t} label={t} variant="tone" />)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: '類似理由', text: site.reasons.overall, color: 'text-white' },
              { label: 'セクション分析', text: site.reasons.sectionMatch, color: 'text-blue-400' },
              { label: '大手・資本力の判断', text: site.reasons.companyScale, color: 'text-emerald-400' },
              { label: 'トンマナ分析', text: site.reasons.toneMatch, color: 'text-purple-400' },
            ].map(({ label, text, color }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3">
                <p className={`text-xs font-semibold mb-1 ${color}`}>{label}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Search Form ──────────────────────────────────────────────────────────────

function SearchForm({
  onSearch,
  isLoading,
  isLimitReached,
}: {
  onSearch: (params: SearchParams) => void
  isLoading: boolean
  isLimitReached: boolean
}) {
  const [industry, setIndustry] = useState('')
  const [siteType, setSiteType] = useState('')
  const [tones, setTones] = useState<string[]>([])
  const [sections, setSections] = useState<string[]>([])
  const [requiredSections, setRequiredSections] = useState<string[]>([])
  const [excludeTypes, setExcludeTypes] = useState<string[]>([])
  const [uploadedImage, setUploadedImage] = useState<string | undefined>()
  const [isDragging, setIsDragging] = useState(false)
  const [customSection, setCustomSection] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const addSection = (s: string) => {
    if (s && !sections.includes(s)) setSections([...sections, s])
  }

  const removeSection = (s: string) => setSections(sections.filter(x => x !== s))

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setUploadedImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    onSearch({ industry, siteType, tones, sections, requiredSections, excludeTypes, uploadedImage })
  }

  return (
    <div className="space-y-5">
      {/* Image upload */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">
          参考スクショ
          <span className="ml-1 text-blue-400 normal-case font-normal">← セクション自動解析</span>
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-400 bg-blue-950/20' : 'border-gray-700 hover:border-gray-600'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {uploadedImage ? (
            <div className="relative">
              <img src={uploadedImage} alt="" className="w-full h-32 object-cover rounded" />
              <button
                onClick={(e) => { e.stopPropagation(); setUploadedImage(undefined) }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-black"
              >×</button>
              <div className="mt-2 text-left">
                <p className="text-xs text-blue-300 font-medium">AI解析モード ON</p>
                <p className="text-xs text-gray-500 leading-relaxed">このサイトのセクション構成・デザインパターンを自動抽出して類似サイトを検索します</p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-gray-400 text-sm font-medium">ドロップまたはクリック</p>
              <p className="text-gray-600 text-xs mt-1">参考サイトのスクショを入れるとセクション構成を自動解析して類似サイトを検索</p>
            </div>
          )}
        </div>
      </div>

      {/* Industry */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">業種</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
        >
          <option value="">選択...</option>
          {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Site type */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">サイトタイプ</label>
        <select
          value={siteType}
          onChange={(e) => setSiteType(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
        >
          <option value="">選択...</option>
          {SITE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Tones */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">トンマナ</label>
        <div className="flex flex-wrap gap-1.5">
          {TONE_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => toggleArr(tones, t, setTones)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${tones.includes(t) ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">セクション構成（上から並び順）</label>
        {/* Selected sections as ordered list */}
        {sections.length > 0 && (
          <div className="mb-2 space-y-1">
            {sections.map((s, i) => (
              <div key={s} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1 text-sm">
                <span className="text-gray-500 text-xs w-5">{i + 1}</span>
                <span className="flex-1 text-gray-200">{s}</span>
                <button
                  onClick={() => toggleArr(requiredSections, s, setRequiredSections)}
                  className={`text-xs px-1.5 rounded ${requiredSections.includes(s) ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                  title="必須"
                >必須</button>
                <button onClick={() => removeSection(s)} className="text-gray-600 hover:text-red-400 text-sm">×</button>
              </div>
            ))}
          </div>
        )}
        {/* Presets */}
        <div className="flex flex-wrap gap-1">
          {SECTION_PRESETS.filter(s => !sections.includes(s)).map(s => (
            <button
              key={s}
              onClick={() => addSection(s)}
              className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 hover:bg-blue-900/50 hover:text-blue-300 transition-colors"
            >+ {s}</button>
          ))}
        </div>
        {/* Custom input */}
        <div className="flex gap-2 mt-2">
          <input
            value={customSection}
            onChange={(e) => setCustomSection(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addSection(customSection); setCustomSection('') } }}
            placeholder="カスタムセクション名..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-gray-500 placeholder-gray-600"
          />
          <button
            onClick={() => { addSection(customSection); setCustomSection('') }}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded"
          >追加</button>
        </div>
      </div>

      {/* Exclude types */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">除外タイプ</label>
        <div className="flex flex-wrap gap-1.5">
          {EXCLUDE_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => toggleArr(excludeTypes, t, setExcludeTypes)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${excludeTypes.includes(t) ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || isLimitReached}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {isLoading ? '検索中...' : isLimitReached ? '今日の上限に達しました（明日リセット）' : '日本サイトを収集する'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'design-scout-sites'

export default function Home() {
  const [sites, setSites] = useState<SiteResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('totalScore')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterSiteType, setFilterSiteType] = useState('')
  const [filterMinScore, setFilterMinScore] = useState(0)
  const [detailSite, setDetailSite] = useState<SiteResult | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [usage, setUsage] = useState<UsageData>({ date: getTodayKey(), count: 0 })

  const isLimitReached = usage.count >= SAFE_LIMIT

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSites(JSON.parse(saved))
    } catch {}
    setUsage(loadUsage())
  }, [])

  const persistSites = useCallback((updated: SiteResult[]) => {
    setSites(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }, [])

  const handleSearch = async (params: SearchParams) => {
    if (isLimitReached) return
    // Increment usage before API call
    const newUsage = { date: getTodayKey(), count: usage.count + 1 }
    setUsage(newUsage)
    saveUsage(newUsage)

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Merge with existing, keeping favorites
      const existingMap = new Map(sites.map(s => [s.url, s]))
      const merged = (data.sites as SiteResult[]).map(s => ({
        ...s,
        isFavorite: existingMap.get(s.url)?.isFavorite ?? false,
        notes: existingMap.get(s.url)?.notes ?? '',
      }))
      persistSites(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavorite = (id: string) => {
    persistSites(sites.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
  }

  const handleNoteChange = (id: string, note: string) => {
    persistSites(sites.map(s => s.id === id ? { ...s, notes: note } : s))
  }

  const handleClear = () => {
    if (confirm('保存済みサイトをすべてクリアしますか？')) {
      persistSites([])
    }
  }

  // Filter + sort
  const filtered = sites
    .filter(s => !filterFavorite || s.isFavorite)
    .filter(s => !filterIndustry || s.industry === filterIndustry)
    .filter(s => !filterSiteType || s.siteType === filterSiteType)
    .filter(s => s.totalScore >= filterMinScore)
    .sort((a, b) => b[sortKey] - a[sortKey])

  const industries = Array.from(new Set(sites.map(s => s.industry)))
  const siteTypes = Array.from(new Set(sites.map(s => s.siteType)))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-200 overflow-y-auto scrollbar-thin ${sidebarOpen ? 'w-72' : 'w-0'}`}
      >
        <div className="p-4 min-w-72">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} isLimitReached={isLimitReached} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-gray-900/50 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >{sidebarOpen ? '◀' : '▶'}</button>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg leading-none">Design Scout JP</h1>
            <p className="text-gray-500 text-xs">日本の参考サイト収集ツール</p>
          </div>
          <QuotaMeter count={usage.count} />
          <div className="text-sm text-gray-400">
            <span>{filtered.length} / {sites.length}件</span>
          </div>
          {sites.length > 0 && (
            <>
              <button
                onClick={() => exportCSV(filtered)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
              >CSVエクスポート</button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-gray-800 hover:bg-red-900 text-gray-500 hover:text-red-300 text-xs rounded-lg transition-colors"
              >クリア</button>
            </>
          )}
        </header>

        {/* Filter + Sort bar */}
        <div className="flex-shrink-0 border-b border-gray-800 px-4 py-2 flex items-center gap-3 flex-wrap bg-gray-900/30">
          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
          >
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}順</option>)}
          </select>

          {/* Filters */}
          <button
            onClick={() => setFilterFavorite(v => !v)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${filterFavorite ? 'bg-yellow-700 text-yellow-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >⭐ お気に入りのみ</button>

          {industries.length > 0 && (
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="">全業種</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}

          {siteTypes.length > 0 && (
            <select
              value={filterSiteType}
              onChange={(e) => setFilterSiteType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="">全タイプ</option>
              {siteTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">最低スコア</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filterMinScore}
              onChange={(e) => setFilterMinScore(Number(e.target.value))}
              className="w-20 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-6">{filterMinScore}</span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-2/3" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(4)].map((_, j) => <div key={j} className="h-10 bg-gray-800 rounded" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filtered.map(site => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onFavorite={handleFavorite}
                  onNoteChange={handleNoteChange}
                  onDetail={setDetailSite}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && sites.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-300 mb-2">サイトを収集しよう</h2>
              <p className="text-gray-500 text-sm max-w-sm">左のフォームから業種・セクション構成などを入力して、日本の参考サイトを集めてください。</p>
            </div>
          )}

          {!isLoading && sites.length > 0 && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-500">フィルター条件に一致するサイトがありません</div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {detailSite && (
        <DetailModal site={detailSite} onClose={() => setDetailSite(null)} />
      )}
    </div>
  )
}
