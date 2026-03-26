const jwt= require("jsonwebtoken");

const SECRET = "MY_SECRET_KEY";

module.exports = (token)=>{
    try{
        const decoded = jwt.verify(token,SECRET);
        return decoded;
    }
    catch(err)
    {
        return null;
    }
};