import { useState } from "react"

export default function NoticeExplainer(){

 const [notice,setNotice] = useState("")
 const [result,setResult] = useState("")

 const explainNotice = async ()=>{

  const res = await fetch("http://localhost:8000/api/ai/explain-notice",{
   method:"POST",
   headers:{ "Content-Type":"application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
   },
   body: JSON.stringify({notice})
  })

  const data = await res.json()
  setResult(data.reply)

 }

 return(

  <div>

   <h1>Notice Explainer</h1>

   <textarea
    placeholder="Paste legal notice here"
    onChange={(e)=>setNotice(e.target.value)}
   />

   <br/>

   <button onClick={explainNotice}>
    Explain
   </button>

   <p>{result}</p>

  </div>

 )

}