# TaskFlow - Role-Based Project & Task Management System

A comprehensive full-stack project and task management application built with React, Redux, Node.js, Express, and PostgreSQL. Features role-based access control with three user roles: Admin, Manager, and User.

## 🚀 Features

### Authentication & Authorization

- JWT-based authentication with HTTP-only cookies
- Role-based access control (Admin, Manager, User)
- Secure password hashing with bcrypt
- Session persistence across browser refreshes

### Role-Based Dashboards

- **Admin Dashboard**: Complete system overview, user management, all projects/tasks statistics
- **Manager Dashboard**: Team overview, assigned projects, task management
- **User Dashboard**: Personal tasks, assigned projects, progress tracking

### User Management (Admin Only)

- Create, read, update, delete users
- Role assignment
- Account status management (active/inactive)
- Search and filter users

### Project Management

- Create and manage projects
- Assign project managers
- Add/remove team members
- Project status tracking (Planning, Active, On Hold, Completed, Cancelled)
- Priority levels (Low, Medium, High, Critical)

### Task Management

- Create and assign tasks to team members
- Task status workflow (To Do, In Progress, Review, Done)
- Priority management
- Due date tracking with overdue indicators
- Estimated hours tracking
- Quick status updates from task list

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Icons** - Icon library

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📁 Project Structure

```
Blackbucks-Assignment/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── seeds/          # Database seeder
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/       # Auth-related components
│   │   │   ├── common/     # Shared components
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Login page
│   │   │   ├── dashboard/  # Dashboard page
│   │   │   ├── users/      # User management
│   │   │   ├── projects/   # Project pages
│   │   │   ├── tasks/      # Task pages
│   │   │   └── profile/    # Profile page
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store & slices
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE taskflow;
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
PORT=5000
```

5. Run database migrations and seed:
```bash
npm run seed
```

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔑 Test Credentials

After running the seed script, you can use these credentials to test the application:

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@taskflow.com       | admin123    |
| Manager | manager@taskflow.com     | manager123  |
| User    | user@taskflow.com        | user123     |

## 📡 API Endpoints

### Authentication

| Method | Endpoint          | Description          | Access  |
|--------|-------------------|----------------------|---------|
| POST   | /api/auth/login   | Login user           | Public  |
| POST   | /api/auth/logout  | Logout user          | Auth    |
| GET    | /api/auth/profile | Get current user     | Auth    |
| PUT    | /api/auth/profile | Update profile       | Auth    |
| PUT    | /api/auth/password| Change password      | Auth    |

### Users

| Method | Endpoint         | Description          | Access     |
|--------|------------------|----------------------|------------|
| GET    | /api/users       | Get all users        | Admin      |
| POST   | /api/users       | Create user          | Admin      |
| GET    | /api/users/:id   | Get user by ID       | Admin      |
| PUT    | /api/users/:id   | Update user          | Admin      |
| DELETE | /api/users/:id   | Delete user          | Admin      |

### Projects

| Method | Endpoint                   | Description           | Access           |
|--------|----------------------------|-----------------------|------------------|
| GET    | /api/projects              | Get all projects      | Auth             |
| POST   | /api/projects              | Create project        | Admin, Manager   |
| GET    | /api/projects/:id          | Get project by ID     | Auth             |
| PUT    | /api/projects/:id          | Update project        | Admin, Manager   |
| DELETE | /api/projects/:id          | Delete project        | Admin, Manager   |
| POST   | /api/projects/:id/members  | Add member            | Admin, Manager   |
| DELETE | /api/projects/:id/members/:userId | Remove member  | Admin, Manager   |

### Tasks

| Method | Endpoint             | Description           | Access           |
|--------|----------------------|-----------------------|------------------|
| GET    | /api/tasks           | Get all tasks         | Auth             |
| POST   | /api/tasks           | Create task           | Admin, Manager   |
| GET    | /api/tasks/:id       | Get task by ID        | Auth             |
| PUT    | /api/tasks/:id       | Update task           | Auth*            |
| DELETE | /api/tasks/:id       | Delete task           | Admin, Manager   |
| PATCH  | /api/tasks/:id/status| Update task status    | Auth*            |

*Task updates are allowed for admin, project manager, and task assignee

### Dashboard

| Method | Endpoint             | Description           | Access  |
|--------|----------------------|-----------------------|---------|
| GET    | /api/dashboard/stats | Get dashboard stats    | Auth    |

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode Ready**: Tailwind CSS classes for future dark mode
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: Success and error messages
- **Confirmation Dialogs**: For destructive actions
- **Empty States**: Informative messages when no data
- **Form Validation**: Client and server-side validation

## 🔒 Security Features

- HTTP-only cookies for JWT storage
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Role-based route protection
- SQL injection prevention (Sequelize ORM)

## 📝 Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database with test data
```

### Frontend
```bash
npm run dev      # Start Vite development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for Blackbucks Assignment
