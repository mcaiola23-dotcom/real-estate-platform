import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main>
        <div className="crm-auth-shell">
          <p className="crm-kicker">CRM Access</p>
          <h1>Sign in unavailable</h1>
          <p className="crm-muted">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable secure sign-in.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="crm-auth-shell">
        <p className="crm-kicker">CRM Access</p>
        <h1>Welcome back</h1>
        <SignIn />
      </div>
    </main>
  );
}
