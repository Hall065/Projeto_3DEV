import { Outlet } from 'react-router-dom'
import { AuthSidebar } from '../components/auth/AuthSidebar'
import loginBackground from '../assets/auth/login-background.png'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <AuthSidebar />

      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-hub-bg px-6 py-10">
        <img
          src={loginBackground}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="relative z-10 w-full max-w-[420px]">
          <Outlet />
        </div>
      </section>
    </div>
  )
}
