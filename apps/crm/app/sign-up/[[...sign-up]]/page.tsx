import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main>
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign-up.</p>
      </main>
    );
  }

  return (
    <main>
      <SignUp />
    </main>
  );
}
