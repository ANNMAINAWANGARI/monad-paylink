import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletIdOrAddress = searchParams.get('wallet');
  

  if (!walletIdOrAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET; 

  try {
    const response = await fetch(
      `https://api.privy.io/v1/wallets/${walletIdOrAddress}/balance`,
      {
        headers: {
          'privy-app-id': appId!,
          'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 10 },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}