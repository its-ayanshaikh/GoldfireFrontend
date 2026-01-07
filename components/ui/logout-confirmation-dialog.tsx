"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LogOut, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LogoutConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  userName?: string
}

export function LogoutConfirmationDialog({ open, onOpenChange, onConfirm, userName }: LogoutConfirmationDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    // Show logout toast
    toast({
      title: "Logging out...",
      description: "Please wait while we log you out safely.",
    })

    // Simulate logout process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Logged out successfully",
      description: "You have been logged out safely. See you soon!",
    })

    setIsLoggingOut(false)
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {userName ? (
              <>
                Are you sure you want to logout, <span className="font-medium">{userName}</span>?
                <br />
                You will need to login again to access the system.
              </>
            ) : (
              "Are you sure you want to logout? You will need to login again to access the system."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoggingOut} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Yes, Logout
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
