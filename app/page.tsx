"use client"

import { Suspense } from "react"
import AppContent from "@/components/app-content"

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AppContent />
    </Suspense>
  )
}
