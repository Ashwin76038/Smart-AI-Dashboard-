import React, { useState } from 'react';
import { Send, Sparkles, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
    placeholder?: string;
}

const AIChat: React.FC<AIChatProps> = ({
    onSendMessage,
    isLoading = false,
    placeholder = "Ask AI to modify your dashboard..."
}) => {
    const [message, setMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const suggestions = [
        "Add a pie chart for categories",
        "Show me the top 10 values",
        "Change colors to blue theme",
        "Add trend lines"
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 backdrop-blur-xl bg-background/80 border-t border-border/50">
            <div className="max-w-4xl mx-auto">
                {/* Suggestions */}
                {isExpanded && (
                    <div className="mb-3 flex flex-wrap gap-2 animate-slide-up">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => setMessage(suggestion)}
                                className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="relative">
                    <div className="ai-chat-input rounded-2xl">
                        <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>

                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                            disabled={isLoading}
                        />

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                                title="Voice input (coming soon)"
                            >
                                <Mic className="h-4 w-4" />
                            </Button>

                            <Button
                                type="submit"
                                disabled={!message.trim() || isLoading}
                                className="h-9 w-9 rounded-full btn-glow bg-primary hover:bg-primary/90"
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Collapse button */}
                {isExpanded && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default AIChat;
