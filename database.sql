CREATE DATABASE IF NOT EXISTS evalx;
USE evalx;

DROP TABLE IF EXISTS leaderboard;
DROP TABLE IF EXISTS kpis;
DROP TABLE IF EXISTS radar_metrics;
DROP TABLE IF EXISTS skill_distribution;
DROP TABLE IF EXISTS team_scores;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS managers;

CREATE TABLE managers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  title VARCHAR(120),
  email VARCHAR(120),
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  department VARCHAR(120)
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  manager_id INT,
  name VARCHAR(120) NOT NULL,
  title VARCHAR(120),
  email VARCHAR(120),
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(120),
  address TEXT,
  working_status TINYINT(1) DEFAULT 1,
  years_experience DECIMAL(4,1),
  projects_completed INT,
  average_rating DECIMAL(3,1),
  productivity INT,
  teamwork INT,
  creativity INT,
  FOREIGN KEY (manager_id) REFERENCES managers(id)
);

CREATE TABLE achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  title VARCHAR(150),
  description VARCHAR(255),
  badge_type ENUM('gold','silver','bronze','standard') DEFAULT 'standard',
  icon VARCHAR(10),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  skill VARCHAR(120),
  proficiency INT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  title VARCHAR(200),
  description TEXT,
  status ENUM('not-started','in-progress','completed') DEFAULT 'not-started',
  progress INT DEFAULT 0,
  deadline DATE,
  completed_on DATE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  period VARCHAR(40),
  reviewer VARCHAR(120),
  score INT,
  summary TEXT,
  highlights TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  title VARCHAR(150),
  body VARCHAR(255),
  icon VARCHAR(10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  manager_id INT NOT NULL,
  category VARCHAR(80),
  productivity INT,
  teamwork INT,
  creativity INT,
  accuracy INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES managers(id)
);

CREATE TABLE team_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  manager_id INT NOT NULL,
  employee_name VARCHAR(120),
  score INT,
  FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
);

CREATE TABLE skill_distribution (
  id INT AUTO_INCREMENT PRIMARY KEY,
  manager_id INT NOT NULL,
  label VARCHAR(80),
  value INT,
  FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
);

CREATE TABLE radar_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  manager_id INT NOT NULL,
  metric VARCHAR(80),
  value INT,
  FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
);

CREATE TABLE kpis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric VARCHAR(80),
  value INT
);

CREATE TABLE leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_name VARCHAR(120),
  rank_label VARCHAR(20),
  rank_position INT
);

INSERT INTO managers (name, title, email, password, avatar, department) VALUES
('Sarah Johnson', 'Director of Engineering', 'sarah.johnson@example.com', '$2b$10$UjfwjjB6E0Jh3lBhfvAvXuumy48eLTMu8qsKIwSTqBuLtMM597G9.', 'https://images.unsplash.com/photo-1521579971123-1192931a1452?w=400', 'Engineering'),
('Marcus Chen', 'Head of Data', 'marcus.chen@example.com', '$2b$10$UjfwjjB6E0Jh3lBhfvAvXuumy48eLTMu8qsKIwSTqBuLtMM597G9.', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400', 'Data');

INSERT INTO employees (manager_id, name, title, email, password, avatar, years_experience, projects_completed, average_rating, productivity, teamwork, creativity) VALUES
(1, 'John Smith', 'Senior Software Engineer', 'john.smith@example.com', '$2b$10$UjfwjjB6E0Jh3lBhfvAvXuumy48eLTMu8qsKIwSTqBuLtMM597G9.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 5.2, 12, 4.8, 78, 85, 67),
(1, 'Alex Johnson', 'UI Engineer', 'alex.johnson@example.com', '$2b$10$UjfwjjB6E0Jh3lBhfvAvXuumy48eLTMu8qsKIwSTqBuLtMM597G9.', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400', 4.0, 9, 4.5, 82, 79, 74),
(1, 'Mia Carter', 'Data Analyst', 'mia.carter@example.com', '$2b$10$UjfwjjB6E0Jh3lBhfvAvXuumy48eLTMu8qsKIwSTqBuLtMM597G9.', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400', 3.5, 8, 4.7, 91, 88, 81);

INSERT INTO achievements (employee_id, title, description, badge_type, icon) VALUES
(1, 'Top Performer', 'Q3 2024', 'gold', '🏆'),
(1, 'Innovation Award', 'Best Solution', 'silver', '🚀'),
(1, 'Team Player', 'Collaboration Excellence', 'bronze', '👥'),
(1, 'Growth Mindset', 'Continuous Learning', 'standard', '📈');

INSERT INTO skills (employee_id, skill, proficiency) VALUES
(1, 'JavaScript', 85),
(1, 'React', 78),
(1, 'Node.js', 72),
(1, 'Leadership', 80);

INSERT INTO goals (employee_id, title, description, status, progress, deadline, completed_on) VALUES
(1, 'Complete Advanced React Course', 'Master advanced React patterns and state management', 'in-progress', 65, '2024-12-31', NULL),
(1, 'Lead Team Project', 'Successfully led the Q3 dashboard redesign project', 'completed', 100, '2024-10-15', '2024-10-15');

INSERT INTO reviews (employee_id, period, reviewer, score, summary, highlights) VALUES
(1, 'Q3 2024', 'Sarah Johnson', 92, 'Excellent performance with strong technical skills and leadership qualities.', 'Technical Excellence,Team Leadership,Innovation'),
(1, 'Q2 2024', 'Sarah Johnson', 88, 'Strong performance with room for growth in cross-functional collaboration.', 'Code Quality,Problem Solving');

(1, 'Sam Patel', 76),
(1, 'Lee Wong', 84),
(1, 'Sara Kim', 79);

INSERT INTO skill_distribution (manager_id, label, value) VALUES
(1, 'UI', 32),
(1, 'Data', 28),
(1, 'Infra', 22),
(1, 'QA', 18);

INSERT INTO radar_metrics (manager_id, metric, value) VALUES
(1, 'Prod', 80),
(1, 'Team', 85),
(1, 'Creat', 70),
(1, 'Comm', 78),
(1, 'Accuracy', 88);

INSERT INTO kpis (metric, value) VALUES
('Evaluations', 1240),
('Avg Score', 87),
('Reports', 42);

INSERT INTO leaderboard (employee_name, rank_label, rank_position) VALUES
('Mia Carter', 'gold', 1),
('Alex Johnson', 'silver', 2),
('Sam Patel', 'bronze', 3),
('Lee Wong', 'standard', 4),
('Sara Kim', 'standard', 5);

