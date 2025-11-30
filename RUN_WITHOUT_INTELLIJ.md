# How to Run Without IntelliJ (Using VS Code & Terminal)

Since you don't have Maven installed globally, we will use the **Maven Wrapper** (mvnw) approach. This allows you to run Maven commands without installing it.

## Step 1: Install Maven Wrapper (One-time setup)
1.  Download the Maven Wrapper files. Since we can't easily download them via script without Maven, the easiest way is to **install Maven manually** once or use a portable version.
    *   **Alternative**: If you can't install Maven, you can compile manually, but it's very hard with dependencies.
    *   **Recommended**: Download **Apache Maven** (binary zip) from `https://maven.apache.org/download.cgi`.
    *   Extract it to a folder (e.g., `C:\maven`).
    *   Add `C:\maven\bin` to your System PATH.

## Step 2: Build the Project
Once Maven is in your path (verify with `mvn -version`):
1.  Open your terminal in `java-backend`.
2.  Run:
    ```powershell
    mvn clean package
    ```
3.  This will create a `.war` file in `java-backend/target/evalx.war`.

## Step 3: Run with Tomcat
1.  Download **Apache Tomcat 9** (zip) from `https://tomcat.apache.org/download-90.cgi`.
2.  Extract it (e.g., `C:\tomcat`).
3.  Copy `java-backend/target/evalx.war` to `C:\tomcat\webapps\`.
4.  Start Tomcat:
    *   Open terminal in `C:\tomcat\bin`.
    *   Run `startup.bat`.
5.  Your backend is now running at `http://localhost:8080/evalx`.

## Step 4: Run Frontend
1.  Open `frontend/index.html` in your browser.
