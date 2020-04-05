const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Task = require('../model/task');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userSchema = new mongoose.Schema({
        name: { type: String },
        age: { type: Number },
        email:{
            type:String,
            unique: true,
            required: true,
            validate(value){
                if(!validator.isEmail(value)){
                    throw new Error('Email is not valid')
                }
            }
        },
        password:{
            type: String,
            required: true,
            trim: true,
            minlength: 7,
            validate(value){
                if(value.includes('password')){
                    throw new Error('Your password must not include "password"');
                }
            }
        },
        tokens: [{
            token: {
                type: String,
                required: true
            }
        }],
        avatar: {
            type: Buffer
        }
}, {
    timestamps: true
});

userSchema.virtual('task', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'user'
}); 

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject;
}

// Generating User Token 
userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}


// Finding User  y email and comparing hashed password Function for Login
userSchema.statics.findByCredentials = async (email, password) =>{
    const user = await User.findOne({email})
    if(!user) throw new Error('Unable to Login');

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error('Unable to Login');

    return user;
}


// Hashing the plain text password
userSchema.pre('save', async function (next){
    const user = this;
    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next();
});

// Delete user task when user is removed
userSchema.pre('remove', async function (next){
    const user = this;
    await Task.deleteMany({ user: user._id });

    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;