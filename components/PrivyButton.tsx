'use client'

import { Button } from './ui/button'
import { usePrivy,useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

const PrivyButton = () => {
    const router = useRouter();
    const { ready, authenticated, user, logout, } = usePrivy();
    const { login } = useLogin({
        onComplete: ({ user, isNewUser }) => {
            router.push('/settings'); 
        },
        onError: (error) => {
            console.error('Login failed', error);
        }
    });
    
    if(!ready){
        return(
            <Button>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-[#bdbdc2]" />
            </Button>
        )
    }
    if(!authenticated){
        return(
            <Button onClick={login}>Login</Button>
        )
    }
  return (
    <div className='w-full flex items-center gap-2'>
        <p>user</p>
        <Button onClick={logout}>Logout</Button>
    </div>
  )
}

export default PrivyButton