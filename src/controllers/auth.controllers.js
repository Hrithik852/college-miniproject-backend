const { User, Student, Faculty } = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

const registerController = async (req, res) => {
    try {
        const { username, email, password, role, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        let newUser;
        if (role === 'student') {
            newUser = new Student({ username, email, password, role, department });
        } else if (['faculty', 'hod', 'principal'].includes(role)) {
            newUser = new Faculty({ username, email, password, role, department });
        } else {
            return res.status(400).json({ message: 'Invalid role provided' });
        }

        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const loginController = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or username

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerController,
    loginController
};
