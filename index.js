// const { response } = require('express');
// const express = require('express');
import express from "express";
import { MongoClient } from "mongodb"
import dotenv from "dotenv";
import  nodemailer  from "nodemailer";
import  SendGridTransport  from "nodemailer-sendgrid-transport";
import jwt from "jsonwebtoken";
import cors from "cors"


export const app = express();
dotenv.config()
// console.log(process.env.MONGO_URL);
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 9000;
const MONGO_URL = process.env.MONGO_URL;
const SECRET_KEY = process.env.SECRET_KEY || "secret";
const FRONT_END_URL = process.env.FRONT_END_URL || "http://localhost:3000/reset-password/"

export async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("connected successfully")
  return client ;
 }

export const client = await createConnection();

const transporter = nodemailer.createTransport(SendGridTransport({
  auth:{
      api_key:process.env.SENDGRID_API
  }
}))

function sendMail(to,link) {
  transporter.sendMail({
    to:to,
    from:"eshwarchamp@gmail.com",
    subject:"Sample mail",
    html:`<h1>click the link to reset your password ${link}</h1>`
}).then(r => console.log(r))
}

app.get("/",async(req,resp) => {
  // transporter.sendMail({
  //       to:"saigokul14@gmail.com",
  //       from:"eshwarchamp@gmail.com",
  //       subject:"Sample mail",
  //       html:"<h1>Success</h1>"
  //   }).then(r => console.log(r))
  resp.send("hello world")
})


app.post("/forgot-password",async(req,resp) => {
  let {email} = req.body;
  const user = await client.db("forgot-password").collection("users").findOne({email : email})
  if(user){
    console.log("user is available")
    const token = jwt.sign(email,SECRET_KEY)
    let link = FRONT_END_URL+email+"/"+token
    console.log(link)
    sendMail(email,link)
    resp.send({message : "password reset link is sent to your email"})
  }
  else {
    resp.send({message : "user not registered"})
  }

})

app.post("/sign-up",async(req,resp) => {
  const {email,password} = req.body;
  const createUser = await client.db("forgot-password").collection("users").insertOne({email , password})
  resp.send({message : "successfully registered new user"})
})

app.post("/sign-in",async(req,resp) => {
  console.log("inside signin")
  const {email, password} = req.body;
  const user = await client.db("forgot-password").collection("users").findOne({email : email})
  if(password == user.password){
    resp.send({message : "Login Successful"})
  }
  else {
    resp.send({message : "Invalid user name or password"})
  }

})

app.post("/reset-password", async(req,resp) => {
  const {email, password} = req.body;
  const user = await client.db("forgot-password").collection("users").updateOne({email : email},{$set : {password : password}})
  resp.send({message : "password changed successfully"});
})
app.listen(PORT, ()=> console.log("Server started "))



