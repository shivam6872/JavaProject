package com.evalx.servlet;

import com.evalx.dao.ManagerDAO;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/managers/*")
public class ManagerServlet extends HttpServlet {
    private ManagerDAO managerDAO = new ManagerDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo(); // /1/charts or /1/team-scores
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            if (path == null) {
                resp.setStatus(404);
                return;
            }

            String[] parts = path.split("/");
            if (parts.length < 3) {
                resp.setStatus(404);
                return;
            }

            int managerId = Integer.parseInt(parts[1]);
            String endpoint = parts[2];

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            if ("charts".equals(endpoint)) {
                // Frontend calls /managers/{id}/charts and expects { teamScores,
                // skillDistribution, radarMetrics }
                Map<String, Object> data = new HashMap<>();
                data.put("teamScores", managerDAO.getTeamScores(managerId));
                data.put("skillDistribution", managerDAO.getSkillDistribution(managerId));
                data.put("radarMetrics", managerDAO.getRadarMetrics(managerId));
                response.put("data", data);
                out.print(gson.toJson(response));
            } else if ("team-scores".equals(endpoint)) {
                response.put("data", managerDAO.getTeamScores(managerId));
                out.print(gson.toJson(response));
            } else if ("skill-distribution".equals(endpoint)) {
                response.put("data", managerDAO.getSkillDistribution(managerId));
                out.print(gson.toJson(response));
            } else if ("radar-metrics".equals(endpoint)) {
                response.put("data", managerDAO.getRadarMetrics(managerId));
                out.print(gson.toJson(response));
            } else {
                resp.setStatus(404);
                out.print("{\"success\":false}");
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
}
