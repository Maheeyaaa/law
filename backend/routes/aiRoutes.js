import express from "express"

const router = express.Router()

router.post("/explain-notice",(req,res)=>{

 const {notice} = req.body

 res.json({
  reply:`This notice means you may need to respond within the required time period.`
 })

})

router.post("/chatbot",(req,res)=>{

 const {message} = req.body

 res.json({
  reply:"This is a demo legal assistant response."
 })

})

export default router