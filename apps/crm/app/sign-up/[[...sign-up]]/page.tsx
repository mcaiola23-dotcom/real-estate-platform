import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main>
        <div className="crm-auth-shell">
          <p className="crm-kicker">CRM Access</p>
          <h1>Sign up unavailable</h1>
          <p className="crm-muted">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable secure sign-up.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="crm-auth-shell">
        <p className="crm-kicker">CRM Access</p>
        <h1>Create your account</h1>
        <SignUp />
      </div>
    </main>
  );
}
