using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using PoliceCaseManagementSystem.Models;
using System;
using System.Collections.Generic;

namespace PoliceCaseManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public UsersController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // GET: api/users
        [HttpGet]
        public IActionResult GetUsers()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var users = new List<User>();

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = "SELECT id, username, role, full_name, station, created_at FROM users ORDER BY created_at DESC";

                    using (var command = new MySqlCommand(query, connection))
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            users.Add(new User
                            {
                                Id = reader.GetInt32("id"),
                                Username = reader.GetString("username"),
                                Role = reader.GetString("role"),
                                FullName = reader.GetString("full_name"),
                                Station = reader.GetString("station"),
                                CreatedAt = reader.GetDateTime("created_at")
                            });
                        }
                    }
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve users: " + ex.Message });
            }
        }

        // POST: api/users
        [HttpPost]
        public IActionResult CreateUser([FromBody] UserCreateRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password) ||
                    string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.Role) ||
                    string.IsNullOrEmpty(request.Station))
                {
                    return BadRequest(new { error = "All fields are required" });
                }

                // Validate role
                if (request.Role != "admin" && request.Role != "branch_head" && request.Role != "investigator" && request.Role != "constable")
                {
                    return BadRequest(new { error = "Invalid role. Must be 'admin', 'branch_head', 'investigator', or 'constable'" });
                }

                // Validate password length
                if (request.Password.Length < 6)
                {
                    return BadRequest(new { error = "Password must be at least 6 characters long" });
                }

                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    // Check if username already exists
                    string checkQuery = "SELECT COUNT(*) FROM users WHERE username = @username";
                    using (var checkCommand = new MySqlCommand(checkQuery, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@username", request.Username);
                        int existingCount = Convert.ToInt32(checkCommand.ExecuteScalar());

                        if (existingCount > 0)
                        {
                            return BadRequest(new { error = "Username already exists" });
                        }
                    }

                    // NEW: Check if branch head already exists for this station
                    if (request.Role == "branch_head")
                    {
                        string checkBranchHeadQuery = "SELECT COUNT(*) FROM users WHERE role = 'branch_head' AND station = @station";
                        using (var checkBranchHeadCommand = new MySqlCommand(checkBranchHeadQuery, connection))
                        {
                            checkBranchHeadCommand.Parameters.AddWithValue("@station", request.Station);
                            int existingBranchHeadCount = Convert.ToInt32(checkBranchHeadCommand.ExecuteScalar());

                            if (existingBranchHeadCount > 0)
                            {
                                return BadRequest(new { error = $"This branch already has a branch head. Please assign a different branch or role." });
                            }
                        }
                    }

                    // Hash password using BCrypt
                    string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                    // Insert new user
                    string insertQuery = @"INSERT INTO users 
                                         (username, password_hash, role, full_name, station) 
                                         VALUES (@username, @passwordHash, @role, @fullName, @station)";

                    using (var command = new MySqlCommand(insertQuery, connection))
                    {
                        command.Parameters.AddWithValue("@username", request.Username);
                        command.Parameters.AddWithValue("@passwordHash", passwordHash);
                        command.Parameters.AddWithValue("@role", request.Role);
                        command.Parameters.AddWithValue("@fullName", request.FullName);
                        command.Parameters.AddWithValue("@station", request.Station);

                        int affectedRows = command.ExecuteNonQuery();

                        if (affectedRows > 0)
                        {
                            return Ok(new
                            {
                                success = true,
                                message = "User created successfully"
                            });
                        }
                        else
                        {
                            return StatusCode(500, new { error = "Failed to create user" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create user: " + ex.Message });
            }
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            try
            {
                // Prevent admin from deleting themselves
                var currentUser = GetCurrentUser();
                if (currentUser?.Id == id)
                {
                    return BadRequest(new { error = "You cannot delete your own account" });
                }

                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = "DELETE FROM users WHERE id = @id";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@id", id);

                        int affectedRows = command.ExecuteNonQuery();

                        if (affectedRows > 0)
                        {
                            return Ok(new
                            {
                                success = true,
                                message = "User deleted successfully"
                            });
                        }
                        else
                        {
                            return NotFound(new { error = "User not found" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete user: " + ex.Message });
            }
        }

        // PUT: api/users/{id} - Update user
        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, [FromBody] UserUpdateRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.Role) ||
                    string.IsNullOrEmpty(request.Station))
                {
                    return BadRequest(new { error = "All fields are required" });
                }

                // Validate role
                if (request.Role != "admin" && request.Role != "branch_head" && request.Role != "investigator" && request.Role != "constable")
                {
                    return BadRequest(new { error = "Invalid role. Must be 'admin', 'branch_head', 'investigator', or 'constable'" });
                }

                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    // NEW: Check if branch head already exists for this station (excluding current user)
                    if (request.Role == "branch_head")
                    {
                        string checkBranchHeadQuery = "SELECT COUNT(*) FROM users WHERE role = 'branch_head' AND station = @station AND id != @id";
                        using (var checkBranchHeadCommand = new MySqlCommand(checkBranchHeadQuery, connection))
                        {
                            checkBranchHeadCommand.Parameters.AddWithValue("@station", request.Station);
                            checkBranchHeadCommand.Parameters.AddWithValue("@id", id);
                            int existingBranchHeadCount = Convert.ToInt32(checkBranchHeadCommand.ExecuteScalar());

                            if (existingBranchHeadCount > 0)
                            {
                                return BadRequest(new { error = $"This branch already has a branch head. Please assign a different branch or role." });
                            }
                        }
                    }

                    // Update user
                    string updateQuery = @"UPDATE users 
                                         SET role = @role, full_name = @fullName, station = @station 
                                         WHERE id = @id";

                    using (var command = new MySqlCommand(updateQuery, connection))
                    {
                        command.Parameters.AddWithValue("@role", request.Role);
                        command.Parameters.AddWithValue("@fullName", request.FullName);
                        command.Parameters.AddWithValue("@station", request.Station);
                        command.Parameters.AddWithValue("@id", id);

                        int affectedRows = command.ExecuteNonQuery();

                        if (affectedRows > 0)
                        {
                            return Ok(new
                            {
                                success = true,
                                message = "User updated successfully"
                            });
                        }
                        else
                        {
                            return NotFound(new { error = "User not found" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update user: " + ex.Message });
            }
        }

        // Get current user from request (simplified)
        private User GetCurrentUser()
        {
            // This is a simplified version - in a real application, you'd get this from the JWT token
            // For now, we'll return a mock user
            return new User { Id = 1, Username = "admin" };
        }
    }

    public class UserCreateRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
        public string Station { get; set; }
    }

    public class UserUpdateRequest
    {
        public string FullName { get; set; }
        public string Role { get; set; }
        public string Station { get; set; }
    }
}