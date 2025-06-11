"use client";

import Dashboard from "@/components/data/Dashboard";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { requireAuth } = useAuth();
  
  // Protect this route
  requireAuth();

  return <Dashboard />;
}
