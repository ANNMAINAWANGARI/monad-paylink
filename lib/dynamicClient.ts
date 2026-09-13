"use client"
import { createDynamicClient } from "@dynamic-labs-sdk/client";
import { addWaasEvmExtension } from "@dynamic-labs-sdk/evm/waas";

export const dynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  metadata: {
    name: "Pesalink",
    universalLink: typeof window !== "undefined" ? window.location.origin : "",
  },
});

addWaasEvmExtension();