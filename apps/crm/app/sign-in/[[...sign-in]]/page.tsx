import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main>
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign-in.</p>
      </main>
    );
  }

  return (
    <main>
      <SignIn />
    </main>
  );
}
