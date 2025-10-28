using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using PoliceCaseManagementSystem.Models;
using System;
using System.Collections.Generic;

namespace PoliceCaseManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetentionsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public DetentionsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetDetentions()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var detentions = new List<Detention>();

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"SELECT d.*, s.name as suspect_name, u.full_name as officer_name 
                                   FROM detentions d 
                                   JOIN suspects s ON d.suspect_id = s.id 
                                   JOIN users u ON d.created_by = u.id 
                                   ORDER BY d.intake_time DESC";

                    using (var command = new MySqlCommand(query, connection))
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            detentions.Add(new Detention
                            {
                                Id = reader.GetInt32("id"),
                                SuspectId = reader.GetInt32("suspect_id"),
                                SuspectName = reader.GetString("suspect_name"),
                                IntakeTime = reader.GetDateTime("intake_time"),
                                ReleaseTime = reader.IsDBNull(reader.GetOrdinal("release_time")) ?
                                    null : reader.GetDateTime("release_time"),
                                Reason = reader.GetString("reason"),
                                OfficerName = reader.GetString("officer_name")
                            });
                        }
                    }
                }

                return Ok(detentions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve detentions: " + ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateDetention([FromBody] DetentionCreateRequest request)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"INSERT INTO detentions (suspect_id, intake_time, reason, created_by) 
                                   VALUES (@suspectId, @intakeTime, @reason, 1)";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@suspectId", request.SuspectId);
                        command.Parameters.AddWithValue("@intakeTime", request.IntakeTime);
                        command.Parameters.AddWithValue("@reason", request.Reason);

                        command.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true, message = "Detention record created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create detention record: " + ex.Message });
            }
        }

        [HttpPut("{id}/release")]
        public IActionResult ReleaseSuspect(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = "UPDATE detentions SET release_time = @releaseTime WHERE id = @id";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@releaseTime", DateTime.Now);
                        command.Parameters.AddWithValue("@id", id);

                        int affected = command.ExecuteNonQuery();

                        if (affected == 0)
                            return NotFound(new { error = "Detention record not found" });
                    }
                }

                return Ok(new { success = true, message = "Suspect released successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to release suspect: " + ex.Message });
            }
        }
    }
}