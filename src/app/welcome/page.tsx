"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Logo from "../components/Logo"

export default function WelcomePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })

    if (response.ok) {
      await update()
      router.push("/")
    } else {
      console.error("Failed to update user name")
      alert("Could not update your name. Please try again.")
      setIsLoading(false)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="mb-8">
        <Logo size={64} />
      </div>
      <h1 className="text-2xl mb-4">Welcome to እዳ Tracker!</h1>
      <p className="mb-8 text-center max-w-md">Please enter your name to complete your profile and start tracking your lending transactions.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-4 py-2 border rounded text-black"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400 cursor-pointer"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  )
} 