'use client';

import { cn } from '@/lib/utils';
import { Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from './ui/button';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
}

export function Message({ role, content, reasoning_content, status }: MessageProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
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
      <div className="flex flex-col gap-2 flex-1">
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
          {status === 'error' && (
            <div className="text-red-500 mt-2">
              {content || '服务器繁忙，请稍后重试'}
            </div>
          )}
        </div>
        {reasoning_content && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 text-xs"
              onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
            >
              {isReasoningExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  收起推理过程
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  展开推理过程
                </>
              )}
            </Button>
            {isReasoningExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
              >
                <div className="font-medium mb-1">推理过程：</div>
                <div className="whitespace-pre-wrap break-words">{reasoning_content}</div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 