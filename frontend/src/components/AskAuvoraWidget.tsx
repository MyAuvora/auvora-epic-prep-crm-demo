import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AskAuvoraWidgetProps {
  onSearch: (query: string) => void;
}

export function AskAuvoraWidget({ onSearch }: AskAuvoraWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const exampleQueries = [
    'Show me at-risk students',
    'Show students with more than 3 absences',
    'Show families with balance over $250',
    'Show students behind in IXL',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery('');
    }
  };

  const handleExampleClick = (example: string) => {
    onSearch(example);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-96 shadow-2xl border-amber-600">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Ask Auvora
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-amber-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1"
                />
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Try these:</p>
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="block w-full text-left text-sm text-amber-700 hover:text-amber-900 hover:bg-amber-50 p-2 rounded transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
