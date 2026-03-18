'use client';

import { useState, useEffect, useRef } from 'react';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

type Thread = {
  id:        string;
  title:     string;
  message:   string;
  status:    string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id:         string;
  text:       string;
  userType:   string;
  authorName: string;
  createdAt:  string;
};

// ─── ステータス表示 ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  open:     { label: '未回答',   bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  answered: { label: '回答済み', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  closed:   { label: 'クローズ', bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS['open'];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────

export default function ConsultWidget({
  storeId,
}: {
  storeId:   string;
  storeName?: string; // 後方互換のため残す（未使用）
}) {
  type View = 'list' | 'chat' | 'new';

  const [view,        setView]        = useState<View>('list');
  const [threads,     setThreads]     = useState<Thread[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [msgLoading,  setMsgLoading]  = useState(false);
  const [newMsg,      setNewMsg]      = useState('');
  const [newTitle,    setNewTitle]    = useState('');
  const [sending,     setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ─── スレッド一覧読み込み ─────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stores/${storeId}/consultations`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setThreads(Array.isArray(data) ? data : []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  // ─── メッセージ読み込み ───────────────────────────────────────────────────

  useEffect(() => {
    if (!activeThread) return;
    setMsgLoading(true);
    fetch(`/api/consultations/${activeThread.id}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Message[]) => {
        // メッセージがなければ元の message フィールドを初回メッセージとして表示
        if (!Array.isArray(data) || data.length === 0) {
          setMessages([{
            id: `${activeThread.id}-legacy`,
            text: activeThread.message,
            userType: 'owner',
            authorName: '',
            createdAt: activeThread.createdAt,
          }]);
        } else {
          setMessages(data);
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [activeThread]);

  // ─── 自動スクロール ───────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── メッセージ送信 ───────────────────────────────────────────────────────

  async function sendMessage() {
    const text = newMsg.trim();
    if (!text || sending || !activeThread) return;
    setSending(true);
    setNewMsg('');
    try {
      const res = await fetch(`/api/consultations/${activeThread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userType: 'owner', authorName: 'オーナー' }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => [...prev, msg]);
        // スレッド一覧の updatedAt を更新
        setThreads((prev) => prev.map((t) =>
          t.id === activeThread.id ? { ...t, updatedAt: msg.createdAt, status: 'open' } : t
        ));
      }
    } finally {
      setSending(false);
    }
  }

  // ─── 新スレッド作成 ───────────────────────────────────────────────────────

  async function createThread() {
    const text  = newMsg.trim();
    const title = newTitle.trim() || '担当者への相談';
    if (!text || sending) return;
    setSending(true);
    setNewMsg('');
    setNewTitle('');
    try {
      const res = await fetch(`/api/stores/${storeId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message: text, createdBy: 'owner', authorName: 'オーナー' }),
      });
      if (res.ok) {
        const thread: Thread = await res.json();
        setThreads((prev) => [thread, ...prev]);
        setActiveThread(thread);
        setMessages([{
          id: `${thread.id}-first`,
          text,
          userType: 'owner',
          authorName: 'オーナー',
          createdAt: thread.createdAt,
        }]);
        setView('chat');
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      view === 'new' ? createThread() : sendMessage();
    }
  }

  // ─── 共通スタイル ─────────────────────────────────────────────────────────

  const sectionStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '16px',
    marginBottom: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif',
  };

  // ─── スレッド一覧 ─────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <section id="consult" style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 0.5 }}>
            💬 担当者への相談
          </p>
          <button
            onClick={() => setView('new')}
            style={{
              padding: '6px 14px',
              background: '#2563eb',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ＋ 新しい相談
          </button>
        </div>

        {loading ? (
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>読み込み中...</p>
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              まずは気軽に相談してみましょう
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
              写真の撮り方・ファイルの送り方・スケジュールなど<br />
              なんでも聞いていただいて大丈夫です
            </p>
            <button
              onClick={() => setView('new')}
              style={{
                padding: '11px 24px',
                background: '#2563eb',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ＋ 担当者に相談する
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => { setActiveThread(thread); setView('chat'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: STATUS[thread.status]?.bg ?? '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  💬
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, marginRight: 8,
                    }}>
                      {thread.title}
                    </p>
                    <StatusBadge status={thread.status} />
                  </div>
                  <p style={{
                    fontSize: 11, color: '#6b7280',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {thread.message}
                  </p>
                  <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                    {new Date(thread.updatedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <span style={{ fontSize: 14, color: '#9ca3af', flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ─── 新規スレッド作成 ─────────────────────────────────────────────────────

  if (view === 'new') {
    return (
      <section id="consult" style={sectionStyle}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '5px 10px', background: '#f3f4f6', border: 'none',
              borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer',
            }}
          >
            ← 戻る
          </button>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>新しい相談を始める</p>
        </div>

        {/* タイトル（任意）*/}
        <input
          type="text"
          placeholder="相談のタイトル（省略可）"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 10,
            outline: 'none',
            background: '#f8fafc',
          }}
        />

        {/* メッセージ本文 */}
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="相談内容を入力してください&#10;&#10;例：店舗外観写真はどのように撮ればいいですか？"
          rows={5}
          autoFocus
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            background: 'white',
            lineHeight: 1.65,
            fontFamily: 'inherit',
            marginBottom: 10,
          }}
        />

        <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 12 }}>
          Cmd+Enter または ⌃Enter で送信
        </p>

        <button
          onClick={createThread}
          disabled={!newMsg.trim() || sending}
          style={{
            width: '100%',
            padding: '12px',
            background: !newMsg.trim() || sending ? '#93c5fd' : '#2563eb',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: !newMsg.trim() || sending ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? '送信中...' : '送信する →'}
        </button>
      </section>
    );
  }

  // ─── チャット画面 ─────────────────────────────────────────────────────────

  return (
    <section id="consult" style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      {/* チャットヘッダー */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        borderBottom: '1px solid #e5e7eb',
        background: '#f8fafc',
      }}>
        <button
          onClick={() => { setView('list'); setActiveThread(null); setMessages([]); }}
          style={{
            padding: '5px 10px', background: 'white', border: '1px solid #e5e7eb',
            borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#111827',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeThread?.title}
          </p>
        </div>
        {activeThread && <StatusBadge status={activeThread.status} />}
      </div>

      {/* メッセージ一覧 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxHeight: 360,
        minHeight: 160,
        background: '#f8fafc',
      }}>
        {msgLoading ? (
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>読み込み中...</p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>メッセージがありません</p>
        ) : (
          messages.map((msg) => {
            const isOwner = msg.userType === 'owner';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isOwner ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {/* アバター */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isOwner ? '#dbeafe' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {isOwner ? '👤' : '🏢'}
                </div>

                {/* バブル */}
                <div style={{
                  maxWidth: '76%',
                  padding: '10px 13px',
                  borderRadius: isOwner ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: isOwner ? '#2563eb' : 'white',
                  color: isOwner ? 'white' : '#1e293b',
                  fontSize: 13,
                  lineHeight: 1.65,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {!isOwner && (
                    <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
                      担当者{msg.authorName ? ` (${msg.authorName})` : ''}
                    </p>
                  )}
                  <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                  <p style={{
                    fontSize: 10, marginTop: 5,
                    color: isOwner ? 'rgba(255,255,255,0.65)' : '#9ca3af',
                    textAlign: 'right',
                  }}>
                    {new Date(msg.createdAt).toLocaleString('ja-JP', {
                      month: 'numeric', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid #e5e7eb',
        background: 'white',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Cmd+Enter で送信)"
          rows={2}
          style={{
            flex: 1,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.55,
            background: '#f8fafc',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!newMsg.trim() || sending}
          style={{
            padding: '9px 16px',
            background: !newMsg.trim() || sending ? '#93c5fd' : '#2563eb',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            cursor: !newMsg.trim() || sending ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {sending ? '...' : '送信'}
        </button>
      </div>
    </section>
  );
}
