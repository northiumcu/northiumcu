import Link from "next/link";
import { Button } from "@/components/ui/button";
import { institution } from "@/lib/institution";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-northium-surface px-6">
      <div className="max-w-md text-center">
        <p className="font-heading text-6xl font-extrabold text-northium-primary">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl font-bold text-northium-primary">
          Page Not Found
        </h1>
        <p className="mt-4 text-northium-muted">
          The page you requested does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            className="bg-northium-primary hover:bg-northium-secondary"
            render={<Link href="/" />}
          >
            Return Home
          </Button>
          <Button variant="outline" render={<Link href="/contact" />}>
            Contact Support
          </Button>
        </div>
        <p className="mt-8 text-sm text-northium-muted">
          {institution.supportEmail}
        </p>
      </div>
    </div>
  );
}
