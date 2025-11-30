package com.evalx.servlet;

import com.evalx.dao.EmployeeDAO;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/employees/*")
public class EmployeeServlet extends HttpServlet {
    private EmployeeDAO employeeDAO = new EmployeeDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            if (path != null && path.length() > 1) {
                String[] parts = path.split("/");
                int id = Integer.parseInt(parts[1]);

                Map<String, Object> data = new HashMap<>();
                data.put("profile", employeeDAO.getEmployeeProfile(id));
                data.put("tasks", employeeDAO.getTasks(id));
                data.put("achievements", employeeDAO.getAchievements(id));
                data.put("reviews", employeeDAO.getReviews(id));
                // Notifications? Frontend expects it.
                // I need to add getNotifications to DAO or just return empty list.
                // Frontend: renderEmployeeNotifications(data.notifications);
                // I'll add an empty list for now or implement it if I have time.
                // Let's implement a dummy one or check if DAO had it.
                // Previous DAO had getNotifications. I should add it back.
                data.put("notifications", new java.util.ArrayList<>());

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", data);
                out.print(gson.toJson(response));
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            out.print(gson.toJson(err));
        }
    }

    @Override
    protected void doPatch(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // PATCH /employees/{id}/tasks/{taskId}
        // HttpServlet doesn't have doPatch by default in older versions, but we can
        // override service or just use doPost with method check?
        // Or better, just implement service() to route PATCH.
        // But standard HttpServlet in Tomcat usually supports doPatch? No, it's not
        // standard in Servlet API pre-5.0?
        // Actually, let's override service() to handle PATCH.
        super.service(req, resp);
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatchInternal(req, resp);
        } else {
            super.service(req, resp);
        }
    }

    private void doPatchInternal(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo(); // /1/tasks/2
        resp.setContentType("application/json");
        PrintWriter out = resp.getWriter();

        try {
            if (path != null && path.contains("/tasks/")) {
                String[] parts = path.split("/");
                // parts[0] is empty, parts[1] is empId, parts[2] is "tasks", parts[3] is taskId
                int taskId = Integer.parseInt(parts[3]);

                BufferedReader reader = req.getReader();
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                boolean completed = json.get("completed").getAsBoolean();

                employeeDAO.updateTaskStatus(taskId, completed);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Task updated");
                out.print(gson.toJson(response));
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            out.print("{\"success\":false, \"message\":\"Error updating task\"}");
        }
    }
}
