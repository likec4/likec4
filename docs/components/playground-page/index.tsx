import dynamic from 'next/dynamic'

const Playground = dynamic(
  () => import('./playground'),
  {
    loading: () => <div style={{padding: '2rem', fontSize: '1.15rem', textAlign: 'center', opacity: 0.9}}>Loading...</div>,
    ssr: false,
  }
)
export default function PlaygroundPage() {
  return <div style={{
    position: 'fixed',
    top: 'var(--nextra-navbar-height)',
    bottom: 0,
    left: 0,
    right: 0
  }}>
    <Playground />
  </div>
}
