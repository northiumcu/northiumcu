import { Suspense } from "react";
import SignInContent from "./sign-in-content";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-northium-muted">
          Loading sign in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
