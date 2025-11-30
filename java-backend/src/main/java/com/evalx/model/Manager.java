package com.evalx.model;

public class Manager {
    private int id;
    private String name;
    private String title;
    private String email;
    private String password;
    private String avatar;
    private String department;
    private String role = "manager";

    // Constructors
    public Manager() {
    }

    public Manager(int id, String name, String title, String email, String password, String avatar, String department) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.email = email;
        this.password = password;
        this.avatar = avatar;
        this.department = department;
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
