import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface EmailContentViewerProps {
  body: string;
  subject?: string;
  className?: string;
}

export const EmailContentViewer: React.FC<EmailContentViewerProps> = ({
  body,
  subject,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(450);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isHtml = body && /<(!DOCTYPE|html|head|body|div|p|span|table|tr|td|a|img|h[1-6]|style)[^>]*>/i.test(body);

  const handleCopy = () => {
    // If HTML, strip tags for clean text copy
    const textToCopy = isHtml
      ? body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
      : body;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-process HTML to ensure links open in new tab, images load without referrer blocks, and typography is crisp
  const prepareHtml = (rawHtml: string) => {
    if (!rawHtml) return '';

    let html = rawHtml;

    const metaTags = '<meta name="referrer" content="no-referrer" /><meta name="viewport" content="width=device-width, initial-scale=1" /><base target="_blank" />';

    // Ensure base target _blank and no-referrer meta are injected
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, `$&${metaTags}`);
    } else {
      html = metaTags + html;
    }

    // Inject smart default CSS for high-fidelity responsive display inside iframe
    const styleInjection = `
      <style>
        body {
          margin: 0;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1f1f1f;
          background-color: #ffffff;
          line-height: 1.5;
          word-wrap: break-word;
          overflow-wrap: break-word;
          -webkit-text-size-adjust: 100%;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          vertical-align: middle;
          display: inline-block;
        }
        table {
          max-width: 100% !important;
        }
        a {
          color: #db2777;
          text-decoration: underline;
        }
        a:hover {
          color: #be185d;
        }
        /* Hide 0x0 / 1x1 tracking pixel spacer artifacts */
        img[width="1"][height="1"], img[width="0"][height="0"] {
          display: none !important;
        }
      </style>
    `;

    return styleInjection + html;
  };

  const preparedHtml = isHtml ? prepareHtml(body) : '';

  // Auto-resize iframe height to fit contents perfectly
  const handleIframeLoad = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        if (doc) {
          const scrollHeight = Math.max(
            doc.body.scrollHeight,
            doc.documentElement.scrollHeight,
            400
          );
          setIframeHeight(scrollHeight + 30);
        }
      }
    } catch {
      // Cross-origin fallback default
      setIframeHeight(550);
    }
  };

  useEffect(() => {
    if (isHtml) {
      const timer = setTimeout(handleIframeLoad, 250);
      return () => clearTimeout(timer);
    }
  }, [body, isHtml]);

  // Plain-text parser that resolves and converts footnote references like [1], [2] to clickable links
  const renderPlainTextWithResolvedLinks = (text: string) => {
    if (!text) return null;

    // Parse footnotes at the end: "1. https://link.com" or "[1] https://link.com"
    const refMap: Record<string, string> = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const match = line.match(/^\[?(\d+)\]?\.?\s+(https?:\/\/\S+)/);
      if (match) {
        refMap[match[1]] = match[2];
      }
    }

    const paragraphs = text.split('\n');

    return (
      <div className="space-y-3 font-sans text-sm leading-relaxed text-[#1f1f1f] dark:text-[#e3e3e3] select-text">
        {paragraphs.map((para, idx) => {
          const trimmed = para.trim();
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }

          // Check if this is a references header
          if (trimmed.toLowerCase() === 'references' || trimmed.toLowerCase() === 'visible links') {
            return (
              <div key={idx} className="pt-3 pb-1 border-b border-[#e0e2e7] dark:border-[#282a2d] text-xs font-bold text-pink-600 dark:text-pink-400 tracking-wider uppercase">
                {trimmed}
              </div>
            );
          }

          // Check if this is a footnote link definition line: "1. http://..."
          const refLineMatch = trimmed.match(/^(\d+)\.\s+(https?:\/\/\S+)/);
          if (refLineMatch) {
            const num = refLineMatch[1];
            const url = refLineMatch[2];
            return (
              <div key={idx} className="flex items-start gap-2 text-xs py-1 text-[#5f6368] dark:text-slate-400">
                <span className="font-bold text-pink-600 dark:text-pink-400 min-w-[20px]">[{num}]</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 dark:text-pink-400 hover:underline break-all inline-flex items-center gap-1"
                >
                  <span>{url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            );
          }

          // Standard paragraph: replace [1], [2] footnotes or raw URLs with interactive links
          const parts = para.split(/(\[\d+\]|https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g);

          return (
            <p key={idx} className="whitespace-pre-wrap leading-relaxed">
              {parts.map((part, pIdx) => {
                // Check if footnote token like [1]
                const fnMatch = part.match(/^\[(\d+)\]$/);
                if (fnMatch && refMap[fnMatch[1]]) {
                  const targetUrl = refMap[fnMatch[1]];
                  return (
                    <a
                      key={pIdx}
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-500/40 text-pink-700 dark:text-pink-300 hover:text-pink-950 dark:hover:text-white hover:bg-pink-200 dark:hover:bg-pink-900 text-xs font-bold transition-all shadow-sm group"
                      title={`Open link: ${targetUrl}`}
                    >
                      <span>[{fnMatch[1]}]</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                    </a>
                  );
                }

                // Check if raw URL
                if (part.startsWith('http://') || part.startsWith('https://')) {
                  return (
                    <a
                      key={pIdx}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 dark:text-pink-400 hover:underline font-medium inline-flex items-center gap-0.5 break-all mx-0.5"
                    >
                      <span>{part}</span>
                      <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
                    </a>
                  );
                }

                return <span key={pIdx}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border border-[#e0e2e7] dark:border-[#282a2d] bg-white dark:bg-[#16181f] shadow-md ${className}`}>
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-[#f6f8fc] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#1f1f1f] dark:text-white flex items-center gap-1.5">
            <span>Gmail Message</span>
            {isHtml && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                Rich HTML
              </span>
            )}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] border border-[#dadce0] dark:border-slate-700 text-xs font-semibold text-[#444746] dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
          title="Copy email text"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content Rendering Pane */}
      {isHtml ? (
        <div className="w-full bg-white rounded-b-2xl overflow-hidden p-1 shadow-inner">
          <iframe
            ref={iframeRef}
            srcDoc={preparedHtml}
            onLoad={handleIframeLoad}
            title={subject || 'Email Content'}
            className="w-full border-0 transition-all block bg-white"
            style={{ height: `${iframeHeight}px`, minHeight: '350px' }}
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          />
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-[#111318] overflow-y-auto max-h-[650px] custom-scrollbar">
          {renderPlainTextWithResolvedLinks(body)}
        </div>
      )}
    </div>
  );
};
