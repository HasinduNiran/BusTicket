# Bus Ticket Machine System

A comprehensive bus ticket management system built with the MERN stack (MongoDB, Express.js, React, Node.js) and React Native for mobile POS application.

## 🚌 Project Overview

This system provides a complete solution for bus ticket management with three main components:
- **Backend API** (Node.js/Express with MongoDB)
- **Web Admin Panel** (React with Material-UI)
- **Mobile POS App** (React Native for conductors)

## 🏗️ System Components

### 1. Web Admin Panel (`/web-admin`)
- System admin and bus owner management
- Route and section management
- Fare configuration
- Real-time ticket monitoring
- Modern React UI with Material-UI

### 2. React Native Mobile App (`/mobile-app`)
- Conductor ticket generation
- Section-based fare calculation
- POS card machine integration
- Offline ticket support

### 3. Backend API (`/backend`)
- Node.js + Express
- MongoDB with Mongoose ODM
- JWT Authentication
- Role-based access control
- MongoDB database
- RESTful APIs
- Real-time data sync

## Features

### Admin Features
- Add/Edit bus routes
- Configure sections and fares
- Manage stop locations
- View ticket sales reports

### Conductor Features
- Select starting point (default: Embilipitiya)
- Enter destination section number
- Auto-calculate fare
- Print ticket with route details
- Track daily sales

## Sample Route Configuration

**Sections & Fares:**
```
Section | Fare (Rs.)
01      | 27
02      | 35
03      | 45
04      | 55
05      | 66
06      | 76
07      | 86
08      | 90
```

**Stop Details:**
```
Code | Stop Name        | Section | Fare (Rs.)
00   | Embilipitiya    | 0       | 27.00
01   | Udagama         | 1       | 35.00
02   | Sampathwatta    | 2       | 45.00
03   | Thelbaduara     | 3       | 45.00
04   | 2 Kanuwa        | 4       | 55.00
05   | 3 Kanuwa        | 5       | 66.00
06   | 5 Kanuwa        | 6       | 76.00
07   | Panamura        | 7       | 86.00
08   | Heen Iluk Hinna | 8       | 90.00
```

## Setup Instructions

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Web Admin Setup**
   ```bash
   cd web-admin
   npm install
   npm start
   ```

3. **Mobile App Setup**
   ```bash
   cd mobile-app
   npm install
   npx react-native run-android
   ```

## Environment Variables

Create `.env` files in each directory with appropriate configuration.

## 👥 Default User Accounts

After running the seeder, you can login with these accounts:

| Role | Email | Password | Access Level |
|------|--------|----------|--------------|
| **Admin** | admin@busticket.com | admin123 | Full system access |
| **Bus Owner** | owner@busticket.com | owner123 | Route & fleet management |
| **Conductor** | conductor@busticket.com | conductor123 | Ticket generation |

## 🗺️ Sample Route Data

The system includes a sample route: **Embilipitiya - Heen Iluk Hinna**

### Bus Stops
| Code | Stop Name | Section | Fare (Rs.) |
|------|-----------|---------|------------|
| 00 | Embilipitiya | 0 | 27.00 |
| 01 | Udagama | 1 | 35.00 |
| 02 | Sampathwatta | 2 | 45.00 |
| 03 | Thelbaduara | 3 | 45.00 |
| 04 | 2 Kanuwa | 4 | 55.00 |
| 05 | 3 Kanuwa | 5 | 66.00 |
| 06 | 5 Kanuwa | 6 | 76.00 |
| 07 | Panamura | 7 | 86.00 |
| 08 | Heen Iluk Hinna | 8 | 90.00 |

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation & Setup

1. **Backend Setup**
```bash
cd backend
npm install
# Edit .env with your MongoDB connection string
npm run dev
```

2. **Seed Database**
```bash
cd backend
node seedDatabase.js
```

3. **Web Admin Setup**
```bash
cd web-admin
npm install
npm start
```

4. **Mobile App Setup** (Optional)
```bash
cd mobile-app
npm install
# Follow React Native setup guide
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend (Web Admin)
- **React** - UI library
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client

### Mobile App
- **React Native** - Mobile framework
- **React Navigation** - Navigation

## License

MIT License
