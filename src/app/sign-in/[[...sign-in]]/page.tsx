import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md space-y-6",
            card: "p-6 space-y-4 shadow-none border rounded-lg",
          }
        }}
        afterSignInUrl="/"
      />
    </div>
  );
} 