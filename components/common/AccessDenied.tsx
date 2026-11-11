"use client";

import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
  showBackButton = true,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex h-full items-center justify-center min-h-[calc(100vh-200px)] p-6 bg-background text-foreground">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground text-lg">{message}</p>
          <p className="text-muted-foreground text-sm mt-4">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>

        {showBackButton && (
          <Button
            onClick={() => router.push("/dashboard")}
            className=""
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}