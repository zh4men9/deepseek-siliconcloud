import { MessageList } from '@/components/message-list';
import { ChatInput } from '@/components/chat-input';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] bg-background">
        <div className="flex-1 container max-w-4xl mx-auto">
          <MessageList />
        </div>
        <div className="border-t p-4">
          <ChatInput />
        </div>
      </main>
    </>
  );
}
