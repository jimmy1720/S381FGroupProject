# Budget Tracker - Web Application

## 📋 Project Overview

Budget Tracker is a comprehensive web application designed to help users manage their personal finances effectively. The application provides intuitive tools for tracking income and expenses, categorizing transactions, and monitoring budget goals.

**Live Application:** 🌐 [Budget Tracker](https://budget-tracker-grp16-s381f.onrender.com)

## 👥 Team Members

- Alan ([Student 1 SID])
- Abel (13032428)
- Ashwin-Sundar (13139477)
- Thomas (13035781)
- Jimmy (13030411)

## 🏗️ System Architecture

### Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Passport.js (Local, Facebook, Google OAuth)
- **Frontend:** EJS Templates, CSS3
- **Session Management:** Express-session with MongoDB storage
- **Security:** bcrypt for password hashing

### Project Structure

```
Budget_Tracker/
├── server/
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   └── BudgetCategory.js  
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── PublicApi.js
│   │   ├── budgetRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── apiRoutes.js
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── budgetController.js
│   │   ├── categoryController.js
│   │   ├── dashboardController.js
│   │   ├── passwordController.js
│   │   └── transactionController.js
│   ├── middleware/      # Custom middleware
│   │   └── authMiddleware.js
│   ├── config/          # Configuration files
│   │   └── db.js
│   └── app.js          # Main application file
└── client/
    ├── public/          # Static assets
    │   └── css/
    │       └── styles.css
    └── views/           # EJS templates
        ├── index.ejs
        ├── login.ejs
        ├── register.ejs
        ├── dashboard.ejs
        ├── profile.ejs
        ├── settings.ejs
        └── 404.ejs
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- (Optional) Facebook/Google OAuth apps for social login

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/jimmy1720/S381FGroupProject.git
cd Budget_Tracker

# 2. Install dependencies
cd server
npm install

# 3. Environment configuration
# Create a .env file with the following variables:
# MONGODB_URI=your_mongodb_connection_string
# SESSION_SECRET=your_session_secret
# FACEBOOK_APP_ID=your_facebook_app_id
# FACEBOOK_APP_SECRET=your_facebook_app_secret
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# 4. Start the application
npm start

# 5. Access the application
# Open http://localhost:8099 in your browser
```

## 🔑 Authentication & Security

### Registration Process

1. Navigate to `/register`
2. Provide required information:
   - Username (3-30 characters)
   - Email (valid format required)
   - Password (8+ characters)
   - Confirm Password
3. Submit form → Automatic redirect to login page

### Login Options

- Local Authentication: Username/Email + Password
- Facebook OAuth: Social login integration
- Google OAuth: Social login integration

### Security Features

- Password hashing with bcrypt
- Session management with MongoDB storage
- Protected route middleware
- Input validation and sanitization

## 📊 Core Features

### Transaction Management

- ✅ Create income and expense transactions
- ✅ Read transaction history with filtering
- ✅ Update existing transaction details
- ✅ Delete transactions
- ✅ Categorize transactions

### Budget Categories

- ✅ Create custom spending categories
- ✅ Set budget limits per category
- ✅ Track spending against budgets
- ✅ Visual budget progress indicators

### Financial Insights

- 📈 Income vs Expense overview
- 🏷️ Category-wise spending analysis
- 📅 Time-period filtering
- 💰 Net balance tracking

## 🔌 RESTful API Reference

### Transaction API Endpoints

```
GET    /public/api/transactions          # Get all transactions
POST   /public/api/transactions          # Create new transaction
PUT    /public/api/transactions/:id      # Update transaction
DELETE /public/api/transactions/:id      # Delete transaction
```

## 🛠️ API Testing with cURL

### Transaction Operations

1. **Get All Transactions**

```bash
curl -X GET https://budget-tracker-grp16-s381f.onrender.com/public/api/transactions
```

2. **Create a New Transaction**

```bash
curl -X POST https://budget-tracker-grp16-s381f.onrender.com/public/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "type": "expense",
    "categoryName": "Food",
    "description": "Groceries",
    "date": "2024-01-15"
  }'
```

3. **Update a Transaction**

```bash
curl -X PUT https://budget-tracker-grp16-s381f.onrender.com/public/api/transactions/[ID] \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150,
    "description": "Lunch with friends",
    "categoryName": "Dining"
  }'
```

4. **Delete a Transaction**

```bash
curl -X DELETE https://budget-tracker-grp16-s381f.onrender.com/public/api/transactions/[ID]
```

## Getting Started

1. Register a new account or use existing test credentials
2. Login to access your personal dashboard
3. Add Transactions using the form or API
4. Create Budget Categories to organize spending
5. Monitor Progress through the dashboard analytics

### Test Accounts

- **Username:** demo_user
- **Email:** demo@example.com
- **Password:** demo123

## 🔄 Development Status

### ✅ Completed Features

- User registration and authentication
- Session management with MongoDB storage
- Password security with bcrypt hashing
- EJS templating and dynamic views
- Protected route middleware
- OAuth infrastructure (Facebook & Google)
- Transaction CRUD operations
- RESTful API endpoints
- Error handling and validation

## 🐛 Troubleshooting

### Common Issues

- **Database Connection Error**
  - Verify MongoDB connection string in .env
  - Check network connectivity to MongoDB Atlas

- **Session Not Persisting**
  - Ensure session secret is set in .env
  - Verify MongoDB session store configuration

- **OAuth Login Failures**
  - Check OAuth app credentials in .env
  - Verify callback URLs in OAuth provider settings

### Debug Mode

Enable debug logging by setting `DEBUG=true` in your .env file for detailed application logs.

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Include API documentation for new endpoints
- Test all endpoints with cURL commands

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team via university channels

**Last Updated:** November 2024  
**Version:** 1.0.0  
**Status:** Production Ready - Core Features Complete

**Built with ❤️ by Group 16**
