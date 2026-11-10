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
    <div className="flex h-full items-center justify-center min-h-[calc(100vh-200px)] p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <ShieldX className="h-16 w-16 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 text-lg">{message}</p>
          <p className="text-slate-500 text-sm mt-4">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>

        {showBackButton && (
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}