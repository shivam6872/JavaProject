package com.evalx.dao;

import com.evalx.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ManagerDAO {

    public List<Map<String, Object>> getTeamScores(int managerId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT employee_name as name, score FROM team_scores WHERE manager_id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, managerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", rs.getString("name"));
                    map.put("score", rs.getInt("score"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getSkillDistribution(int managerId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT label, value FROM skill_distribution WHERE manager_id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, managerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("label", rs.getString("label"));
                    map.put("value", rs.getInt("value"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getRadarMetrics(int managerId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT metric, value FROM radar_metrics WHERE manager_id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, managerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("metric", rs.getString("metric")); // Frontend expects "metric" or "label"?
                    // Frontend chart uses "labels: data.radarMetrics.map(d => d.label)"
                    // But backend sends "metric". Let's send both to be safe or check frontend.
                    // Frontend: labels: data.radarMetrics.map(d => d.label)
                    // So we must send "label".
                    map.put("label", rs.getString("metric"));
                    map.put("value", rs.getInt("value"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public Map<String, Integer> getKPIs() throws SQLException {
        Map<String, Integer> kpis = new HashMap<>();
        String sql = "SELECT metric, value FROM kpis";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                kpis.put(rs.getString("metric"), rs.getInt("value"));
            }
        }
        return kpis;
    }

    public List<Map<String, Object>> getLeaderboard() throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT employee_name as name, rank_label as rankLabel, rank_position as rankPosition FROM leaderboard ORDER BY rank_position ASC";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("name", rs.getString("name"));
                map.put("rankLabel", rs.getString("rankLabel"));
                map.put("rankPosition", rs.getInt("rankPosition"));
                list.add(map);
            }
        }
        return list;
    }
}
