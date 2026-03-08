import { useState } from "react"

export default function DeadlineCalculator(){

 const [date,setDate] = useState("")
 const [result,setResult] = useState("")

 const calculate = ()=>{

  let received = new Date(date)
  received.setDate(received.getDate()+30)

  setResult(received.toDateString())

 }

 return(

  <div>

   <h1>Deadline Calculator</h1>

   <input
    type="date"
    onChange={(e)=>setDate(e.target.value)}
   />

   <button onClick={calculate}>
    Calculate Deadline
   </button>

   <p>{result}</p>

  </div>

 )

}
