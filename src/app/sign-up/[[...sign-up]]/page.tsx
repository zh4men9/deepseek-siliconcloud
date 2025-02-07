'use client';

import { SignUp } from "@clerk/nextjs";
import { useState } from 'react';

export default function Page() {
  const [inviteCode, setInviteCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const verifyInviteCode = async () => {
    try {
      const response = await fetch('/api/invite-code/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: inviteCode }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setIsVerified(true);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : '邀请码无效');
    }
  };

  if (!isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">欢迎注册</h1>
            <p className="text-muted-foreground">
              请输入邀请码以继续注册
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <button
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              onClick={verifyInviteCode}
              disabled={!inviteCode.trim()}
            >
              验证邀请码
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md space-y-6",
            card: "p-6 space-y-4 shadow-none border rounded-lg",
          }
        }}
        afterSignUpUrl="/"
      />
    </div>
  );
} 