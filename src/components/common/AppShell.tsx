"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

// Routes where Navbar and Footer should not be displayed
const NO_CHROME_ROUTES = ["/login", "/register"];

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell Component
 * Single Responsibility: Conditionally renders global layout chrome (Navbar & Footer)
 * based on the active route.
 */
export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideChrome = NO_CHROME_ROUTES.includes(pathname);

  return (
    <>
      {!hideChrome && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}

