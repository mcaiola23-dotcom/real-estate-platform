import { UserProfile, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Container from "../components/Container";

export default function AccountPage() {
    return (
        <div className="bg-slate-50 min-h-screen py-20">
            <Container>
                <div className="max-w-4xl mx-auto flex justify-center">
                    <SignedIn>
                        <UserProfile routing="hash" />
                    </SignedIn>
                    <SignedOut>
                        <RedirectToSignIn />
                    </SignedOut>
                </div>
            </Container>
        </div>
    );
}
