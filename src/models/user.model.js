const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BaseUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'username required'],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        validate: {
            validator: function(v) {
                if (this.role === 'student') {
                    return /^adr(2[2-5])(cs|ec|ee|ds|me)(\d{2,3})@cea\.ac\.in$/.test(v);
                }
                // For faculty, hod, principal
                return /^[a-z0-9._%+-]+@cea\.ac\.in$/.test(v);
            },
            message: props => `${props.value} is not a valid email format for the selected role!`
        }
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    institution: { type: String, default: '' },
    collegeId: { type: String, default: '' },
    password: {
        type: String,
        required: [true, 'password required'],
        minlength: [6, 'password must be at least 6 characters']
    },
    role: {
        type: String,
        required: [true, "role required"],
        enum: ['student', 'faculty', 'hod', 'principal'] 
    },
    department: {
        type: String,
        required: function() {
            return this.role !== 'principal';
        },
        enum: {
            values: ['cse', 'mech', 'eee', 'ece', ''],
            message: '{VALUE} is not a valid department'
        }
    },
    csSection: {
        type: String,
        enum: {
            values: ['CS A', 'CS B', 'DS', ''],
            message: '{VALUE} is not a valid CS section'
        },
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    }
}, { discriminatorKey: 'role', collection: 'users', timestamps: true }); 
// Hash password before saving
BaseUserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});
// Method to compare password
BaseUserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', BaseUserSchema);

const Student = User.discriminator('student', new mongoose.Schema({
    batch: {
        type: String, // e.g., '2022-2026' or 'CS-B'
        required: [true, 'batch is required']
    }
}));
const Faculty = User.discriminator('faculty', new mongoose.Schema({}));
const HOD = User.discriminator('hod', new mongoose.Schema({}));
const Principal = User.discriminator('principal', new mongoose.Schema({}));

module.exports = { User, Student, Faculty, HOD, Principal };
