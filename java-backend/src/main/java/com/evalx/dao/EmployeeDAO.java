package com.evalx.dao;

import com.evalx.model.Employee;
import com.evalx.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EmployeeDAO {

    public Map<String, Object> getEmployeeProfile(int id) throws SQLException {
        String sql = "SELECT e.*, m.name as manager_name FROM employees e LEFT JOIN managers m ON e.manager_id = m.id WHERE e.id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> profile = new HashMap<>();
                    profile.put("id", rs.getInt("id"));
                    profile.put("name", rs.getString("name"));
                    profile.put("title", rs.getString("title"));
                    profile.put("avatar", rs.getString("avatar"));
                    profile.put("department", rs.getString("department"));
                    profile.put("manager", rs.getString("manager_name"));
                    profile.put("email", rs.getString("email"));
                    profile.put("phone", rs.getString("phone"));
                    profile.put("address", rs.getString("address"));
                    profile.put("workingStatus", rs.getBoolean("working_status"));
                    profile.put("yearsExperience", rs.getBigDecimal("years_experience"));
                    profile.put("projectsCompleted", rs.getInt("projects_completed"));
                    profile.put("averageRating", rs.getBigDecimal("average_rating"));
                    profile.put("productivity", rs.getInt("productivity"));
                    profile.put("teamwork", rs.getInt("teamwork"));
                    profile.put("creativity", rs.getInt("creativity"));
                    return profile;
                }
            }
        }
        return null;
    }

    public List<Map<String, Object>> getTasks(int employeeId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM tasks WHERE employee_id = ? ORDER BY created_at DESC";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, employeeId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("description", rs.getString("description"));
                    map.put("completed", rs.getBoolean("completed"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getAchievements(int employeeId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM achievements WHERE employee_id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, employeeId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("title", rs.getString("title"));
                    map.put("description", rs.getString("description"));
                    map.put("badgeType", rs.getString("badge_type")); // Frontend expects camelCase
                    map.put("icon", rs.getString("icon"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getReviews(int employeeId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM reviews WHERE employee_id = ? ORDER BY id DESC";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, employeeId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("period", rs.getString("period"));
                    map.put("reviewer", rs.getString("reviewer"));
                    map.put("score", rs.getInt("score"));
                    map.put("summary", rs.getString("summary"));
                    // Highlights are stored as comma separated string or similar?
                    // The SQL insert showed 'Technical Excellence,Team Leadership'
                    String highlights = rs.getString("highlights");
                    map.put("highlights", highlights != null ? highlights.split(",") : new String[] {});
                    list.add(map);
                }
            }
        }
        return list;
    }

    public void updateTaskStatus(int taskId, boolean completed) throws SQLException {
        String sql = "UPDATE tasks SET completed = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setBoolean(1, completed);
            stmt.setInt(2, taskId);
            stmt.executeUpdate();
        }
    }
}
