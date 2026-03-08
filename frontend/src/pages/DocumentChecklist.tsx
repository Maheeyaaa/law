export default function DocumentChecklist(){

    const docs = [
   
     "ID Proof",
     "Legal Notice Copy",
     "Agreement",
     "Payment Receipts"
   
    ]
   
    return(
   
     <div>
   
      <h1>Document Checklist</h1>
   
      {docs.map((doc,i)=>(
       <p key={i}>✔ {doc}</p>
      ))}
   
     </div>
   
    )
   
   }