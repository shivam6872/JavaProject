package com.evalx.dao;

import com.evalx.model.Employee;
import com.evalx.model.Manager;
import com.evalx.util.DBConnection;
import com.evalx.util.PasswordUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AuthDAO {

    public Manager loginManager(String email, String password) throws SQLException {
        String sql = "SELECT * FROM managers WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password");
                    if (PasswordUtil.checkPassword(password, storedHash)) {
                        Manager manager = new Manager();
                        manager.setId(rs.getInt("id"));
                        manager.setName(rs.getString("name"));
                        manager.setEmail(rs.getString("email"));
                        manager.setTitle(rs.getString("title"));
                        manager.setAvatar(rs.getString("avatar"));
                        manager.setDepartment(rs.getString("department"));
                        manager.setRole("manager");
                        return manager;
                    }
                }
            }
        }
        return null;
    }

    public Employee loginEmployee(String email, String password) throws SQLException {
        String sql = "SELECT * FROM employees WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password");
                    if (PasswordUtil.checkPassword(password, storedHash)) {
                        Employee emp = new Employee();
                        emp.setId(rs.getInt("id"));
                        emp.setManagerId(rs.getInt("manager_id"));
                        emp.setName(rs.getString("name"));
                        emp.setEmail(rs.getString("email"));
                        emp.setTitle(rs.getString("title"));
                        emp.setAvatar(rs.getString("avatar"));
                        emp.setDepartment(rs.getString("department"));
                        emp.setWorkingStatus(rs.getBoolean("working_status"));
                        emp.setRole("employee");
                        return emp;
                    }
                }
            }
        }
        return null;
    }

    public boolean registerManager(Manager manager) throws SQLException {
        String sql = "INSERT INTO managers (name, email, password, title, avatar, department) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, manager.getName());
            stmt.setString(2, manager.getEmail());
            stmt.setString(3, PasswordUtil.hashPassword(manager.getPassword()));
            stmt.setString(4, manager.getTitle());
            stmt.setString(5, manager.getAvatar());
            stmt.setString(6, manager.getDepartment());
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean registerEmployee(Employee employee) throws SQLException {
        String sql = "INSERT INTO employees (manager_id, name, email, password, title, avatar, department) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, employee.getManagerId());
            stmt.setString(2, employee.getName());
            stmt.setString(3, employee.getEmail());
            stmt.setString(4, PasswordUtil.hashPassword(employee.getPassword()));
            stmt.setString(5, employee.getTitle());
            stmt.setString(6, employee.getAvatar());
            stmt.setString(7, employee.getDepartment());
            return stmt.executeUpdate() > 0;
        }
    }

    public List<Manager> getAllManagers() throws SQLException {
        List<Manager> list = new ArrayList<>();
        String sql = "SELECT id, name, department FROM managers";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Manager m = new Manager();
                m.setId(rs.getInt("id"));
                m.setName(rs.getString("name"));
                m.setDepartment(rs.getString("department"));
                list.add(m);
            }
        }
        return list;
    }
}
