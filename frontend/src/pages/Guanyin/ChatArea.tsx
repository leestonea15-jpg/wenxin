import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message } from '../../agents/AgentState'

interface ChatAreaProps {
  conversation: Message[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  onClose?: () => void
}

// 打字机效果组件 - 修复版本
const TypewriterText = ({ text, speed = 10 }: { text: string, speed?: number }) => {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    // 重置状态
    setDisplayText('')
    setIsComplete(false)
    indexRef.current = 0

    // 如果文本为空，直接完成
    if (!text || text.length === 0) {
      setIsComplete(true)
      return
    }

    // 先确保文本正确处理转义字符
    const processedText = text
      .replace(/\\"/g, '"')  // 处理转义引号
      .replace(/\\n/g, '\n') // 处理转义换行
      .replace(/\\t/g, '\t') // 处理转义制表符

    const type = () => {
      if (indexRef.current < processedText.length) {
        // 按字符数增加，避免切在转义序列中间
        setDisplayText(processedText.slice(0, indexRef.current + 1))
        indexRef.current++
        setTimeout(type, speed)
      } else {
        setDisplayText(processedText)
        setIsComplete(true)
      }
    }

    // 稍微延迟一下开始
    const timer = setTimeout(type, 100)
    return () => clearTimeout(timer)
  }, [text, speed])

  // 处理 markdown-like 格式 - 更安全的方式
  const formattedText = useMemo(() => {
    if (!displayText) return ''

    // 先进行必要的HTML转义，防止XSS
    let result = displayText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // 然后处理我们支持的格式
    result = result
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')

    return result
  }, [displayText])

  return (
    <div>
      <p
        className="whitespace-pre-line leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
      {!isComplete && (
        <span className="inline-block w-2 h-5 bg-purple-400 animate-pulse ml-1 align-middle" />
      )}
    </div>
  )
}

// 快捷问题建议
const SUGGESTED_QUESTIONS = [
  "这个签对事业运势怎么样？",
  "感情方面有什么提示？",
  "近期需要注意什么？",
  "这个签的贵人运如何？",
]


// 简单文本显示组件 - 作为备选方案
const SimpleText = ({ text }: { text: string }) => {
  // 处理文本格式
  const formattedText = useMemo(() => {
    if (!text) return ''

    // 先处理转义字符
    let result = text
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')

    // HTML转义
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // 处理支持的格式
    result = result
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')

    return result
  }, [text])

  return (
    <p
      className="whitespace-pre-line leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  )
}

export const ChatArea = ({ conversation, isLoading, onSendMessage, onClose }: ChatAreaProps) => {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [useTypewriter, setUseTypewriter] = useState(true) // 可以切换打字机效果
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 添加调试日志
  useEffect(() => {
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1]
      console.log('[ChatArea] 最新消息:', {
        role: lastMessage.role,
        contentLength: lastMessage.content?.length,
        contentPreview: lastMessage.content?.slice(0, 100),
        fullContent: lastMessage.content
      })
    }
  }, [conversation])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/90 border-l border-gray-700">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-white font-semibold">AI 解读</h3>
            <p className="text-gray-400 text-sm">可以继续提问，深入了解</p>
          </div>
          {/* 调试按钮 - 可以切换打字机效果 */}
          <button
            onClick={() => setUseTypewriter(!useTypewriter)}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            {useTypewriter ? '⚡ 打字机' : '📝 普通'}
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>等待AI解读...</p>
          </div>
        ) : (
          conversation.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-tr-sm'
                    : 'bg-gray-700 text-gray-100 rounded-tl-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  useTypewriter ? (
                    <TypewriterText text={message.content} />
                  ) : (
                    <SimpleText text={message.content} />
                  )
                ) : (
                  <SimpleText text={message.content} />
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* 加载状态 */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                {/* AI正在解签动画 */}
                <div className="flex items-center gap-3">
                  {/* 旋转的八卦图 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 flex items-center justify-center text-yellow-500"
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeWidth="1" />
                      <path d="M12 2v20M2 12h20" strokeWidth="1" />
                      <path d="M12 6a3 3 0 1 1 0 6" strokeWidth="1" />
                      <path d="M12 12a3 3 0 1 1 0 6" strokeWidth="1" />
                    </svg>
                  </motion.div>

                  <div className="flex flex-col">
                    <p className="text-white font-medium">AI正在解签</p>
                    <div className="flex gap-2 mt-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题建议 */}
      <AnimatePresence>
        {showSuggestions && conversation.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-t border-gray-700 bg-gray-800/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">试试问这些：</span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                隐藏
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSendMessage(q)
                  }}
                  className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-sm rounded-lg transition-colors border border-gray-600/30"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入框 */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题..."
            disabled={isLoading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-medium transition-opacity"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  )
}
