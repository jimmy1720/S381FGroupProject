# Budget Tracker - Web Application

## 1. Project Information
**Project Name**: Budget Tracker  
**Group**: Grp 16  
### Team Members:
- Alan ([Student 1 SID])
- Abel (13032428) 
- Ashwin-Sundar (13139477)
- Thomas (13035781)
- Jimmy (13030411)

## 2. Project File Structure

### Server (`/server/`)
#### `app.js` - Main Application File
- **Purpose**: Central controller that coordinates all application components
- **Functionality**: 
  - Starts Express server and handles HTTP requests
  - Configures middleware (sessions, authentication, parsing)
  - Manages database connection with MongoDB
  - Implements Passport.js authentication strategies
  - Coordinates Facebook & Google OAuth integration
  - Routes requests to appropriate handlers
  - Serves static files and EJS templates

#### `package.json` - Dependencies Management
**Core Dependencies:**
- `express` - Web framework for routing and middleware
- `mongoose` - MongoDB object modeling and database operations
- `bcrypt` - Password hashing and security
- `passport` - Authentication middleware
- `passport-facebook` - Facebook OAuth integration
- `passport-google-oauth20` - Google OAuth integration
- `express-session` - User session management
- `connect-mongodb-session` - Session storage in MongoDB
- `dotenv` - Environment variable management
- `ejs` - Template engine for dynamic views
- `morgan` - HTTP request logging

#### Models (`/server/models/`)
- `User.js` - User accounts and authentication
  - Local & OAuth user management
  - Password hashing and validation
  - Session and profile data
- `Transaction.js` - Financial transactions
  - Income and expense records
  - Category association
  - User ownership and tracking
- `BudgetCategory.js` - Budget organization
  - Custom spending categories
  - Budget limits and tracking
  - User-specific organization

#### Routes (`/server/routes/`)
- `authRoutes.js` - Authentication endpoints (login, register, logout, OAuth)
- Additional CRUD routes for transactions and budgets

#### Controllers (`/server/controllers/`)
- `authController.js` - Business logic for authentication
- Additional controllers for transaction and budget operations

#### Middleware (`/server/middleware/`)
- `authMiddleware.js` - Authentication and session validation
- `validationMiddleware.js` - Input validation and sanitization

#### Config (`/server/config/`)
- `db.js` - Database connection configuration and management

### Client (`/client/`)
#### Public (`/client/public/`)
- `css/styles.css` - Application styling and responsive design
- Additional static assets (images, client-side JavaScript)

#### Views (`/client/views/`)
- `index.ejs` - Homepage and landing
- `login.ejs` - User authentication with OAuth options
- `register.ejs` - New user registration
- `dashboard.ejs` - Main application interface (protected)
- `profile.ejs` - User profile management
- `settings.ejs` - Application settings
- `404.ejs` - Custom error page

## 3. Cloud-Based Server URL
**Live Application**: [Deployed URL Here]

## 4. Operation Guides

### User Authentication Flow

#### Registration Process:
1. **Navigate to**: `/register`
2. **Required Information**:
   - Username (3-30 characters)
   - Email (valid format required)
   - Password (8+ characters)
   - Confirm Password
3. **Submit Form** → Automatic redirect to login page

#### Login Process:
1. **Navigate to**: `/login`
2. **Authentication Methods**:
   - **Local Login**: Username/Email + Password
   - **Facebook Login**: OAuth integration (when configured)
   - **Google Login**: OAuth integration (when configured)
3. **Successful Login** → Redirect to `/dashboard`

#### Test Accounts:
Username: TBD
Email: TBD
Password: TBD

### CRUD Operations

#### Transactions Management:
- **Create**: Add new income/expense transactions
- **Read**: View transaction history and summaries  
- **Update**: Modify existing transaction details
- **Delete**: Remove transactions from records

#### Budget Categories:
- **Create**: Define custom spending categories
- **Read**: View category budgets and spending
- **Update**: Adjust budget limits and names
- **Delete**: Remove unused categories

### RESTful API Endpoints

#### Authentication APIs:
```http
POST /register          # Create new user account
POST /login             # User login
GET  /logout            # User logout
GET  /auth/facebook     # Facebook OAuth
GET  /auth/google       # Google OAuth
GET  /user/info         # Get current user information
```

### CURL Testing Commands:

### User Registration:
```bash
curl -X POST http://localhost:8099/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","confirm_password":"password123"}'
```
### User Login
```bash
curl -X POST http://localhost:8099/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```
### Get User Info
```bash
curl -X GET http://localhost:8099/user/info \
  -H "Cookie: [session-cookie-from-login]"
```

## 5. Setup & Installation

### Prerequisites:
* Node.js(v14 or higher)
* MongoDB Atlas account
* (Optional) Facebook/Google OAuth apps

### Quick Start:
```bash
# 1. Clone repository
git clone [repository-url]
cd Budget_Tracker

# 2. Install server dependencies
cd server
npm install

# 3. Start application
npm start

# 4. Access application
# Open http://localhost:8099 in browser
```
### Environment Configuration
This included `.env` file contains:
* MongDB connection string
* Session secret Key
* OAuth credentials (Facebook/Google - optional)

## 6. Development Notes

### Architecture Pattern:
MVC Structure:
📱 User Request → 
🛣️ Routes (routes/) → 
👨‍💼 Controllers (controllers/) → 
💾 Models (models/) → 
🗄️ Database (MongoDB)

## Features Implemented:
* ✅ User registration & authentication
* ✅ Session management with MongoDB storage
* ✅ Password security with bcrypt hashing
* ✅ EJS templating and dynamic views
* ✅ Protected route middleware
* ✅ OAuth infrastructure (ready for credentials)
* ✅ Error handling and validation

## Features Planned:
* 🔄 Transaction CRUD operations
* 🔄 Budget category management
* 🔄 Financial reporting and analytics
* 🔄 Data visualization charts
* 🔄 Export functionality

Last Updated: [10-11-2025]
Version: 1.0.0
Status Developement - Core Authentication Complete
