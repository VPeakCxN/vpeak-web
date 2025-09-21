'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


export default function NeedLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <AlertTitle className="text-2xl font-bold text-foreground mb-2">Authentication Required</AlertTitle>
          <AlertDescription className="text-muted-foreground mb-6">
            Please log in to create posts.
          </AlertDescription>
          <Button asChild className="w-full" variant="default">
            <a href="/login">Go to Login</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
