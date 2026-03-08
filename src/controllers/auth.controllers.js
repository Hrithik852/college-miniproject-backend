const { User, Student, Faculty, HOD, Principal } = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

const registerController = async (req, res) => {
    try {
        let { username, email, password, role, department, csSection, batch, collegeId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Auto-derive Batch and CollegeID for Students from Email if not provided
        if (role === 'student') {
            const match = email.match(/^adr(\d{2})(cs|ec|ee|ds|me)(\d{2,3})@cea\.ac\.in$/i);
            if (match) {
                if (!batch) batch = `20${match[1]}`; // e.g., '23' -> '2023'
                if (!collegeId) collegeId = `${match[2].toUpperCase()}${match[3]}`; // e.g., 'cs073' -> 'CS073'
            }
        }

        let newUser;
        if (role === 'student') {
            newUser = new Student({ username, email, password, role, department, csSection, batch, collegeId });
        } else if (role === 'faculty') {
            newUser = new Faculty({ username, email, password, role, department, collegeId });
        } else if (role === 'hod') {
            const existingHOD = await User.findOne({ role: 'hod', department });
            if (existingHOD) {
                return res.status(400).json({ message: `An HOD already exists for the ${department.toUpperCase()} department.Contact the principal` });
            }
            newUser = new HOD({ username, email, password, role, department, collegeId });
        } else if (role === 'principal') {
            newUser = new Principal({ username, email, password, role, collegeId });
        } else {
            return res.status(400).json({ message: 'Invalid role provided' });
        }

        await newUser.save();

        const token = generateToken(newUser);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department,
                csSection: newUser.csSection
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
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

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

const logoutController = async (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const googleAuthController = async (req, res) => {
    try {
        const { accessToken, role, department, csSection, username } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        // Fetch user info from Google
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!googleRes.ok) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }

        const { email, name } = await googleRes.json();

        // Regex rules — same as User model
        const studentRegex = /^adr(2[2-5])(cs|ec|ee|ds|me)(\d{2,3})@cea\.ac\.in$/i;
        const staffRegex   = /^[a-z0-9._%+-]+@cea\.ac\.in$/i;

        if (!staffRegex.test(email)) {
            return res.status(403).json({ message: 'Only institutional CEA email accounts (@cea.ac.in) are allowed' });
        }

        const isStudent = studentRegex.test(email);

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            const token = generateToken(user);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.status(200).json({
                message: 'Login successful',
                token,
                user: { id: user._id, username: user.username, email: user.email, role: user.role, department: user.department }
            });
        }

        // --- New user ---
        if (isStudent) {
            const match = email.match(/^adr(\d{2})(cs|ec|ee|ds|me)(\d{2,3})@cea\.ac\.in$/i);
            const emailPrefix  = match[2].toLowerCase();
            const derivedBatch = `20${match[1]}`;
            const derivedCollegeId = `${match[2].toUpperCase()}${match[3]}`;

            const deptMap = { cs: 'cse', ec: 'ece', ee: 'eee', me: 'mech', ds: 'cse' };
            const derivedDept = deptMap[emailPrefix] || 'cse';
            const derivedSection = emailPrefix === 'ds' ? 'DS' : '';

            const derivedUsername = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_');

            const newStudent = new Student({
                username: derivedUsername,
                email,
                password: randomBytes(32).toString('hex'),
                role: 'student',
                department: derivedDept,
                csSection: derivedSection,
                batch: derivedBatch,
                collegeId: derivedCollegeId
            });
            await newStudent.save();

            const token = generateToken(newStudent);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.status(201).json({
                message: 'Account created successfully',
                token,
                user: { id: newStudent._id, username: newStudent.username, email: newStudent.email, role: newStudent.role, department: newStudent.department }
            });
        }

        // Non-student: need role + dept from client
        if (!role) {
            return res.status(200).json({
                needsMoreInfo: true,
                email,
                name,
                message: 'Please select your role to complete registration'
            });
        }

        if (!['faculty', 'hod', 'principal'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided' });
        }

        if (role !== 'principal' && !department) {
            return res.status(400).json({ message: 'Department is required' });
        }

        if (role === 'hod') {
            const existingHOD = await User.findOne({ role: 'hod', department });
            if (existingHOD) {
                return res.status(400).json({ message: `An HOD already exists for the ${department.toUpperCase()} department` });
            }
        }

        const derivedUsername = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_');
        const commonData = { username: derivedUsername, email, password: randomBytes(32).toString('hex'), role };

        let newUser;
        if (role === 'faculty')        newUser = new Faculty({ ...commonData, department });
        else if (role === 'hod')       newUser = new HOD({ ...commonData, department });
        else if (role === 'principal') newUser = new Principal({ ...commonData });

        await newUser.save();

        const token = generateToken(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        return res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role, department: newUser.department }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerController,
    loginController,
    logoutController,
    changePasswordController,
    googleAuthController
};
