const express = require('express');
// require('./src/db/database');
require('dotenv').config();
const connectDB = require('./src/db/database');
const userRouter = require('./src/routers/user');
const taskRouter = require('./src/routers/task');


// Initializing Express Framework
const app = express();

// Connecting DB
connectDB();

// Defining Port
const port = process.env.PORT;

app.use(express.json());

// My Routers
app.use(userRouter);
app.use(taskRouter);





app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});

