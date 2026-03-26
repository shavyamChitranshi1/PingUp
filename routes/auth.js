const express= require("express");
const router= express.Router();
const bcrypt= require("bcrypt");
const jwt=require("jsonwebtoken");
const User=require("../models/users");

const SECRET = "MY_SECRET_KEY";

router.post("/signup",async (req, res )=>{
    try{
        const {username,email,password} = req.body;
        const existing = await User.findOne({email});
        if(existing)
        {
            return res.status(400).json({msg:"User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password,10);
        
        const user = await User.create({
            username,
            email,
            password:hashedPassword,
        });
        res.json({msg:"Signup successful"});
    }
    catch(err)
    {
        res.status(500).json({error:err.message});
    }
}) 


router.post("/login",async(req,res)=>{
    try{
    const {email,password}= req.body;
    const existing=await User.findOne({email});
    if(!existing)
    {
        return res.status(400).json({error: "user not found"});
    }
        const isMatch=await bcrypt.compare(password,existing.password);
        if(!isMatch)
            {
                return res.status(400).json({msg:"Wrong password"});
            }
            const token= jwt.sign(
                {userId: existing._id,username:existing.username},
                SECRET,
                {expiresIn:"1d"}
            );
            console.log(existing);
            res.json({token});
}
catch(err)
{
    
    res.status(500).json({error:err.message});
}
});


module.exports = router;