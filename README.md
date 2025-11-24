# Employee Management System

A comprehensive full-stack web application for managing employees, managers, and administrative tasks.

## Features

*   **Role-Based Access Control**: Separate dashboards for Managers and Employees.
*   **Authentication**: Secure Login and Registration with JWT authentication.
*   **Employee Management**:
    *   View employee profiles.
    *   Update employee details.
    *   Search for employees (Manager only).
*   **Task & Goal Management**: Assign and track tasks and goals.
*   **Responsive Design**: Modern, responsive user interface.

## Tech Stack

*   **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
*   **Backend**: Node.js, Express.js
*   **Database**: MySQL

## Prerequisites

*   Node.js installed
*   MySQL Server installed and running

## Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/shivam6872/JavaProject.git
    cd JavaProject
    ```

2.  **Setup the Database**
    *   Create a new MySQL database.
    *   Import the `database.sql` file located in the root directory to create the necessary tables.
    *   Update the database configuration in `backend/config/db.js` (or equivalent) with your MySQL credentials.

3.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

4.  **Start the Server**
    ```bash
    npm start
    ```
    The server typically runs on `http://localhost:3000` (check your console output).

5.  **Run the Frontend**
    *   Open `frontend/index.html` in your browser or use a live server extension.

## Usage

*   **Register**: Create a new account as a Manager or Employee.
*   **Login**: Access your dashboard using your credentials.
*   **Manager Dashboard**: Manage employees, view reports, and assign tasks.
*   **Employee Dashboard**: View your profile, tasks, and notifications.
