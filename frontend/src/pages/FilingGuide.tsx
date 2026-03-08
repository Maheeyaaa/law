export default function FilingGuide(){

    const steps = [
   
     "Collect documents",
     "Draft complaint",
     "Submit to court",
     "Pay filing fee",
     "Attend hearing"
   
    ]
   
    return(
   
     <div>
   
      <h1>Filing Guide</h1>
   
      {steps.map((step,i)=>(
        <p key={i}>{step}</p>
      ))}
   
     </div>
   
    )
   
   }