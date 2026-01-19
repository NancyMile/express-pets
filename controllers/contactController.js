const nodemailer = require("nodemailer")
const validator = require("validator")
const { ObjectId } = require("mongodb")
const sanitizeHtml = require("sanitize-html")
const petsCollection = require("../db").db().collection("pets")
const contactsCollection = require("../db").db().collection("contacts")

const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {}
}


exports.submitContact = async function(req, res,next){
  if(req.body.secret.toUpperCase() !== "PUPPY"){
    console.log("Spam detected")
    return res.json({message:"sorry"})
  }

  if(typeof req.body.name != "string"){
    req.body.name = ""
  }

  if(typeof req.body.email != "string"){
    req.body.email = ""
  }

  if(typeof req.body.comment != "string"){
    req.body.comment = ""
  }

  if(!validator.isEmail(req.body.email)){
    console.log("Invalid email")
    return res.json({message:"sorry"})
  }

  if(!ObjectId.isValid(req.body.petId)){
    console.log("Invalid Id")
    return res.json({message:"sorry"})
  }

req.body.petId = new ObjectId(req.body.petId)
const doesPetExist =  await petsCollection.findOne({_id: req.body.petId})

if(!doesPetExist){
    console.log("Pet doesn't exists")
    return res.json({message:"sorry"})
}

  const ourObject= {
    petId: req.body.petId,
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

  try{
    //email to the client
    const promise1 = transport.sendMail({
      to: ourObject.email,
      from:"pets@test.com",
      subject:`Thank you for for your interest in ${doesPetExist.name}`,
      html:`<h3 style="color:purple; font-size:30px; font-weight:normal;">${ourObject.name}</h3>
      <p> We appreciate your interest in ${doesPetExist.name}</p>
      <p><em>${ourObject.comment}</em></p>`
    })

    //email to manager
    const promise2 = transport.sendMail({
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

    const promise3 = await contactsCollection.insertOne(ourObject)

    await Promise.all([promise1,promise2,promise3])

  }catch(err){
    next(err)
  }

  res.send("Thanks for sending data to us")
}