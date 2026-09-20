'use client'
import { usePrivy } from '@privy-io/react-auth';
import React from 'react'

const SettingsPage = () => {
    const { user } = usePrivy();
    console.log(user)
  return (
    <div>SettingsPage</div>
  )
}

export default SettingsPage;