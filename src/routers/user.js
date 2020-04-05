const express = require('express');
const router = new express.Router();
const User = require('../model/user');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth');

// Creating User
router.post('/api/reg-user',  async (req, res)=>{
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        await user.save()
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
    
});


// Signing User
router.post('/api/login', async(req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token});
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Invalid Login Details'});
    }
});

// Uploading of Profile Picture
const upload = multer({
    limits: { fileSize: 1000000 },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload a jpg, jpeg or png file'));
        }
        cb(undefined, true);
    }
});

router.post('/api/me/avatar', auth, upload.single('avatar'), async (req, res) =>{
    const incomingAvatar = req.file.buffer;
    const user = req.user;
    const modifiedAvatar = await sharp(incomingAvatar).resize({width: 250, height: 250 }).png().toBuffer();
    user.avatar = modifiedAvatar;
    await user.save();
    res.status(200).json({
        message: 'Profile image uploaded successfully',
        data: user
    });
}, (error, req, res, next ) =>{
    res.status(500).json({ error: error.message});
});

// DeletingProfile Picture
router.delete('/api/me/avatar', auth, async(req, res)=>{
    const user = req.user
    user.avatar = undefined;
    await user.save();
    res.status(200).json({
        message: 'Profile image Deleted successfully',
        data: user
    });
});

//Get Profile picture by ID ( serving it up to the browser to view image)
router.get('/api/:id/avatar', async (req, res) =>{
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if(!user || !user.avatar) throw new Error('profile pics can not be found!');

        res.set('Content-Type', 'image/png');
        res.send(user.avatar)
    } catch (error) {
        res.status(500).send({message: 'Internal Error'});
    }
})

// Loging Out user
router.post('/api/logoutAll', auth, async(req, res)=>{
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).json({
            status: 'Success',
            message: 'Successfully Logged out from all Devices'
        })
    } catch (error) {
        res.status(500).send({message: 'Internal Error'});
    }
})

router.post('/api/logout', auth, async (req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token !== req.token
        })
        await req.user.save();
        res.status(200).json({
            status: 'Success',
            message: 'Successfully Logged out'
        })
    } catch (error) {
        res.status(500).send({message: 'Internal Error'})
    }
});

// Fetching Profile
router.get('/api/users/me', auth,  async (req, res)=>{
    const user = await req.user
    res.json({
        status: 'Success',
        data: user
    });
});



// Fetching single user
router.get('/api/user/:id', auth, async (req, res)=>{
    const _id = req.params.id;

    try {
        const user = await User.findById(_id)
        if(!user){
            return res.status(404).send({error: 'User not found'})
        }
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Updating my Profile
router.patch('/api/user/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body);
    const allowUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((updates) => allowUpdates.includes(updates));
    if(!isValidOperation) return res.status(400).send({error: 'Invalid Update '});
    try {
        const user = await req.user;

        updates.forEach((update) => user[update] = req.body[update])
        await user.save();
        if(!user) return res.status(404).send();
        res.json({
            message: 'Success',
            data: user
        });
    } catch (error) {
        res.status(404).send(error);
    }
});

/* Updating User
router.patch('/api/user/:id', auth, async (req, res)=>{
    const updates = Object.keys(req.body);
    const allowUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((updates) => allowUpdates.includes(updates));
    if(!isValidOperation) return res.status(400).send({error: 'Invalid Update '});
    try {
        const user = await User.findById(req.params.id);

        updates.forEach((update) => user[update] = req.body[update])
        await user.save();
        if(!user) return res.status(404).send();
        res.send(user);
    } catch (error) {
        res.status(404).send(error);
    }
}); */

// Deleting of your profile
router.delete('/api/user/me', auth, async (req, res)=>{
    try {
        await req.user.remove();
        res.json({
            data: req.user, 
            message: 'Your Profile deleted Successfully'})
    } catch (error) {
        res.status(500).send(error);
    }
});

/* Delete User fom DB
router.delete('/api/user/:id', auth, async (req, res)=>{
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user) return res.status(404).send({error: 'User not Found'});
        res.send(user, 'User deleted Successfully')
    } catch (error) {
        res.status(500).send(error)
    }
}); */

module.exports = router;