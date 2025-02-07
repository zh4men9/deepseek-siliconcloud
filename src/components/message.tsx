import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
}

export function Message({ role, content, reasoning_content, status }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-4 p-4',
        isUser ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Bot className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">{isUser ? '用户' : 'DeepSeek'}</div>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {content}
          {status === 'processing' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              ▍
            </motion.span>
          )}
        </div>
        {reasoning_content && (
          <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
            <div className="font-medium mb-1">思考过程：</div>
            <div className="whitespace-pre-wrap break-words">{reasoning_content}</div>
          </div>
        )}
      </div>
    </div>
  );
} 