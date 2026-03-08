import { useState } from "react"

export default function LegalChatbot(){

 const [message,setMessage] = useState("")
 const [reply,setReply] = useState("")

 const sendMessage = async ()=>{

  const res = await fetch("http://localhost:8000/api/ai/chatbot",{
   method:"POST",
   headers:{ "Content-Type":"application/json"},
   body: JSON.stringify({message})
  })

  const data = await res.json()

  setReply(data.reply)

 }

 return(

  <div>

   <h1>Legal Chatbot</h1>

   <input
    placeholder="Ask legal question"
    onChange={(e)=>setMessage(e.target.value)}
   />

   <button onClick={sendMessage}>
    Ask
   </button>

   <p>{reply}</p>

  </div>

 )

}