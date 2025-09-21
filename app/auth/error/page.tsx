// app/auth/error/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

type SP = { [key: string]: string | string[] | undefined };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const raw = sp?.error;
  const error = Array.isArray(raw) ? raw[0] : raw;

  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "missing_parameters":
        return "Missing required authentication parameters. Please try signing in again.";
      case "state_mismatch":
        return "Security validation failed. This may be due to a CSRF attack attempt.";
      case "exchange_failed":
        return "Failed to exchange authorization code. Please try again.";
      case "backend_verification_failed":
        return "Backend authentication service is unavailable. Please try again later.";
      case "invalid_response":
        return "Invalid response from authentication service. Please contact support.";
      case "server_error":
        return "An unexpected server error occurred. Please try again.";
      default:
        return "An authentication error occurred. Please try signing in again.";
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-destructive text-destructive-foreground">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription className="text-muted-foreground text-sm leading-relaxed">
            {errorMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button asChild className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/login">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </a>
            </Button>

            <Button asChild variant="outline" className="w-full gap-2">
              <a href="/">
                <Home className="w-4 h-4" />
                Go Home
              </a>
            </Button>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-mono">Error Code: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
