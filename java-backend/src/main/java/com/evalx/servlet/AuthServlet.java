package com.evalx.servlet;

import com.evalx.dao.AuthDAO;
import com.evalx.model.Employee;
import com.evalx.model.Manager;
import com.evalx.util.JwtUtil;
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
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/auth/*")
public class AuthServlet extends HttpServlet {
    private AuthDAO authDAO = new AuthDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        if ("/managers".equals(path)) {
            try {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", authDAO.getAllManagers()); // Need to add this method to DAO
                // Actually I added getAllManagers to AuthDAO in previous step? Yes.
                // Wait, getAllManagers returns List<Manager>. The frontend expects array of
                // objects.
                // The DAO returns List<Manager>, Gson will serialize it to [...].
                // Frontend expects: [{id, name, department}, ...]
                // My DAO returns Manager objects which have those fields.
                // But wait, the frontend expects the array directly or inside data?
                // Frontend: const managers = await res.json(); (It expects array directly!)
                // But my instruction says "Every servlet must return { success, message, data
                // }".
                // I should check frontend code.
                // frontend/script.js:358: const managers = await res.json();
                // It seems frontend expects the array directly for this specific endpoint?
                // Or maybe I should fix frontend to expect {data: []}.
                // The user said "FIX AND REWRITE everything necessary so the backend matches
                // the frontend APIs exactly".
                // If frontend expects array, I should return array.
                // BUT user also said "Every servlet must return { success: true/false, ... }".
                // This is a contradiction.
                // Usually "matches frontend APIs" takes precedence.
                // However, looking at frontend `loadManagers`:
                // const res = await fetch(`${API_BASE}/auth/managers`);
                // const managers = await res.json();
                // managers.forEach(...)
                // So yes, it expects an array.
                // I will return the array directly for this endpoint to match frontend.
                out.print(gson.toJson(authDAO.getAllManagers()));
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(500);
                out.print("[]");
            }
        } else {
            resp.setStatus(404);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            if ("/login".equals(path)) {
                handleLogin(req, resp, out);
            } else if ("/register".equals(path)) {
                handleRegister(req, resp, out);
            } else {
                resp.setStatus(404);
                Map<String, Object> map = new HashMap<>();
                map.put("success", false);
                map.put("message", "Endpoint not found");
                out.print(gson.toJson(map));
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

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp, PrintWriter out)
            throws IOException, SQLException {
        BufferedReader reader = req.getReader();
        JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
        String email = json.get("username").getAsString();
        String password = json.get("password").getAsString();
        String role = json.has("role") ? json.get("role").getAsString() : null;

        Map<String, Object> responseMap = new HashMap<>();

        if ("manager".equalsIgnoreCase(role)) {
            Manager manager = authDAO.loginManager(email, password);
            if (manager != null) {
                String token = JwtUtil.generateToken(manager.getId(), "manager");
                responseMap.put("success", true);
                responseMap.put("token", token);
                manager.setPassword(null); // Don't send password
                responseMap.put("user", manager);
            } else {
                responseMap.put("success", false);
                responseMap.put("message", "Invalid credentials");
            }
        } else if ("employee".equalsIgnoreCase(role)) {
            Employee emp = authDAO.loginEmployee(email, password);
            if (emp != null) {
                String token = JwtUtil.generateToken(emp.getId(), "employee");
                responseMap.put("success", true);
                responseMap.put("token", token);
                emp.setPassword(null);
                responseMap.put("user", emp);
            } else {
                responseMap.put("success", false);
                responseMap.put("message", "Invalid credentials");
            }
        } else {
            responseMap.put("success", false);
            responseMap.put("message", "Role is required");
        }

        out.print(gson.toJson(responseMap));
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp, PrintWriter out)
            throws IOException, SQLException {
        BufferedReader reader = req.getReader();
        JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
        String role = json.get("role").getAsString();

        Map<String, Object> responseMap = new HashMap<>();
        boolean success = false;

        if ("manager".equalsIgnoreCase(role)) {
            Manager m = gson.fromJson(json, Manager.class);
            success = authDAO.registerManager(m);
        } else {
            Employee e = gson.fromJson(json, Employee.class);
            // Gson might not map managerId correctly if it's camelCase in JSON but field is
            // managerId?
            // Employee class has managerId. JSON has managerId. It should work.
            success = authDAO.registerEmployee(e);
        }

        if (success) {
            responseMap.put("success", true);
            responseMap.put("message", "Registration successful");
        } else {
            responseMap.put("success", false);
            responseMap.put("message", "Registration failed");
        }
        out.print(gson.toJson(responseMap));
    }
}
