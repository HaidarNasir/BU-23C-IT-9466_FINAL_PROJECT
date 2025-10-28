using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using PoliceCaseManagementSystem.Models;
using System;
using System.Collections.Generic;

namespace PoliceCaseManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuspectsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public SuspectsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetSuspects()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var suspects = new List<Suspect>();

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    // Updated query to include complaint information
                    string query = @"SELECT s.*, c.case_number as complaint_case_number, c.crime_type 
                                   FROM suspects s 
                                   LEFT JOIN complaints c ON s.complaint_id = c.id 
                                   ORDER BY s.created_at DESC";

                    using (var command = new MySqlCommand(query, connection))
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var suspect = new Suspect
                            {
                                Id = reader.GetInt32("id"),
                                SuspectId = reader.IsDBNull(reader.GetOrdinal("suspect_id")) ?
                                    "SUS-" + reader.GetInt32("id").ToString("D6") : reader.GetString("suspect_id"),
                                Name = reader.GetString("name"),
                                Gender = reader.GetString("gender"),
                                DateOfBirth = reader.IsDBNull(reader.GetOrdinal("date_of_birth")) ?
                                    null : reader.GetDateTime("date_of_birth"),
                                Address = reader.IsDBNull(reader.GetOrdinal("address")) ?
                                    "" : reader.GetString("address"),
                                IdentificationNumber = reader.IsDBNull(reader.GetOrdinal("identification_number")) ?
                                    "" : reader.GetString("identification_number"),
                                CreatedAt = reader.GetDateTime("created_at")
                            };

                            // Add complaint information if available
                            if (!reader.IsDBNull(reader.GetOrdinal("complaint_id")))
                            {
                                suspect.ComplaintId = reader.GetInt32("complaint_id");
                            }
                            if (!reader.IsDBNull(reader.GetOrdinal("complaint_case_number")))
                            {
                                suspect.ComplaintCaseNumber = reader.GetString("complaint_case_number");
                            }
                            if (!reader.IsDBNull(reader.GetOrdinal("crime_type")))
                            {
                                suspect.CrimeType = reader.GetString("crime_type");
                            }

                            suspects.Add(suspect);
                        }
                    }
                }

                return Ok(suspects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve suspects: " + ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateSuspect([FromBody] SuspectCreateRequest request)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                string suspectId = "";
                int newSuspectId = 0;

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    // First, insert the suspect without the suspect_id to get the auto-increment ID
                    string insertQuery = @"INSERT INTO suspects 
                                       (name, gender, date_of_birth, address, identification_number, complaint_id) 
                                       VALUES (@name, @gender, @dob, @address, @idNumber, @complaintId);
                                       SELECT LAST_INSERT_ID();";

                    using (var command = new MySqlCommand(insertQuery, connection))
                    {
                        command.Parameters.AddWithValue("@name", request.Name);
                        command.Parameters.AddWithValue("@gender", request.Gender);
                        command.Parameters.AddWithValue("@dob", request.DateOfBirth ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@address", request.Address ?? "");
                        command.Parameters.AddWithValue("@idNumber", request.IdentificationNumber ?? "");
                        command.Parameters.AddWithValue("@complaintId", request.ComplaintId ?? (object)DBNull.Value);

                        newSuspectId = Convert.ToInt32(command.ExecuteScalar());
                    }

                    // Generate suspect ID based on the auto-increment ID
                    suspectId = "SUS-" + DateTime.Now.ToString("yyyyMMdd") + "-" + newSuspectId.ToString("D4");

                    // Update the suspect with the generated suspect_id
                    string updateQuery = "UPDATE suspects SET suspect_id = @suspectId WHERE id = @id";

                    using (var updateCommand = new MySqlCommand(updateQuery, connection))
                    {
                        updateCommand.Parameters.AddWithValue("@suspectId", suspectId);
                        updateCommand.Parameters.AddWithValue("@id", newSuspectId);
                        updateCommand.ExecuteNonQuery();
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = "Suspect created successfully",
                    suspectId = suspectId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create suspect: " + ex.Message });
            }
        }

        // NEW: Get suspects by complaint ID
        [HttpGet("by-complaint/{complaintId}")]
        public IActionResult GetSuspectsByComplaint(int complaintId)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var suspects = new List<Suspect>();

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"SELECT s.*, c.case_number as complaint_case_number, c.crime_type 
                                   FROM suspects s 
                                   LEFT JOIN complaints c ON s.complaint_id = c.id 
                                   WHERE s.complaint_id = @complaintId 
                                   ORDER BY s.created_at DESC";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@complaintId", complaintId);

                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var suspect = new Suspect
                                {
                                    Id = reader.GetInt32("id"),
                                    SuspectId = reader.IsDBNull(reader.GetOrdinal("suspect_id")) ?
                                        "SUS-" + reader.GetInt32("id").ToString("D6") : reader.GetString("suspect_id"),
                                    Name = reader.GetString("name"),
                                    Gender = reader.GetString("gender"),
                                    DateOfBirth = reader.IsDBNull(reader.GetOrdinal("date_of_birth")) ?
                                        null : reader.GetDateTime("date_of_birth"),
                                    Address = reader.IsDBNull(reader.GetOrdinal("address")) ?
                                        "" : reader.GetString("address"),
                                    IdentificationNumber = reader.IsDBNull(reader.GetOrdinal("identification_number")) ?
                                        "" : reader.GetString("identification_number"),
                                    CreatedAt = reader.GetDateTime("created_at")
                                };

                                // Add complaint information if available
                                if (!reader.IsDBNull(reader.GetOrdinal("complaint_id")))
                                {
                                    suspect.ComplaintId = reader.GetInt32("complaint_id");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("complaint_case_number")))
                                {
                                    suspect.ComplaintCaseNumber = reader.GetString("complaint_case_number");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("crime_type")))
                                {
                                    suspect.CrimeType = reader.GetString("crime_type");
                                }

                                suspects.Add(suspect);
                            }
                        }
                    }
                }

                return Ok(suspects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve suspects: " + ex.Message });
            }
        }

        // NEW: Get suspect by ID with full details
        [HttpGet("{id}")]
        public IActionResult GetSuspect(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"SELECT s.*, 
                                   c.case_number as complaint_case_number, 
                                   c.crime_type,
                                   c.description as complaint_description,
                                   c.status as complaint_status
                                   FROM suspects s 
                                   LEFT JOIN complaints c ON s.complaint_id = c.id 
                                   WHERE s.id = @id";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@id", id);

                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                var suspect = new Suspect
                                {
                                    Id = reader.GetInt32("id"),
                                    SuspectId = reader.IsDBNull(reader.GetOrdinal("suspect_id")) ?
                                        "SUS-" + reader.GetInt32("id").ToString("D6") : reader.GetString("suspect_id"),
                                    Name = reader.GetString("name"),
                                    Gender = reader.GetString("gender"),
                                    DateOfBirth = reader.IsDBNull(reader.GetOrdinal("date_of_birth")) ?
                                        null : reader.GetDateTime("date_of_birth"),
                                    Address = reader.IsDBNull(reader.GetOrdinal("address")) ?
                                        "" : reader.GetString("address"),
                                    IdentificationNumber = reader.IsDBNull(reader.GetOrdinal("identification_number")) ?
                                        "" : reader.GetString("identification_number"),
                                    CreatedAt = reader.GetDateTime("created_at")
                                };

                                // Add complaint information if available
                                if (!reader.IsDBNull(reader.GetOrdinal("complaint_id")))
                                {
                                    suspect.ComplaintId = reader.GetInt32("complaint_id");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("complaint_case_number")))
                                {
                                    suspect.ComplaintCaseNumber = reader.GetString("complaint_case_number");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("crime_type")))
                                {
                                    suspect.CrimeType = reader.GetString("crime_type");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("complaint_description")))
                                {
                                    suspect.ComplaintDescription = reader.GetString("complaint_description");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("complaint_status")))
                                {
                                    suspect.ComplaintStatus = reader.GetString("complaint_status");
                                }

                                return Ok(suspect);
                            }
                            else
                            {
                                return NotFound(new { error = "Suspect not found" });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve suspect: " + ex.Message });
            }
        }
    }
}