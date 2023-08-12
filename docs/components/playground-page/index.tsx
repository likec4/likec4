import dynamic from 'next/dynamic'
import React from "react";

const Playground = dynamic(
  () => import('./playground'),
  {
    loading: () => <div style={{padding: '2rem', fontSize: '1.15rem', textAlign: 'center', opacity: 0.9}}>Loading...</div>,
    ssr: false,
  }
)
// import Playground from './playground'
const PlaygroundContainer = ({children}: React.PropsWithChildren) => (
  <div style={{
    position: 'fixed',
    top: 'var(--nextra-navbar-height)',
    bottom: 0,
    left: 0,
    right: 0
  }}>
    {children}
  </div>
)

export function PlaygroundBigbank() {
  return <PlaygroundContainer>
    <Playground variant={'bigbank'}/>
  </PlaygroundContainer>
}

export function PlaygroundGettingStarted() {
  return <PlaygroundContainer>
    <Playground variant={'getting-started'}/>
  </PlaygroundContainer>
}

export function PlaygroundBlank() {
  return <PlaygroundContainer>
    <Playground variant={'blank'}/>
  </PlaygroundContainer>
}
