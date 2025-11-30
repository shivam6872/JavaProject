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

@WebServlet("/api/reports/*")
public class ReportsServlet extends HttpServlet {
    private ManagerDAO managerDAO = new ManagerDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            if ("/kpis".equals(path)) {
                // Frontend expects { "Evaluations": 120, ... } directly?
                // Or inside data?
                // Frontend: const data = await res.json(); animateKpis(data);
                // animateKpis iterates keys.
                // So it expects object directly?
                // But my instruction says "Every servlet must return { success, message, data
                // }".
                // If I return { success: true, data: { ... } }, frontend might break if it
                // expects direct object.
                // Let's check frontend `loadReportsData`:
                // const res = await fetch(`${API_BASE}/reports`);
                // const data = await res.json();
                // Wait, frontend calls `/reports` (base) -> `loadReportsData`.
                // But there are specific functions for KPIs?
                // Actually `loadReportsData` fetches `/reports`?
                // Let's check `frontend/script.js` again.
                // It fetches `${API_BASE}/reports`.
                // And expects `data` to have everything?
                // Or maybe I should implement `/reports` to return everything.
                // The user instruction says:
                // GET /reports/kpis
                // GET /reports/leaderboard
                // So I should support these.
                // If frontend calls `/reports`, I might need to aggregate.
                // But let's stick to the user instructions for endpoints.

                // If path is /kpis, return data wrapped in success?
                // User instruction 7: "GET /reports/kpis Return exactly: { 'Evaluations':
                // number... }"
                // This contradicts "Every servlet must return { success... }".
                // I will follow "Return exactly" for the data structure, but wrap it if
                // possible,
                // OR if the user was very specific about "Return exactly: {...}", maybe they
                // meant the JSON body.
                // Given "Every servlet must return {success...}", I will put the "exact
                // structure" INSIDE "data".

                response.put("data", managerDAO.getKPIs());
                out.print(gson.toJson(response));
            } else if ("/leaderboard".equals(path)) {
                response.put("data", managerDAO.getLeaderboard());
                out.print(gson.toJson(response));
            } else {
                // Maybe /reports root?
                Map<String, Object> all = new HashMap<>();
                all.put("kpis", managerDAO.getKPIs());
                all.put("leaderboard", managerDAO.getLeaderboard());
                response.put("data", all);
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
}
