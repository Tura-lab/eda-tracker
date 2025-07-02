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
    return <div className="flex items-center justify-center min-h-screen text-gray-900 dark:text-gray-100">Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8">
        <Logo size={64} />
      </div>
      <h1 className="text-2xl mb-4 font-bold text-gray-900 dark:text-gray-100">Welcome to እዳ Tracker!</h1>
      <p className="mb-8 text-center max-w-md text-gray-600 dark:text-gray-400">
        Please enter your name to complete your profile and start tracking your lending transactions.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 
                     text-white rounded disabled:bg-gray-400 dark:disabled:bg-gray-600 
                     cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  )
} 