"use client"

import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onDoc)
    return () => document.removeEventListener("pointerdown", onDoc)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate("/", { replace: true })
  }

  return (
    <div className="profile" ref={ref}>
      <button
        className="profile-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Placeholder profile icon */}
        <span role="img" aria-label="profile">
          👤
        </span>
      </button>
      <div className={`dropdown ${open ? "open" : ""}`} role="menu">
        <Link to="/account" role="menuitem" onClick={() => setOpen(false)}>
          Account
        </Link>
        <button role="menuitem" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  )
}
