import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main>
        <div className="admin-auth-shell">
          <h1>Admin Sign Up</h1>
          <p className="admin-muted">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable secure sign-up.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="admin-auth-shell">
        <h1>Admin Sign Up</h1>
        <SignUp />
      </div>
    </main>
  );
}
