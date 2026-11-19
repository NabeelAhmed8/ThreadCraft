"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

const NO_CHROME_ROUTES = ["/login", "/register", "/verify-email"];

interface AppShellProps {
  children: React.ReactNode;
}

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

