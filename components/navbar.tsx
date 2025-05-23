"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calculator, BookOpen, BarChart3, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useMobile } from "@/hooks/use-mobile"

export default function Navbar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/tgpa-calculator", label: "TGPA Calculator", icon: Calculator },
    { href: "/cgpa-calculator", label: "CGPA Calculator", icon: BarChart3 },
    { href: "/course-manager", label: "Course Manager", icon: BookOpen },
  ]

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          GPA Predictor
        </Link>

        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
            {isMenuOpen && (
              <div className="absolute top-14 left-0 right-0 bg-background border-b z-50">
                <div className="container mx-auto px-4 py-4 flex flex-col space-y-2">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                      <Button variant={pathname === item.href ? "default" : "ghost"} className="w-full justify-start">
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant={pathname === item.href ? "default" : "ghost"} size="sm">
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
