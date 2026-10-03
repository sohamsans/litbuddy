import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  BookOpen,
  Search,
  CheckCircle2,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { ReviewPaper, RawPaperMetadata, AssistantChatMessage } from '../types';
import { LatexRenderer } from './LatexRenderer';
import { sendPaperQA } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PaperChatAreaProps {
  topic: string;
  synthesizedPapers: ReviewPaper[];
  candidatePool: RawPaperMetadata[];
  onOpenSources: () => void;
  onSelectCitation: (index: number) => void;
  onSearchQuery: (query: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citedPaperIds?: string[];
  suggestedFollowups?: string[];
  suggestedSearches?: string[];
  timestamp: string;
}

export const PaperChatArea: React.FC<PaperChatAreaProps> = ({
  topic,
  synthesizedPapers,
  candidatePool,
  onOpenSources,
  onSelectCitation,
  onSearchQuery
}) => {
  // Clean up topic to prevent repetitive concatenations
  const cleanTopic = useMemo(() => {
    return topic
      .split('?')[0]
      .replace(/(state of the art benchmarks|comparative analysis|comparative benchmarks)/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || topic;
  }, [topic]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      role: 'assistant',
      content: `I've analyzed and synthesized the literature collection for **${cleanTopic}**.\n\nYou can ask deep questions about methodologies, compare empirical findings, check limitations, or inspect mathematical models. Formulas will be compiled using KaTeX (e.g. $E = mc^2$, $\\mathcal{L}_{\\text{loss}}$).`,
      suggestedFollowups: [
        'Explain the core methodology and findings of paper #1.',
        'Compare the empirical benchmarks across the synthesized papers.',
        'What are the primary theoretical limitations and research gaps?'
      ],
      suggestedSearches: [
        `${cleanTopic.slice(0, 40)} benchmarks`,
        `${cleanTopic.slice(0, 40)} state of the art`
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeProvider, activeModel, runtimeKeys } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build compressed history
      const historyPayload: AssistantChatMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const papersToGround = synthesizedPapers.length > 0 ? synthesizedPapers : candidatePool;

      const res = await sendPaperQA({
        query,
        papers: papersToGround,
        chat_history: historyPayload,
        model_provider: activeProvider,
        model_name: activeModel,
        groq_api_key: runtimeKeys.groq,
        gemini_api_key: runtimeKeys.gemini,
        openrouter_api_key: runtimeKeys.openrouter,
        deepseek_api_key: runtimeKeys.deepseek,
        nvidia_api_key: runtimeKeys.nvidia,
        custom_api_key: runtimeKeys.custom,
        custom_base_url: runtimeKeys.custom_base_url
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        citedPaperIds: res.cited_paper_ids,
        suggestedFollowups: res.suggested_followups,
        suggestedSearches: res.suggested_searches,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error querying the model: ${err.message || 'Please verify your API key in BYOK settings.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. I am ready for new questions regarding **${topic}**.\n\nAll ${synthesizedPapers.length} grounded papers, figures, and citations remain fully cached and accessible.`,
        suggestedFollowups: [
          'What are the primary theoretical limitations identified across these papers?',
          'Compare the empirical benchmarks and methodologies used [1, 2].',
          'Summarize the key mathematical formulations or loss functions.'
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const dedupedMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((m) => {
      const key = `${m.role}-${m.content.trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);

  const handleCitationClicked = (citationNumStr: string) => {
    const num = parseInt(citationNumStr, 10);
    if (!isNaN(num)) {
      onSelectCitation(num);
      onOpenSources();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Top Banner / Topic Bar */}
      <div className="px-6 py-2.5 bg-[#171718]/80 backdrop-blur-md border-b border-[#3c4043]/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#81c995]" />
          <span className="text-xs font-medium text-[#c4c7c5] truncate">
            Research Context: <strong className="text-[#e3e3e3]">{topic}</strong>
          </span>
          <span className="text-[11px] text-[#9aa0a6] hidden sm:inline">
            ({synthesizedPapers.length} synthesized papers grounded)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043] text-xs font-medium text-[#9aa0a6] hover:text-[#f28b82] transition-colors"
            title="Clear chat messages (cached papers, figures, and reference vault remain preserved)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>

          <button
            type="button"
            onClick={onOpenSources}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043] text-xs font-medium text-[#8ab4f8] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View Sources</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {dedupedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#282a2c] border border-[#3c4043] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                    fill="url(#chat-rainbow)"
                  />
                  <defs>
                    <linearGradient id="chat-rainbow" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4285F4" />
                      <stop offset="0.33" stopColor="#9B72CB" />
                      <stop offset="0.66" stopColor="#D96570" />
                      <stop offset="1" stopColor="#F4B400" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}

            <div
              className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm transition-all ${
                msg.role === 'user'
                  ? 'bg-[#282a2c] text-[#e3e3e3] border border-[#3c4043] max-w-[85%] sm:max-w-[75%]'
                  : 'bg-transparent text-[#e3e3e3] max-w-full flex-1'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div>
                  <LatexRenderer
                    content={msg.content}
                    onCitationClick={handleCitationClicked}
                    className="text-[#e3e3e3] text-sm font-sans"
                  />

                  {/* Followup Suggestions */}
                  {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#3c4043]/40">
                      <p className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#8ab4f8]" />
                        Suggested Inquiries
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedFollowups.map((f, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(f)}
                            className="text-left text-xs px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] text-[#c4c7c5] hover:text-[#e3e3e3] transition-colors"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Searches to Expand Pool */}
                  {msg.suggestedSearches && msg.suggestedSearches.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-[#9aa0a6] flex items-center gap-1">
                        <Search className="w-3 h-3 text-[#8ab4f8]" /> Search deeper:
                      </span>
                      {msg.suggestedSearches.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSearchQuery(s)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#8ab4f8]/10 text-[#8ab4f8] hover:bg-[#8ab4f8]/20 transition-colors"
                        >
                          <span>"{s}"</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-4xl mx-auto items-center">
            <div className="w-8 h-8 rounded-full bg-[#282a2c] border border-[#3c4043] flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-[#8ab4f8]" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#282a2c]/60 border border-[#3c4043]/40 text-xs text-[#9aa0a6]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8ab4f8] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#9b72cb] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#d96570] animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 font-mono text-[11px]">Synthesizing grounded answer with KaTeX math...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Capsule Input Bar at Bottom */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto relative rounded-3xl bg-[#1e1f20] border border-[#3c4043] shadow-2xl focus-within:border-[#8ab4f8] transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask questions about the papers, request math proofs, or compare findings..."
            rows={1}
            className="w-full pl-5 pr-14 py-3.5 bg-transparent text-sm text-[#e3e3e3] placeholder-[#9aa0a6] focus:outline-none resize-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#8ab4f8] text-[#131314] flex items-center justify-center hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-[#5f6368] mt-2">
          LitBuddy grounds all answers in the curated paper pool. Mathematical formulas render dynamically with KaTeX.
        </p>
      </div>
    </div>
  );
};
