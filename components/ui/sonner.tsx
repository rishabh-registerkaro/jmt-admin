"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      // Fixed slate palette rather than var(--popover): the admin panel is
      // hard-coded dark but never sets the `.dark` class, so those variables
      // always resolved to the LIGHT theme — white toast text on a white toast.
      toastOptions={{
        classNames: {
          description: "!text-slate-300",
          actionButton: "!bg-indigo-500 !text-white",
          cancelButton: "!bg-slate-700 !text-slate-200",
        },
      }}
      style={
        {
          "--normal-bg": "#0f172a",
          "--normal-text": "#f1f5f9",
          "--normal-border": "#334155",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
