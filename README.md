# Profit and Loss Tracker

A full-stack web application for tracking project finances, income, expenses, and profit/loss metrics.

## Features

- **Dashboard Overview**: View financial metrics and visualizations at a glance
- **Project Management**: Create, edit and delete projects
- **Transaction Tracking**: Record income and expense transactions for each project
- **Financial Reports**: Visualize financial data through interactive charts
- **Monthly Trends**: Track income and expense trends over time
- **Project Performance Analysis**: Compare performance across different projects

## Tech Stack

### Frontend

- React 19
- React Router
- React Query (TanStack Query)
- Recharts for data visualization
- Tailwind CSS for styling
- React Hook Form for form handling
- Yup for form validation

### Backend

- Node.js
- Express
- MongoDB (with Mongoose)
- RESTful API architecture

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/profit-and-loss-tracker.git
   cd profit-and-loss-tracker
   ```

2. Install dependencies for both client and server:

   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Environment Setup:

   - Create `.env` file in the server directory with the following variables:

     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/pnl-tracker
     ```

   - Create `.env` file in the client directory:
     ```
     VITE_API_URL=http://localhost:5000
     ```

4. Start the development servers:

   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend development server (from client directory)
   npm run dev
   ```

## Usage

1. Create new projects from the Projects page
2. Add transactions (income or expenses) to any project
3. View financial summaries and performance metrics on the dashboard
4. Analyze monthly trends and project performance through interactive charts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
#   P r o f i t - a n d - L o s s - T r a c k e r  
 