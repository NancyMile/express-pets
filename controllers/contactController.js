const nodemailer = require("nodemailer")
const { ObjectId } = require("mongodb")
const sanitizeHtml = require("sanitize-html")
const petsCollection = require("../db").db().collection("pets")

const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {}
}


exports.submitContact = async function(req, res){
  if(req.body.secret.toUpperCase() !== "PUPPY"){
    console.log("Spam detected")
    return res.json({message:"sorry"})
  }

  if(!ObjectId.isValid(req.body.petId)){
    console.log("Invalid Id")
    return res.json({message:"sorry"})
  }

const doesPetExist =  await petsCollection.findOne({_id: new ObjectId(req.body.petId)})

if(!doesPetExist){
    console.log("Pet doesn't exists")
    return res.json({message:"sorry"})
}

  const ourObject= {
    name:sanitizeHtml(req.body.name, sanitizeOptions),
    email:sanitizeHtml(req.body.email, sanitizeOptions),
    comment:sanitizeHtml(req.body.comment, sanitizeOptions),
  }

  console.log(ourObject)
  // Looking to send emails in production? Check out our Email API/SMTP product!
  var  transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAPUSERNAME,
      pass: process.env.MAILTRAPPASSWORD
    }
  })

  //email to the client
  transport.sendMail({
    to: ourObject.email,
    from:"pets@test.com",
    subject:`Thank you for for your interest in ${doesPetExist.name}`,
    html:`<h3 style="color:purple; font-size:30px; font-weight:normal;">${ourObject.name}</h3>
    <p> We appreciate your interest in ${doesPetExist.name}</p>
    <p><em>${ourObject.comment}</em></p>`
  })

  //email to manager
  transport.sendMail({
    to: "petsadmin@test.com",
    from:"pets@test.com",
    subject:`Someone is interested in ${doesPetExist.name}`,
    html:`<h3 style="color:purple; font-size:30px; font-weight:normal;">${ourObject.name}</h3>
    <p> Name: ${ourObject.name}<br>
    Pet: ${doesPetExist.name}<br>
    Email: ${ourObject.email}<br>
    Message: ${ourObject.comment}
    </p>`
  })
  res.send("Thanks for sending data to us")
}