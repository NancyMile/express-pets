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

  console.log(req.body);
  res.send("Thanks for sending data to us")
}