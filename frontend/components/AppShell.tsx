"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import AuthPortal from "@/components/ui/AuthPortal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  useEffect(() => {
    const handler = () => setShowAuthModal(true);
    window.addEventListener("open-auth", handler as EventListener);
    return () => window.removeEventListener("open-auth", handler as EventListener);
  }, []);
  return (
    <>
      <Navbar onOpenAuth={() => setShowAuthModal(true)} />
      {children}
      <AuthPortal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
