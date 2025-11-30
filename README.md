# Employee Management System

A comprehensive full-stack web application for managing employees, managers, and administrative tasks, built with a modern Java backend and a responsive frontend.

## Features

*   **Role-Based Access Control**: Distinct dashboards and functionalities for Managers and Employees.
*   **Secure Authentication**: robust login and registration system using **JWT (JSON Web Tokens)** and **BCrypt** for password hashing.
*   **Employee Management**:
    *   View, update, and search for employee profiles.
    *   Automated manager assignment for new employees.
*   **Task & Goal Management**: Assign tasks, set goals, and track progress.
*   **Responsive Design**: A modern, user-friendly interface that works across devices.
*   **Reports & Analytics**: Visual insights into team performance.

## Tech Stack

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript
*   **Backend**: Java (Servlets, JDBC), Maven
*   **Database**: MySQL
*   **Security**: BCrypt (Password Hashing), JJWT (Token-based Auth)

## Prerequisites

Before you begin, ensure you have the following installed:
*   **Java Development Kit (JDK)** (Version 8 or higher)
*   **Apache Maven** (For building the backend)
*   **Apache Tomcat** (Version 9 or higher, for deploying the WAR file)
*   **MySQL Server**

## Installation & Setup

### 1. Database Setup
1.  Create a new MySQL database named `evalx` (or your preferred name).
2.  Import the `database.sql` file located in the root directory to create the necessary tables and schema.
    ```sql
    source /path/to/database.sql;
    ```
3.  Update the database configuration in `java-backend/src/main/java/com/evalx/util/DBConnection.java` if your credentials differ from the defaults:
    *   **URL**: `jdbc:mysql://localhost:3306/evalx`
    *   **User**: `root`
    *   **Password**: *(empty)*

### 2. Backend Setup (Java)
1.  Navigate to the `java-backend` directory:
    ```bash
    cd java-backend
    ```
2.  Build the project using Maven:
    ```bash
    mvn clean package
    ```
    This will generate a `evalx.war` file in the `java-backend/target/` directory.
3.  **Deploy to Tomcat**:
    *   Copy the `evalx.war` file to your Tomcat's `webapps` directory (e.g., `C:\Program Files\Apache Software Foundation\Tomcat 9.0\webapps`).
    *   Start the Tomcat server (run `startup.bat` in Tomcat's `bin` folder).
    *   The backend API will be accessible at `http://localhost:8080/evalx/api`.

### 3. Frontend Setup
1.  Open the `frontend/script.js` file.
2.  Ensure the `API_BASE` constant points to your running backend server:
    ```javascript
    const API_BASE = 'http://localhost:8080/evalx/api';
    ```
3.  Open `frontend/index.html` in your web browser. You can also use a live server extension (like in VS Code) for a better development experience.

## Usage

1.  **Register**: Create a new account. Select "Manager" to create a team or "Employee" to join one.
2.  **Login**: Use your email and password to access the dashboard.
3.  **Manager Dashboard**:
    *   Add and manage employees.
    *   Assign tasks and goals.
    *   View department reports.
4.  **Employee Dashboard**:
    *   View assigned tasks and goals.
    *   Update profile information.
    *   Check notifications.

## Project Structure

*   `frontend/`: Contains HTML, CSS, and JavaScript files for the user interface.
*   `java-backend/`: Contains the Java source code, Maven configuration (`pom.xml`), and web application resources.
    *   `src/main/java/com/evalx/`: Java source packages (Servlet, Model, DAO, Util).
*   `database.sql`: SQL script for initializing the database.
