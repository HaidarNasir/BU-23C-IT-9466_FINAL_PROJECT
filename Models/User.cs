using System;

namespace PoliceCaseManagementSystem.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
        public string FullName { get; set; }
        public string Station { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public User User { get; set; }
        public string Token { get; set; }
    }
}