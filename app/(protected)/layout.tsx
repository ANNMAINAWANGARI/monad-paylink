import type { Metadata } from "next";

import AuthGuard from "@/components/AuthGuard";


export const metadata: Metadata = {
  title: "Pesalink | Dashboard",
  description: "Pesalink Dashboard",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>{children}</AuthGuard>
  );
}
      
  
