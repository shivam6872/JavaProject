# How to Run the Employee Management System

## Prerequisites
1.  **MySQL Database**: Ensure MySQL is installed and running.
2.  **Java IDE**: Eclipse (Enterprise Java Developers edition) or IntelliJ IDEA (Ultimate recommended).
3.  **Apache Tomcat**: A web server to run the Java backend (v9.0 or higher).

## Step 1: Database Setup
1.  Open your MySQL Workbench or Command Line.
2.  Run the `database.sql` script located in the root folder.
    *   This creates the `evalx` database and all necessary tables.
3.  **Check Credentials**: Open `java-backend/src/main/java/com/evalx/util/DBConnection.java` and ensure the `USER` and `PASSWORD` match your MySQL installation.

## Step 2: Backend Setup (Java)
1.  **Open your IDE** (Eclipse or IntelliJ).
2.  **Import Project**:
    *   **Eclipse**: File > Import > Maven > Existing Maven Projects > Select the `java-backend` folder.
    *   **IntelliJ**: File > Open > Select the `java-backend` folder.
3.  **Run the Server**:
    *   Right-click on the project in the project explorer.
    *   Select **Run As > Run on Server**.
    *   Choose **Apache Tomcat** (configure it if asked, pointing to your Tomcat installation folder).
    *   The server should start, and you might see a page at `http://localhost:8080/evalx`.

## Step 3: Frontend Setup
1.  Navigate to the `frontend` folder in your file explorer or VS Code.
2.  Open `index.html` in your web browser.
    *   **VS Code Tip**: If you have the "Live Server" extension, right-click `index.html` and choose "Open with Live Server".
3.  **Login**:
    *   Use the credentials from `database.sql` (e.g., `sarah.johnson@example.com` / `password`).

## Troubleshooting
*   **CORS Errors**: If the frontend says "Network Error", ensure the backend is running at `http://localhost:8080/evalx`. If your Tomcat runs on a different port, update `frontend/script.js` line 48.
*   **Database Connection**: If login fails immediately, check the IDE console for "MySQL Driver not found" or "Access denied" errors.
