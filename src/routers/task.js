const express = require('express');
const Task = require('../model/task');
const router = new express.Router;
const auth = require('../middleware/auth');


// Create Task
router.post('/api/add-task', auth, async (req, res) => {
    //const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        user: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(500).send(error);
    }

});

// Fetching all Tasks GET /tasks
// Filtering Tasks GET /tasks?completed=true
// Paginating Tasks GET /tasks?limit=10&skip=0
// Sorting Tasks GET /task?createdBy:desc

router.get('/api/tasks', auth, async (req, res) => {
    const user = req.user._id;
    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);
    const { completed, sortBy } = req.query;
    const sort = {};
    try {
        if (completed) {
            const tasks = await Task.find({ completed });
            res.json({
                message: 'Success',
                data: tasks
            });
        } else if(sortBy) {
            // Sorting
            const sortBySplit = sortBy.split(':')
            sort[sortBySplit[0]] = sortBySplit[1] === 'desc' ? -1 : 1;
            const tasks = await Task.find({ user })
                .sort([sortBySplit])

            if (!tasks) return res.status(404).json({ message: 'Task not Found' });
            res.json({
                message: 'Success',
                data: tasks
            });
        } else{
            const tasks = await Task.find({ user })
                .limit(limit)
                .skip(skip)

            if (!tasks) return res.status(404).json({ message: 'Task not Found' });
            res.json({
                message: 'Success',
                data: tasks
            });
        }
        

    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});




//Fetching single task
router.get('/api/task/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, user: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not Found' });
        res.json({
            message: 'Success',
            data: task
        });
    } catch (error) {
        res.status(500).send(error)
    }
});

// Updating Task
router.patch('/api/task/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowUpdates = ['title', 'Description', 'completed'];
    const isValidOperation = updates.every((updates) => allowUpdates.includes(updates));
    if (!isValidOperation) return res.status(400).send({ error: 'Invalid Update ' });
    try {
        const user = req.user._id;
        const task = await Task.findOne({ _id: req.params.id, user });

        if (!task) return res.status(404).json({ message: 'Task not Found' });

        updates.forEach((update) => task[update] = req.body[update]);

        res.json({
            message: 'Success',
            data: task
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

// Delete Task from Database
router.delete('/api/task/:id', auth, async (req, res) => {
    const user = req.user._id;
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({
            message: 'Your Task deleted Successfully',
            data: task
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;