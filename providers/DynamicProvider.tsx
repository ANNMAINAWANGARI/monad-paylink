
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicProvider } from "@dynamic-labs-sdk/react-hooks";
import { dynamicClient } from "@/lib/dynamicClient";
import WaasBootstrap from "@/components/WaasBootstrap";

const queryClient = new QueryClient();

export default function DynamicProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicProvider client={dynamicClient}>
        <WaasBootstrap />
        {children}</DynamicProvider>
    </QueryClientProvider>
  );
}