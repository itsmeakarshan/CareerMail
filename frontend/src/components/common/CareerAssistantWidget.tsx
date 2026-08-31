import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Send,
  Bot,
  User as UserIcon,
  Clock,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  Mail,
  Search,
  BarChart3,
  ExternalLink,
  HelpCircle,
  X,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { assistantApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AssistantCard, AssistantEmailDraft, AssistantResponse, AssistantRequest } from '../../types';
import { ComposeEmailModal } from '../email/ComposeEmailModal';
import { CompanyLogo } from './CompanyLogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cards?: AssistantCard[];
  emailDraft?: AssistantEmailDraft;
  suggestions?: string[];
}

export const CareerAssistantWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedDraftIndex, setCopiedDraftIndex] = useState<string | null>(null);

  // Email draft compose modal
  const [activeDraftToCompose, setActiveDraftToCompose] = useState<AssistantEmailDraft | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  // Active Context Label based on Route
  const getContextLabel = () => {
    const path = location.pathname;
    if (path.includes('/tracker')) return 'Job Tracker & Pipeline';
    if (path.includes('/inbox')) return 'Gmail Inbox & Email Intelligence';
    if (path.includes('/settings')) return 'Settings & Account Integrations';
    if (path.includes('/profile')) return 'Profile & Career Preferences';
    return 'Active Career Workspace';
  };

  const quickActionChips = [
    { label: '✨ What Next?', action: 'WHAT_NEXT', prompt: 'What should I do next?' },
    { label: '📊 Analyze Progress', action: 'ANALYZE_PROGRESS', prompt: 'Analyze my job search progress' },
    { label: '⏰ Needs Attention', action: 'NEEDS_ATTENTION', prompt: 'Which applications need attention?' },
    { label: '✉️ Draft Follow-Up', action: 'DRAFT_REPLY', prompt: 'Draft a polite follow-up email' },
    { label: '👤 Find Recruiters', action: 'FIND_RECRUITERS', prompt: 'Show my identified recruiters' },
    { label: '🔍 Search Apps', prompt: 'Search my applications' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (customPrompt?: string, actionCode?: string) => {
    const messageText = customPrompt || query;
    if (!messageText.trim() || loading) return;

    const userMsgId = 'user-' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const requestPayload: AssistantRequest = {
        query: messageText,
        currentScreen: location.pathname,
        action: actionCode,
      };

      const res: AssistantResponse = await assistantApi.ask(requestPayload);

      const assistantMsg: ChatMessage = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cards: res.cards,
        emailDraft: res.emailDraft,
        suggestions: res.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: `⚠️ I encountered an error retrieving data from your PostgreSQL database: ${err.message || 'Please verify connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDraft = (text: string, draftId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftIndex(draftId);
    setTimeout(() => setCopiedDraftIndex(null), 2500);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const handleCardClick = (card: AssistantCard) => {
    if (card.actionUrl) {
      navigate(card.actionUrl);
    }
  };

  // Helper to parse inline markdown (bold, italic, code, links)
  const formatInlineText = (text: string) => {
    // Regex splits by:
    // 1. `code`
    // 2. ***bold italic***
    // 3. **bold** or __bold__
    // 4. *italic* or _italic_ (including quotes like *"text"*)
    // 5. [text](url)
    const tokens = text.split(/(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g);

    return tokens.map((token, i) => {
      if (!token) return null;

      // Inline code `...`
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-pink-700 dark:text-pink-300 font-mono text-[11px] font-semibold border border-slate-300/60 dark:border-slate-700"
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      // Bold + Italic ***...***
      if (token.startsWith('***') && token.endsWith('***') && token.length >= 6) {
        return (
          <strong key={i} className="font-extrabold italic text-slate-900 dark:text-white">
            {token.slice(3, -3)}
          </strong>
        );
      }

      // Bold **...** or __...__
      if (
        (token.startsWith('**') && token.endsWith('**') && token.length >= 4) ||
        (token.startsWith('__') && token.endsWith('__') && token.length >= 4)
      ) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      }

      // Italic *...* or _..._
      if (
        (token.startsWith('*') && token.endsWith('*') && token.length >= 2) ||
        (token.startsWith('_') && token.endsWith('_') && token.length >= 2)
      ) {
        return (
          <em key={i} className="italic text-slate-700 dark:text-slate-200 font-medium">
            {token.slice(1, -1)}
          </em>
        );
      }

      // Markdown Link [text](url)
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 dark:text-pink-400 font-semibold underline hover:text-pink-700 dark:hover:text-pink-300"
          >
            {linkMatch[1]}
          </a>
        );
      }

      return <span key={i}>{token}</span>;
    });
  };

  // Render markdown text cleanly and structure all AI chatbot responses
  const renderFormattedText = (content: string) => {
    const rawLines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockBuffer: string[] = [];

    for (let idx = 0; idx < rawLines.length; idx++) {
      const line = rawLines[idx];
      const trimmed = line.trim();

      // Handle Code Fences ```
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          const codeContent = codeBlockBuffer.join('\n');
          elements.push(
            <div
              key={`code-${idx}`}
              className="my-2 p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto border border-slate-800 shadow-inner"
            >
              <pre className="whitespace-pre">{codeContent}</pre>
            </div>
          );
          codeBlockBuffer = [];
          inCodeBlock = false;
        } else {
          // Open code block
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockBuffer.push(line);
        continue;
      }

      // Empty spacing line
      if (!trimmed) {
        elements.push(<div key={`gap-${idx}`} className="h-1.5" />);
        continue;
      }

      // 1. Callout / Action banner (e.g. 💡 Action:, 🔒 Safety Note:, ⚠️ Note:)
      if (
        trimmed.startsWith('💡') ||
        trimmed.startsWith('🔒') ||
        trimmed.startsWith('⚠️') ||
        trimmed.toLowerCase().includes('action:') ||
        trimmed.toLowerCase().includes('safety note:')
      ) {
        elements.push(
          <div
            key={`callout-${idx}`}
            className="my-2 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2 shadow-2xs"
          >
            <div className="flex-1">{formatInlineText(trimmed)}</div>
          </div>
        );
        continue;
      }

      // 2. Major Section Headers (e.g. "👤 **Identified Recruiter Contacts...**" or "# Header")
      if (
        trimmed.startsWith('#') ||
        (trimmed.endsWith(':**') &&
          (trimmed.startsWith('👤') ||
            trimmed.startsWith('📅') ||
            trimmed.startsWith('🎯') ||
            trimmed.startsWith('📊') ||
            trimmed.startsWith('✉️') ||
            trimmed.startsWith('✨')))
      ) {
        const headerText = trimmed.replace(/^#+\s*/, '');
        elements.push(
          <div
            key={`hdr-${idx}`}
            className="pt-2 pb-1 border-b border-pink-100 dark:border-slate-800/80 text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5"
          >
            {formatInlineText(headerText)}
          </div>
        );
        continue;
      }

      // 3. Sub-items / Indented Details (e.g. "  - Email: ... | Role: ..." or "   • Date: ...")
      // Check if line has 2+ leading spaces or tabs followed by bullet/dash
      const isIndented = /^(\s{2,}|\t+)[•\-\*\+]?\s*/.test(line);
      if (isIndented) {
        // Strip the indentation AND bullet marker
        const cleanSubText = line.replace(/^(\s{2,}|\t+)[•\-\*\+]?\s*/, '');
        elements.push(
          <div key={`sub-${idx}`} className="flex items-start gap-2 pl-5 py-0.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-pink-400 dark:text-pink-500 font-bold text-[10px] mt-0.5 select-none">↳</span>
            <span className="flex-1 leading-snug">{formatInlineText(cleanSubText)}</span>
          </div>
        );
        continue;
      }

      // 4. Top-level Bullet Points (e.g. "• Item", "- Item", "* Item")
      if (/^[•\-\*\+]\s+/.test(trimmed)) {
        // Strip the bullet marker
        const cleanBulletText = trimmed.replace(/^[•\-\*\+]\s+/, '');
        elements.push(
          <div key={`bullet-${idx}`} className="flex items-start gap-2 pl-1 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />
            <span className="flex-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {formatInlineText(cleanBulletText)}
            </span>
          </div>
        );
        continue;
      }

      // 5. Numbered Lists (e.g. "1. Item", "2. Item")
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        const num = numMatch[1];
        const textAfter = numMatch[2];
        elements.push(
          <div key={`num-${idx}`} className="flex items-start gap-2 pl-1 py-0.5">
            <span className="w-4 h-4 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5 border border-pink-200 dark:border-pink-800">
              {num}
            </span>
            <span className="flex-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {formatInlineText(textAfter)}
            </span>
          </div>
        );
        continue;
      }

      // 6. Standard Paragraph
      elements.push(
        <p key={`p-${idx}`} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      );
    }

    return <div className="space-y-1">{elements}</div>;
  };

  // Render priority badge color
  const getBadgeClass = (priority?: string, badgeColor?: string) => {
    if (badgeColor === 'red' || priority === 'URGENT') {
      return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
    if (badgeColor === 'orange' || priority === 'ATTENTION') {
      return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
    if (badgeColor === 'blue' || priority === 'UPCOMING') {
      return 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    }
    if (badgeColor === 'green' || priority === 'POSITIVE') {
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
    return 'bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-800';
  };

  // Floating Trigger Button when Closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40 animate-bounce-short">
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          className="relative px-4 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl shadow-xl shadow-pink-500/25 flex items-center gap-2.5 transition-all hover:scale-105 group border border-pink-400/40"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-black animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold tracking-tight">AI Career Assistant</span>
            <span className="text-[10px] text-pink-100 font-medium leading-none">Real Data Grounded</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed bottom-5 right-5 z-40 bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
          isMaximized
            ? 'w-[95vw] sm:w-[680px] md:w-[760px] h-[85vh] max-h-[820px]'
            : 'w-[95vw] sm:w-[440px] md:w-[480px] h-[580px] max-h-[90vh]'
        }`}
      >
        {/* Assistant Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-[#1e1f20] dark:via-[#1a1b22] dark:to-[#1e1f20] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-500/20 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate">
                  AI Career Assistant
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-[9px] font-extrabold border border-pink-200 dark:border-pink-800">
                  REAL DATA
                </span>
              </div>
              <span className="text-[10px] text-[#5f6368] dark:text-slate-400 truncate">
                📍 {getContextLabel()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                title="Clear Chat History"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setIsMaximized(!isMaximized);
              }}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors hidden sm:block"
              title={isMaximized ? 'Restore Size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg text-[#5f6368] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips Strip */}
            <div className="px-3 py-2 bg-[#f6f8fc] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] overflow-x-auto custom-scrollbar flex items-center gap-1.5 flex-nowrap">
              {quickActionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.prompt, chip.action)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e1f20] hover:bg-pink-50 dark:hover:bg-[#282a2d] text-[11px] font-semibold text-[#444746] dark:text-slate-200 hover:text-pink-700 dark:hover:text-pink-300 border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 dark:hover:border-pink-800 transition-all flex-shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-white dark:bg-[#16181f] custom-scrollbar">
              {messages.length === 0 ? (
                <div className="py-4 space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-pink-950/40 dark:to-rose-950/30 border border-pink-200 dark:border-pink-800/40 space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      <h4 className="text-xs font-bold text-pink-950 dark:text-pink-200">
                        Welcome, {firstName}!
                      </h4>
                    </div>
                    <p className="text-[11px] text-pink-900/80 dark:text-pink-300/80 leading-relaxed">
                      I have full real-time access to your PostgreSQL applications, Gmail emails, recruiter intelligence, and upcoming interviews. How can I assist your job search today?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider px-1">
                      Suggested Actions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSend('What should I do next?', 'WHAT_NEXT')}
                        className="p-2.5 text-left rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-pink-50 dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                          <Flame className="w-3.5 h-3.5 text-rose-500" />
                          <span>What Should I Do Next?</span>
                        </div>
                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400 mt-1">
                          Priority list of urgent interviews & overdue follow-ups.
                        </p>
                      </button>

                      <button
                        onClick={() => handleSend('Analyze my job search progress', 'ANALYZE_PROGRESS')}
                        className="p-2.5 text-left rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-pink-50 dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                          <BarChart3 className="w-3.5 h-3.5 text-pink-500" />
                          <span>Analyze My Progress</span>
                        </div>
                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400 mt-1">
                          Real response rates, interview conversions & domain stats.
                        </p>
                      </button>

                      <button
                        onClick={() => handleSend('Show my identified recruiters', 'FIND_RECRUITERS')}
                        className="p-2.5 text-left rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-pink-50 dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                          <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span>Recruiter Contacts</span>
                        </div>
                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400 mt-1">
                          Browse verified recruiters extracted from your emails.
                        </p>
                      </button>

                      <button
                        onClick={() => handleSend('Draft a polite follow-up email', 'DRAFT_REPLY')}
                        className="p-2.5 text-left rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-pink-50 dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                          <Mail className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Draft Follow-Up Email</span>
                        </div>
                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400 mt-1">
                          Generate ready-to-send messages via Gmail.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col gap-1.5 ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    } animate-fadeIn`}
                  >
                    <div className="flex items-end gap-2 max-w-[92%]">
                      {m.sender === 'assistant' && (
                        <div className="w-7 h-7 rounded-xl bg-pink-100 dark:bg-pink-950 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 flex items-center justify-center flex-shrink-0 mb-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-br-none shadow-sm'
                            : 'bg-[#f6f8fc] dark:bg-[#1e1f20] text-[#1f1f1f] dark:text-slate-200 border border-[#e0e2e7] dark:border-[#282a2d] rounded-bl-none shadow-2xs'
                        }`}
                      >
                        {m.sender === 'user' ? (
                          <span className="whitespace-pre-wrap">{m.text}</span>
                        ) : (
                          renderFormattedText(m.text)
                        )}
                      </div>

                      {m.sender === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-pink-100 dark:bg-pink-950 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 flex items-center justify-center flex-shrink-0 mb-1">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Interactive Cards Attached to Response */}
                    {m.cards && m.cards.length > 0 && (
                      <div className="w-full pl-9 pr-2 space-y-2 mt-1">
                        <div className="grid grid-cols-1 gap-2">
                          {m.cards.map((card, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => handleCardClick(card)}
                              className="p-3 rounded-xl bg-white dark:bg-[#111318] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 dark:hover:border-pink-800 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {card.company ? (
                                  <CompanyLogo
                                    company={card.company}
                                    className="w-8 h-8 text-xs flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                    <Briefcase className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400">
                                      {card.title}
                                    </span>
                                  </div>
                                  {card.subtitle && (
                                    <span className="text-[10px] text-[#5f6368] dark:text-slate-400 truncate">
                                      {card.subtitle}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {card.badge && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeClass(
                                      card.priority,
                                      card.badgeColor
                                    )}`}
                                  >
                                    {card.badge}
                                  </span>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Draft Action Card */}
                    {m.emailDraft && (
                      <div className="w-full pl-9 pr-2 mt-2">
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-pink-200 dark:border-pink-900/60 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-[#e0e2e7] dark:border-[#282a2d] pb-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                              <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                                Generated Email Draft
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Review Before Send
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="text-[#5f6368] dark:text-slate-400">
                              <strong>To:</strong> {m.emailDraft.to || '(Specify recipient)'}
                            </p>
                            <p className="text-[#5f6368] dark:text-slate-400 font-medium">
                              <strong>Subject:</strong> {m.emailDraft.subject}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] text-xs font-mono text-[#333] dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                            {m.emailDraft.body}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() =>
                                handleCopyDraft(
                                  `Subject: ${m.emailDraft?.subject}\n\n${m.emailDraft?.body}`,
                                  m.id
                                )
                              }
                              className="px-3 py-1.5 bg-slate-100 dark:bg-[#1e1f20] hover:bg-slate-200 dark:hover:bg-[#282a2d] text-[#444746] dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 dark:border-slate-700"
                            >
                              {copiedDraftIndex === m.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy Draft</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setActiveDraftToCompose(m.emailDraft || null)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Open in Compose</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Suggestions Pills */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="w-full pl-9 flex flex-wrap gap-1.5 mt-1">
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            className="px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60 text-[10px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>{sug}</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 px-9">{m.timestamp}</span>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-center gap-2.5 text-xs text-pink-600 dark:text-pink-400 py-2 pl-2 animate-pulse">
                  <div className="w-6 h-6 rounded-lg bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 animate-spin" />
                  </div>
                  <span className="font-semibold text-[11px]">
                    Analyzing real PostgreSQL records...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-[#f6f8fc] dark:bg-[#111318] border-t border-[#e0e2e7] dark:border-[#282a2d]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-white dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl px-3 py-2 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20 transition-all shadow-inner"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about applications, rejections, recruiters, emails..."
                  className="w-full bg-transparent text-xs text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="w-7 h-7 rounded-lg bg-gradient-to-r from-pink-500 to-rose-400 text-white flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 flex-shrink-0 shadow-sm"
                  title="Send Query"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                <span>Grounded on real database records</span>
                <span>Press Enter to send</span>
              </div>
            </div>
          </div>

      {/* Real Gmail Compose Modal for AI Drafted Emails */}
      {activeDraftToCompose && (
        <ComposeEmailModal
          isOpen={true}
          onClose={() => setActiveDraftToCompose(null)}
          onSuccess={() => setActiveDraftToCompose(null)}
          initialTo={activeDraftToCompose.to || ''}
          initialSubject={activeDraftToCompose.subject}
          initialBody={activeDraftToCompose.body}
          recruiterName={activeDraftToCompose.recruiterName}
          companyName={activeDraftToCompose.company}
          roleTitle={activeDraftToCompose.role}
        />
      )}
    </>
  );
};
