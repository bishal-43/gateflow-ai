/**
 * VisitorChat.jsx — Secure RAG-powered AI chatbot for visitors.
 *
 * Security model:
 *   - Sends the visitor's invite token to the BACKEND (POST /chat/ask)
 *   - Backend validates token fully (expiry, revocation, space active)
 *   - Backend derives space_id server-side — frontend never controls it
 *   - Expired / revoked invite → backend returns 400/401 → chat blocked immediately
 *
 * Graceful degradation: AI unavailable → helpful fallback message shown.
 */

import { useState, useRef, useEffect } from 'react'
import { VisitorLayout } from '@/components/layout/VisitorLayout'
import { Button } from '@/components/ui/Button'
import { useVisitorSessionStore } from '@/store/visitorSessionStore'
import { useChatAsk } from '@/hooks/useRAG'
import { cn } from '@/lib/utils'
import { Zap, RefreshCw } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  { emoji: '🅿️', text: 'Where is parking?',  question: 'Where is the parking?' },
  { emoji: '🕐', text: 'What time?',          question: 'What time does the event start?' },
  { emoji: '🏢', text: 'Location info',       question: 'Where is the main venue?' },
  { emoji: '📡', text: 'WiFi info',           question: 'Is there WiFi available?' },
  { emoji: '🍽️', text: 'Food & drinks',      question: 'Where can I get food?' },
  { emoji: '🆘', text: 'Emergency',           question: 'What do I do if I need help?' },
]

/** Map backend error status codes to user-friendly messages */
function friendlyError(status, message) {
  if (status === 400) {
    if (message?.includes('expired'))  return { text: 'This invite has expired. Chat access is no longer available.', fatal: true }
    if (message?.includes('revoked'))  return { text: 'This invite has been revoked. Chat access is no longer available.', fatal: true }
    if (message?.includes('not yet'))  return { text: 'This invite is not active yet. Please wait until the valid time.', fatal: false }
    return { text: message ?? 'This invite is no longer valid.', fatal: true }
  }
  if (status === 401 || status === 403) return { text: 'Invalid invite. Chat access is not available.', fatal: true }
  if (status === 503) return { text: 'The AI assistant is currently unavailable. Please visit the help desk for assistance.', fatal: false }
  if (status === 404) return { text: 'No documents have been uploaded for this space yet. Please check with the organizer.', fatal: false }
  return { text: 'Sorry, I couldn\'t get an answer right now. Please try again.', fatal: false }
}

export default function VisitorChat() {
  const { space, inviteToken } = useVisitorSessionStore()
  const chatAsk = useChatAsk()

  // fatal = invite expired/revoked → disable input permanently
  const [fatalError, setFatalError] = useState(null)

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: `Hi! I'm the AI assistant for ${space?.name ?? 'this space'}. Ask me anything about the schedule, venue, directions, or facilities.`,
    },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text) => {
    const question = (text || input).trim()
    if (!question || fatalError) return

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: question }])
    setInput('')

    const typingId = Date.now() + 1
    setMessages((prev) => [...prev, { id: typingId, role: 'bot', isTyping: true }])

    if (!inviteToken) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId))
      setMessages((prev) => [...prev, {
        id: Date.now() + 2, role: 'bot',
        content: 'No invite session found. Please open your invite link again.',
        isError: true,
      }])
      return
    }

    chatAsk.mutate(
      { token: inviteToken, question },
      {
        onSuccess: (data) => {
          setMessages((prev) => prev.filter((m) => m.id !== typingId))
          setMessages((prev) => [...prev, {
            id: Date.now() + 2, role: 'bot',
            content: data.answer,
            cacheHit: data.cache_hit,
          }])
          inputRef.current?.focus()
        },
        onError: (err) => {
          setMessages((prev) => prev.filter((m) => m.id !== typingId))
          const { text, fatal } = friendlyError(err?.status, err?.message)
          setMessages((prev) => [...prev, {
            id: Date.now() + 2, role: 'bot',
            content: text,
            isError: true,
          }])
          if (fatal) setFatalError(text)
        },
      },
    )
  }

  const handleClear = () => {
    if (fatalError) return
    setMessages([{
      id: Date.now(), role: 'bot',
      content: `Hi! I'm the AI assistant for ${space?.name ?? 'this space'}. Ask me anything about the schedule, venue, directions, or facilities.`,
    }])
  }

  const isBlocked = !!fatalError
  const isPending = chatAsk.isPending

  return (
    <VisitorLayout title="Ask AI">
      <div className="flex flex-col flex-1 min-h-0 -mx-4 sm:-mx-6 -my-6">

        {/* Header */}
        <div className="shrink-0 bg-blue-700 text-white px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto gap-3">
            <div className="min-w-0">
              <p className="text-3xl mb-1" aria-hidden>🤖</p>
              <h1 className="font-bold text-2xl tracking-tight">Ask questions</h1>
              <div className="flex items-center gap-2 mt-2">
                {isBlocked ? (
                  <>
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
                    <p className="text-base text-blue-100">Access ended</p>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" aria-hidden />
                    <p className="text-base text-blue-100">{space?.name ?? 'Ready'}</p>
                  </>
                )}
              </div>
            </div>
            {!isBlocked && (
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 min-h-[48px] min-w-[48px] rounded-xl bg-blue-800 hover:bg-blue-900 flex items-center justify-center"
                aria-label="Clear chat"
              >
                <RefreshCw className="h-7 w-7" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Fatal error banner */}
        {isBlocked && (
          <div className="shrink-0 bg-red-50 dark:bg-red-900/20 border-b-2 border-red-300 dark:border-red-700 px-4 py-4 text-center">
            <p className="text-base font-bold text-red-800 dark:text-red-200">🚫 {fatalError}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-2xl mx-auto',
                msg.role === 'user' ? 'flex-row-reverse justify-end' : 'flex-row justify-start',
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-lg',
                  msg.role === 'bot' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white',
                )}
                aria-hidden="true"
              >
                {msg.role === 'bot' ? '🤖' : '👤'}
              </div>

              <div
                className={cn(
                  'max-w-sm rounded-2xl px-5 py-3 text-base font-medium',
                  msg.role === 'bot'
                    ? msg.isError
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-2 border-red-300 dark:border-red-700'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-blue-200 dark:border-gray-700'
                    : 'bg-blue-600 dark:bg-blue-700 text-white',
                )}
              >
                {msg.isTyping ? (
                  <span className="text-gray-500 dark:text-gray-400" aria-live="polite">Thinking…</span>
                ) : (
                  <>
                    {msg.content}
                    {msg.cacheHit && (
                      <span className="ml-2 inline-block" title="Answered from cache">⚡</span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
          <div className="max-w-2xl mx-auto space-y-4">

            {isBlocked ? (
              <p className="text-center text-base font-semibold text-red-600 dark:text-red-400 py-4">
                Chat access is no longer available for this invite.
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="sr-only">Your question</span>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                    }}
                    rows={2}
                    placeholder="Type a question…"
                    disabled={isPending}
                    className="w-full min-h-[52px] rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-lg text-gray-900 dark:text-white placeholder:text-gray-500 disabled:opacity-50"
                  />
                </label>

                <Button
                  type="button"
                  size="lg"
                  className="w-full min-h-[52px] text-lg font-semibold"
                  disabled={isPending || !input.trim()}
                  onClick={() => sendMessage()}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Thinking…
                    </span>
                  ) : 'Send question'}
                </Button>

                {messages.length <= 2 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Quick questions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          type="button"
                          key={q.question}
                          onClick={() => sendMessage(q.question)}
                          disabled={isPending}
                          className="min-h-[72px] rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 p-3 text-center"
                        >
                          <div className="text-2xl mb-1" aria-hidden>{q.emoji}</div>
                          <p className="font-semibold text-base text-gray-900 dark:text-white leading-tight">{q.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Answers from event documents only</span>
            </p>
          </div>
        </div>

      </div>
    </VisitorLayout>
  )
}
