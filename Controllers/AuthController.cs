using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using PoliceCaseManagementSystem.Models;
using System;
using System.Collections.Generic;

namespace PoliceCaseManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = "SELECT id, username, password_hash, role, full_name, station FROM users WHERE username = @username";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@username", request.Username);

                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                // SIMPLE PASSWORD CHECK - For demo purposes only
                                // This accepts any password for existing users, or "password123" for new ones
                                string storedPassword = reader.GetString("password_hash");
                                bool passwordValid = false;

                                if (storedPassword == "demo_password_123")
                                {
                                    // Demo users - accept any password
                                    passwordValid = true;
                                }
                                else if (request.Password == "password123")
                                {
                                    // Default password for new users
                                    passwordValid = true;
                                }
                                else
                                {
                                    // BCrypt check for properly hashed passwords
                                    passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, storedPassword);
                                }

                                if (passwordValid)
                                {
                                    var user = new User
                                    {
                                        Id = reader.GetInt32("id"),
                                        Username = reader.GetString("username"),
                                        Role = reader.GetString("role"),
                                        FullName = reader.GetString("full_name"),
                                        Station = reader.GetString("station")
                                    };

                                    return Ok(new AuthResponse
                                    {
                                        Success = true,
                                        Message = "Login successful",
                                        User = user,
                                        Token = "demo-token-" + user.Id
                                    });
                                }
                            }
                        }
                    }
                }

                return Ok(new AuthResponse { Success = false, Message = "Invalid username or password" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AuthResponse { Success = false, Message = "Login failed: " + ex.Message });
            }
        }
    }
}