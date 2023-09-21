import React from 'react'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, nextui } from '@nextui-org/react'

import data from 'virtual:likec4-views'

export default function App() {
  return (
    <>
      <Navbar maxWidth='full'>
        <NavbarBrand>
          <p className='font-bold text-inherit'>ACME</p>
        </NavbarBrand>
        <NavbarContent className='hidden sm:flex gap-4' justify='center'>
          <NavbarItem>
            <Link color='foreground' href='#'>
              Features
            </Link>
          </NavbarItem>
          <NavbarItem isActive>
            <Link href='#' aria-current='page'>
              Customers
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color='foreground' href='#'>
              Integrations
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify='end'>
          <NavbarItem className='hidden lg:flex'>
            <Link href='#'>Login</Link>
          </NavbarItem>
          <NavbarItem>
            <Button as={Link} color='primary' href='#' variant='flat'>
              Sign Up
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className='container mx-auto'>
        <pre>{JSON.stringify(data)}</pre>
      </main>
    </>
  )
}
