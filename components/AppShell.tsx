"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";


import { SidebarProvider,useSidebar } from "@/context/SidebarContext";

function ShellContent({ children }: { children: ReactNode }) {
  const { mounted, toggle } = useSidebar();

  // 🚨 VERY IMPORTANT → hydration fix
  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar toggle={toggle} />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  );
}
