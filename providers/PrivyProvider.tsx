'use client'
import {PrivyProvider} from '@privy-io/react-auth';

export default function PrivyProviders({children}: {children: React.ReactNode}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        loginMethods: ['email', 'google'],
        appearance:{
            theme: 'light',
            accentColor: '#f05b35',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}