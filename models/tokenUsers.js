const mongoose = require("mongoose");


const tokenUserSchema = new mongoose.Schema({
    availableTokens:{type:Number,required: true,default:0},
    inputTokens:{type:Number,required: true,default:0},
    outputTokens:{type:Number,required: true,default:0},
    userId:{type:String,required:true, unique: true},
    expireAt: {
        type: Date,
        required: true,
        // 0 seconds means documents will expire immediately
      },
    createdAt: { type: Date, default: Date.now},
    
    
})

const tokenUsersModel = mongoose.model("tokenUsers", tokenUserSchema);

module.exports = tokenUsersModel;