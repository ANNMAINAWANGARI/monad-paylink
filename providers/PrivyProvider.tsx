'use client'
import { monadTestnetInfo } from "@/lib/monad-tokens"
import { PrivyProvider } from "@privy-io/react-auth"
import { monadTestnet } from "viem/chains"


export const PrivyProviders =({ children }: { children: React.ReactNode })=>{
    return(
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
            config={{
                loginMethods: ["email", "google"],
                appearance: {
                    theme: "dark",
                    accentColor: "#676FFF", 
                },
                embeddedWallets:{
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                },
                defaultChain:monadTestnet,
                supportedChains:[monadTestnetInfo]
            }}>{children}</PrivyProvider>
    )
}