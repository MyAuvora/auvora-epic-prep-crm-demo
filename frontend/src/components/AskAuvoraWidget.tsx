import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, User, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to extract download links from AI response
function extractDownloadLinks(content: string): { text: string; downloads: Array<{ url: string; filename: string; format: string }> } {
  const downloads: Array<{ url: string; filename: string; format: string }> = [];
  
  // Look for download URL patterns in the response
  // Pattern: /api/exports/UUID
  const urlPattern = /\/api\/exports\/[a-f0-9-]+/gi;
  const matches = content.match(urlPattern);
  
  if (matches) {
    matches.forEach((url) => {
      // Try to extract filename from context
      const filenameMatch = content.match(/filename[:\s]*["']?([^"'\n,]+\.(csv|xlsx|pdf))["']?/i);
      const formatMatch = content.match(/format[:\s]*["']?(csv|xlsx|pdf)["']?/i);
      
      downloads.push({
        url: `${API_BASE_URL}${url}`,
        filename: filenameMatch ? filenameMatch[1] : 'report',
        format: formatMatch ? formatMatch[1] : 'csv'
      });
    });
  }
  
  return { text: content, downloads };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionsUsed?: string[];
}

interface AskAuvoraWidgetProps {
  userRole?: string;
}

export function AskAuvoraWidget({ userRole = 'admin' }: AskAuvoraWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Auvora, your AI assistant for EPIC Prep Academy. I can help you with:\n\n• Student information and progress\n• Family and billing inquiries\n• Attendance and learning reports\n• Scholarship tracking (Step Up for Students)\n• Staff and lead management\n\nHow can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const exampleQueries = userRole === 'parent' ? [
    'What events are coming up?',
    'How do I message a teacher?',
    'How do I re-enroll my child?',
    'What features are available to me?',
  ] : userRole === 'coach' ? [
    'How many students do we have?',
    'Show me at-risk students',
    'What events are coming up?',
    'How do I take attendance?',
  ] : [
    'How many students do we have?',
    'Show me at-risk students',
    'What is our scholarship summary?',
    'Which families have overdue balances?',
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery('');

    // Add user message to chat
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Call AI endpoint
    setIsLoading(true);
    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: conversationHistory,
          user_role: userRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        functionsUsed: data.functions_called,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const formatMessage = (content: string) => {
    // Extract download links from the content
    const { downloads } = extractDownloadLinks(content);
    
    // Convert markdown-like formatting to HTML
    const formattedContent = content
      .split('\n')
      .map((line, i) => {
        // Handle bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <li key={i} className="ml-4">{line.substring(2)}</li>;
        }
        // Handle numbered lists
        if (/^\d+\.\s/.test(line)) {
          return <li key={i} className="ml-4">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        // Handle headers (###)
        if (line.startsWith('### ')) {
          return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.substring(4)}</h4>;
        }
        // Handle bold text
        const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (boldFormatted !== line) {
          return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: boldFormatted }} />;
        }
        // Regular text
        if (line.trim()) {
          return <p key={i} className="mb-1">{line}</p>;
        }
        return <br key={i} />;
      });
    
    // If there are downloads, add download buttons
    if (downloads.length > 0) {
      return (
        <>
          {formattedContent}
          <div className="mt-3 pt-2 border-t border-gray-200">
            {downloads.map((download, idx) => (
              <a
                key={idx}
                href={download.url}
                download={download.filename}
                className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A2463] text-white rounded-lg hover:bg-[#163B9A] transition-colors text-sm mr-2 mb-2"
              >
                {download.format === 'pdf' ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <Download className="h-3 w-3" />
                Download {download.format.toUpperCase()}
              </a>
            ))}
          </div>
        </>
      );
    }
    
    return formattedContent;
  };

    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        {isOpen ? (
          <Card className="w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-6rem)] sm:h-[600px] max-h-[600px] shadow-2xl border-2 flex flex-col" style={{ borderColor: '#1e3a5f' }}>
          <CardHeader className="text-white py-3 px-4 flex-shrink-0" style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Ask Auvora
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI Powered</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}>
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      style={message.role === 'user' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                    >
                      <div className="text-sm">
                        {formatMessage(message.content)}
                      </div>
                      {message.functionsUsed && message.functionsUsed.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Data sources: {message.functionsUsed.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}>
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Example queries (only show if no user messages yet) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 border-t">
                <p className="text-xs text-gray-500 mt-2 mb-1">Try asking:</p>
                <div className="flex flex-wrap gap-1">
                  {exampleQueries.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleExampleClick(example)}
                      className="text-xs text-[#0A2463] hover:bg-[#0A2463]/10 px-2 py-1 rounded-full border border-[#0A2463]/30 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <form onSubmit={handleSubmit} className="p-3 border-t bg-gray-50 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about your school..."
                  className="flex-1 border-[#0A2463]/30 focus:border-[#0A2463]"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="text-white"
                  style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg group"
          style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
          </div>
        </Button>
      )}
    </div>
  );
}
