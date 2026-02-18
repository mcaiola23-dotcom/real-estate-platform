import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main>
        <div className="admin-auth-shell">
          <h1>Admin Sign In</h1>
          <p className="admin-muted">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable secure sign-in.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="admin-auth-shell">
        <h1>Admin Sign In</h1>
        <SignIn />
      </div>
    </main>
  );
}
