import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat';
import { Message } from './message';
import { motion, AnimatePresence } from 'framer-motion';

export function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4 space-y-4"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Message
              role={message.role}
              content={message.content}
              reasoning_content={message.reasoning_content}
              status={message.status}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 