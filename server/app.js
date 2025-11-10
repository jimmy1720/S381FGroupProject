const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoDBStore = require('connect-mongodb-session')(session);
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

const { isLoggedIn, setupPassportSerialization } = require('./middleware/authMiddleware');
const User = require('./models/User');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Connect to MongoDB (replace with our connection string)
MongoDBStore.connect(/*<Connection string>*/, {userNewUrlParser: true, useUnifiedTopplogy: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas and Models
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    resetToken: String,
    resetTokenExpiry: Date,
});
const User = mongoose.model('User', userSchema);

const categorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    type: { type: String, enum: ['expense', 'income'] },
});
const Category = mongoose.model('Category', categorySchema);
  
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    amount: Number,
    description: String,
    date: Date,
    type: { type: String, enum: ['expense', 'income'] },
});
const Transaction = mongoose.model('Transaction', transactionSchema);
  
const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    amount: { type: Number, min: 0 }, // Validation for positive amount
    period: { type: String, enum: ['monthly', 'yearly'] },
    startDate: Date,
});
const Budget = mongoose.model('Budget', budgetSchema);
  
// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8099;

// Set up MongoDB session store
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions',
});

store.on('error', function(error) {
    console.error('Session store error:', error);
});

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client/views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(path.join(__dirname, '../client/public')));

// Middleware to check authentication via session
const authenticateSession = (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// Authentication Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = new User({ username, email, password: hashedPassword });
      await user.save();
      req.session.userId = user._id;
      res.status(201).json({ userId: user._id });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
      res.status(500).json({ error: 'Server error' });
    }
});
  
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    res.json({ message: 'Logged in' });
});
  
app.post('/api/auth/logout', (req, res) => {
    req.session = null;
    res.json({ message: 'Logged out' });
});

// Password Recovery
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
  
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
    await user.save();
  
    // Send email (configure nodemailer transport)
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    const mailOptions = {
      from: 'your_email@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `Reset your password using this token: ${resetToken}`,
    };
    transporter.sendMail(mailOptions, (err) => {
      if (err) return res.status(500).json({ error: 'Email error' });
      res.json({ message: 'Reset email sent' });
    });
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
});

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    console.log('✅ Facebook OAuth configured');
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:8099/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'emails']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ facebookId: profile.id });
            
            if (user) {
                return done(null, user);
            }
            
            // Check if user exists by email
            if (profile.emails && profile.emails[0].value) {
                user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
                if (user) {
                    user.facebookId = profile.id;
                    user.type = 'facebook';
                    await user.save();
                    return done(null, user);
                }
            }
            
            // Create new user
            let username = `fb_${profile.id}`;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `fb_${profile.id}_${counter}`;
                counter++;
            }
            
            user = new User({
                username: username,
                email: profile.emails ? profile.emails[0].value.toLowerCase() : null,
                facebookId: profile.id,
                displayName: profile.displayName,
                type: 'facebook'
            });
            
            await user.save();
            return done(null, user);
            
        } catch (err) {
            console.error('Facebook OAuth error:', err);
            return done(err, null);
        }
    }));
} else {
    console.log('⚠️  Facebook OAuth not configured');
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth configured');
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8099/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                return done(null, user);
            }
            
            // Check if user exists by email
            if (profile.emails && profile.emails[0].value) {
                user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
                if (user) {
                    user.googleId = profile.id;
                    user.type = 'google';
                    await user.save();
                    return done(null, user);
                }
            }
            
            // Create new user
            let username = `google_${profile.id}`;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `google_${profile.id}_${counter}`;
                counter++;
            }
            
            user = new User({
                username: username,
                email: profile.emails ? profile.emails[0].value.toLowerCase() : null,
                googleId: profile.id,
                displayName: profile.displayName,
                type: 'google'
            });
            
            await user.save();
            return done(null, user);
            
        } catch (err) {
            console.error('Google OAuth error:', err);
            return done(err, null);
        }
    }));
} else {
    console.log('⚠️  Google OAuth not configured');
}

// Passport Middleware Serialization
setupPassportSerialization(passport);

// Import routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Home', user: req.user });
});

app.get('/dashboard', isLoggedIn, (req, res) => {
    res.render('dashboard', { user: req.user });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).render('error', { error: 'Something went wrong!' });
});

// Connect to DB and start server
const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Database connected successfully');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Categories Endpoints (Budget Categories CRUD with Validation)
app.post('/api/categories', authenticateSession, async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Missing fields' });
  
    const category = new Category({ userId: req.session.userId, name, type });
    await category.save();
    res.status(201).json({ categoryId: category._id });
});
  
app.get('/api/categories', authenticateSession, async (req, res) => {
    const { type } = req.query;
    const filter = { userId: req.session.userId };
    if (type) filter.type = type;
    const categories = await Category.find(filter);
    res.json(categories);
});
  
app.put('/api/categories/:id', authenticateSession, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const category = await Category.findOneAndUpdate(
        { _id: id, userId: req.session.userId },
        { name },
        { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
});
  
app.delete('/api/categories/:id', authenticateSession, async (req, res) => {
    const { id } = req.params;
    // Check for linked transactions or budgets before delete
    const transactions = await Transaction.findOne({ categoryId: id });
    const budgets = await Budget.findOne({ categoryId: id });
    if (transactions || budgets) return res.status(400).json({ error: 'Category in use' });
  
    const category = await Category.findOneAndDelete({ _id: id, userId: req.session.userId });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.status(204).send();
});
  
// Transactions Endpoints (CRUD with Filters)
app.post('/api/transactions', authenticateSession, async (req, res) => {
    const { amount, description, date, categoryId, type } = req.body;
    if (!amount || !date || !categoryId || !type) return res.status(400).json({ error: 'Missing fields' });
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
  
    const category = await Category.findOne({ _id: categoryId, userId: req.session.userId });
    if (!category) return res.status(404).json({ error: 'Category not found' });
  
    const transaction = new Transaction({
        userId: req.session.userId,
        categoryId,
        amount,
        description,
        date: new Date(date),
        type,
    });
    await transaction.save();
    res.status(201).json({ transactionId: transaction._id });
});
  
app.get('/api/transactions', authenticateSession, async (req, res) => {
    const { startDate, endDate, categoryId, type, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.session.userId };
    if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;
  
    const transactions = await Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    res.json(transactions);
});
  
app.put('/api/transactions/:id', authenticateSession, async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Allow partial updates
    if (updates.amount && updates.amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
  
    const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId: req.session.userId },
        updates,
        { new: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
});
  
app.delete('/api/transactions/:id', authenticateSession, async (req, res) => {
    const { id } = req.params;
    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.session.userId });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).send();
});
  
// Budgets Endpoints (CRUD with Limit Validation)
app.post('/api/budgets', authenticateSession, async (req, res) => {
    const { categoryId, amount, period, startDate } = req.body;
    if (!categoryId || !amount || !period || !startDate) return res.status(400).json({ error: 'Missing fields' });
    if (amount <= 0) return res.status(400).json({ error: 'Budget amount must be positive' });
  
    const category = await Category.findOne({ _id: categoryId, userId: req.session.userId });
    if (!category) return res.status(404).json({ error: 'Category not found' });
  
    const budget = new Budget({
        userId: req.session.userId,
        categoryId,
        amount,
        period,
        startDate: new Date(startDate),
    });
    await budget.save();
    res.status(201).json({ budgetId: budget._id });
});
  
app.get('/api/budgets', authenticateSession, async (req, res) => {
    const budgets = await Budget.find({ userId: req.session.userId });
    // Optionally, calculate spent/remaining here for each
    res.json(budgets);
});
  
app.put('/api/budgets/:id', authenticateSession, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (updates.amount && updates.amount <= 0) return res.status(400).json({ error: 'Budget amount must be positive' });
  
    const budget = await Budget.findOneAndUpdate(
        { _id: id, userId: req.session.userId },
        updates,
        { new: true }
    );
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
});
  
app.delete('/api/budgets/:id', authenticateSession, async (req, res) => {
    const { id } = req.params;
    const budget = await Budget.findOneAndDelete({ _id: id, userId: req.session.userId });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.status(204).send();
});
  
// Dashboard Overview Endpoint (Fetch Income, Expenses, Budgets with Aggregations)
app.get('/api/dashboard', authenticateSession, async (req, res) => {
    const { period = 'monthly', year = new Date().getFullYear(), month } = req.query;
    const userId = req.session.userId;
  
    // Date range for the period (simplified for monthly; extend for yearly)
    let startDate = new Date(year, month ? month - 1 : 0, 1);
    let endDate = new Date(year, month ? month : 12, 0);
  
    // Aggregate income and expenses
    const incomeAgg = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'income', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalIncome: { $sum: '$amount' } } },
    ]);
    const expensesAgg = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
    ]);
  
    const totalIncome = incomeAgg[0]?.totalIncome || 0;
    const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
    const netSavings = totalIncome - totalExpenses;
  
    // Fetch budgets with spent calculations
    const budgets = await Budget.find({ userId });
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
        const spentAgg = await Transaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), categoryId: budget.categoryId, type: 'expense', date: { $gte: budget.startDate } } }, // Adjust date based on period
            { $group: { _id: null, spent: { $sum: '$amount' } } },
        ]);
        const spent = spentAgg[0]?.spent || 0;
        return { ...budget.toObject(), spent, remaining: budget.amount - spent };
        }));
  
    res.json({
        summary: { totalIncome, totalExpenses, netSavings },
        budgets: budgetsWithSpent,
    });
});
