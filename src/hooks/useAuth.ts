"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const logout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const requireAuth = () => {
    useEffect(() => {
      if (status === "loading") return // Still loading
      if (!session) {
        router.push("/login")
      }
    }, [session, status, router])
  }

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    logout,
    requireAuth
  }
}
