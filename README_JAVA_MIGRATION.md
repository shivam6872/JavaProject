# Java Backend Migration

This directory `java-backend` contains the Java Servlet/JSP/JDBC implementation of the backend.

## Prerequisites
- Java Development Kit (JDK) 8 or higher
- Apache Maven (optional, but recommended)
- A Servlet Container like Apache Tomcat (v9 or higher)
- MySQL Database (running the `database.sql` script)

## Setup Instructions

### Using Maven (Recommended)
1. Navigate to `java-backend` directory.
2. Run `mvn clean package`.
3. This will generate a `evalx.war` file in the `target` directory.
4. Deploy this WAR file to your Tomcat `webapps` directory.
5. Start Tomcat.

### Manual Setup (Eclipse/IntelliJ)
1. Import the `java-backend` folder as a project.
2. Add the following JARs to your project's classpath / `WEB-INF/lib`:
   - `mysql-connector-java-8.x.x.jar`
   - `gson-2.x.x.jar`
   - `javax.servlet-api-4.x.x.jar` (usually provided by the server runtime)
3. Run the project on a configured Tomcat server.

## Database Configuration
Ensure your MySQL database is running and the credentials in `src/main/java/com/evalx/util/DBConnection.java` match your setup.
Default:
- URL: `jdbc:mysql://localhost:3306/evalx`
- User: `root`
- Password: `` (empty)

## Frontend Update
You need to update the `API_BASE` in `frontend/script.js` to point to your Java server.
If you deployed as `evalx.war` on localhost:8080, the URL will likely be:
`http://localhost:8080/evalx/api`

Update line 48 in `frontend/script.js`:
```javascript
const API_BASE = 'http://localhost:8080/evalx/api';
```

## Notes
- **Authentication**: The current implementation uses dummy tokens for simplicity. For production, integrate a JWT library (like `jjwt`) to generate and verify secure tokens.
- **Passwords**: Passwords are currently handled as-is or hashes are passed through. Ensure you use `BCrypt` for password hashing in a real deployment.

