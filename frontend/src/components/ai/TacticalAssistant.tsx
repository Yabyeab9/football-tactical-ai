"use client"

import { useState } from "react"

export default function TacticalAssistant() {

  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<string[]>([])

  const sendMessage = () => {

    setChat([...chat, message])
    setMessage("")

  }

  return (

    <div className="bg-slate-900 p-6 rounded-xl">

      <h2 className="text-lg mb-4">
        Tactical AI Assistant
      </h2>

      <div className="space-y-2 mb-4">

        {chat.map((c,i)=>(
          <div key={i} className="bg-slate-800 p-2 rounded">
            {c}
          </div>
        ))}

      </div>

      <div className="flex gap-2">

        <input
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          className="flex-1 bg-slate-800 p-2 rounded"
          placeholder="Ask tactical question..."
        />

        <button
          onClick={sendMessage}
          className="bg-green-600 px-4 rounded"
        >
          Send
        </button>

      </div>

    </div>

  )

}