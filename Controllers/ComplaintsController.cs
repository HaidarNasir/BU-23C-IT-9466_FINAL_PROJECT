using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using PoliceCaseManagementSystem.Models;
using System;
using System.Collections.Generic;

namespace PoliceCaseManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComplaintsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ComplaintsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetComplaints()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var complaints = new List<Complaint>();

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"SELECT c.*, 
                                   u.full_name as assigned_officer_name,
                                   closed_by.full_name as closed_by_officer_name
                                   FROM complaints c 
                                   LEFT JOIN users u ON c.assigned_officer_id = u.id 
                                   LEFT JOIN users closed_by ON c.closed_by_officer_id = closed_by.id
                                   ORDER BY c.created_at DESC";

                    using (var command = new MySqlCommand(query, connection))
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var complaint = new Complaint
                            {
                                Id = reader.GetInt32("id"),
                                CaseNumber = reader.GetString("case_number"),
                                ComplainantName = reader.GetString("complainant_name"),
                                ComplainantContact = reader.GetString("complainant_contact"),
                                CrimeType = reader.GetString("crime_type"),
                                CrimeLocation = reader.GetString("crime_location"),
                                Description = reader.GetString("description"),
                                Status = reader.GetString("status"),
                                Priority = reader.GetString("priority"),
                                DateReported = reader.GetDateTime("date_reported"),
                                AssignedOfficerId = reader.IsDBNull(reader.GetOrdinal("assigned_officer_id")) ?
                                    null : reader.GetInt32("assigned_officer_id"),
                                AssignedOfficerName = reader.IsDBNull(reader.GetOrdinal("assigned_officer_name")) ?
                                    "Not Assigned" : reader.GetString("assigned_officer_name"),
                                CreatedBy = reader.GetInt32("created_by"),
                                CreatedAt = reader.GetDateTime("created_at"),
                                UpdatedAt = reader.GetDateTime("updated_at")
                            };

                            // Add closure information if available
                            if (!reader.IsDBNull(reader.GetOrdinal("closed_date")))
                            {
                                complaint.ClosedDate = reader.GetDateTime("closed_date");
                            }
                            if (!reader.IsDBNull(reader.GetOrdinal("closure_reason")))
                            {
                                complaint.ClosureReason = reader.GetString("closure_reason");
                            }
                            if (!reader.IsDBNull(reader.GetOrdinal("closure_notes")))
                            {
                                complaint.ClosureNotes = reader.GetString("closure_notes");
                            }
                            if (!reader.IsDBNull(reader.GetOrdinal("closed_by_officer_id")))
                            {
                                complaint.ClosedByOfficerId = reader.GetInt32("closed_by_officer_id");
                            }
                            if (!reader.IsDBNull(reader.GetOrdinal("closed_by_officer_name")))
                            {
                                complaint.ClosedByOfficerName = reader.GetString("closed_by_officer_name");
                            }

                            complaints.Add(complaint);
                        }
                    }
                }

                return Ok(complaints);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve complaints: " + ex.Message });
            }
        }

        // NEW: Get complaint by ID with full details
        [HttpGet("{id}")]
        public IActionResult GetComplaint(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"SELECT c.*, 
                                   u.full_name as assigned_officer_name,
                                   closed_by.full_name as closed_by_officer_name,
                                   creator.full_name as created_by_officer_name
                                   FROM complaints c 
                                   LEFT JOIN users u ON c.assigned_officer_id = u.id 
                                   LEFT JOIN users closed_by ON c.closed_by_officer_id = closed_by.id
                                   LEFT JOIN users creator ON c.created_by = creator.id
                                   WHERE c.id = @id";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@id", id);

                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                var complaint = new Complaint
                                {
                                    Id = reader.GetInt32("id"),
                                    CaseNumber = reader.GetString("case_number"),
                                    ComplainantName = reader.GetString("complainant_name"),
                                    ComplainantContact = reader.GetString("complainant_contact"),
                                    CrimeType = reader.GetString("crime_type"),
                                    CrimeLocation = reader.GetString("crime_location"),
                                    Description = reader.GetString("description"),
                                    Status = reader.GetString("status"),
                                    Priority = reader.GetString("priority"),
                                    DateReported = reader.GetDateTime("date_reported"),
                                    AssignedOfficerId = reader.IsDBNull(reader.GetOrdinal("assigned_officer_id")) ?
                                        null : reader.GetInt32("assigned_officer_id"),
                                    AssignedOfficerName = reader.IsDBNull(reader.GetOrdinal("assigned_officer_name")) ?
                                        "Not Assigned" : reader.GetString("assigned_officer_name"),
                                    CreatedBy = reader.GetInt32("created_by"),
                                    CreatedByOfficerName = reader.IsDBNull(reader.GetOrdinal("created_by_officer_name")) ?
                                        "System" : reader.GetString("created_by_officer_name"),
                                    CreatedAt = reader.GetDateTime("created_at"),
                                    UpdatedAt = reader.GetDateTime("updated_at")
                                };

                                // Add closure information if available
                                if (!reader.IsDBNull(reader.GetOrdinal("closed_date")))
                                {
                                    complaint.ClosedDate = reader.GetDateTime("closed_date");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("closure_reason")))
                                {
                                    complaint.ClosureReason = reader.GetString("closure_reason");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("closure_notes")))
                                {
                                    complaint.ClosureNotes = reader.GetString("closure_notes");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("closed_by_officer_id")))
                                {
                                    complaint.ClosedByOfficerId = reader.GetInt32("closed_by_officer_id");
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("closed_by_officer_name")))
                                {
                                    complaint.ClosedByOfficerName = reader.GetString("closed_by_officer_name");
                                }

                                return Ok(complaint);
                            }
                            else
                            {
                                return NotFound(new { error = "Complaint not found" });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve complaint: " + ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateComplaint([FromBody] ComplaintCreateRequest request)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    // Generate case number
                    string caseNumber = "CASE-" + DateTime.Now.ToString("yyyyMMdd-HHmmss");

                    string query = @"INSERT INTO complaints 
                                   (case_number, complainant_name, complainant_contact, crime_type, 
                                    crime_location, description, priority, assigned_officer_id, created_by) 
                                   VALUES (@caseNumber, @complainantName, @contact, @crimeType, 
                                           @location, @description, @priority, @officerId, 1)";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@caseNumber", caseNumber);
                        command.Parameters.AddWithValue("@complainantName", request.ComplainantName);
                        command.Parameters.AddWithValue("@contact", request.ComplainantContact ?? "");
                        command.Parameters.AddWithValue("@crimeType", request.CrimeType);
                        command.Parameters.AddWithValue("@location", request.CrimeLocation);
                        command.Parameters.AddWithValue("@description", request.Description);
                        command.Parameters.AddWithValue("@priority", request.Priority);
                        command.Parameters.AddWithValue("@officerId", request.AssignedOfficerId);

                        command.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true, message = "Complaint created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create complaint: " + ex.Message });
            }
        }

        [HttpGet("stats")]
        public IActionResult GetComplaintStats()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                var stats = new
                {
                    TotalComplaints = 0,
                    UnderInvestigation = 0,
                    Charged = 0,
                    Closed = 0
                };

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = "SELECT status, COUNT(*) as count FROM complaints GROUP BY status";

                    using (var command = new MySqlCommand(query, connection))
                    using (var reader = command.ExecuteReader())
                    {
                        int total = 0;
                        int underInvestigation = 0;
                        int charged = 0;
                        int closed = 0;

                        while (reader.Read())
                        {
                            string status = reader.GetString("status");
                            int count = reader.GetInt32("count");
                            total += count;

                            switch (status)
                            {
                                case "Under Investigation": underInvestigation = count; break;
                                case "Charged": charged = count; break;
                                case "Closed": closed = count; break;
                            }
                        }

                        stats = new { TotalComplaints = total, UnderInvestigation = underInvestigation, Charged = charged, Closed = closed };
                    }
                }

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get stats: " + ex.Message });
            }
        }

        // NEW: Close complaint endpoint
        [HttpPut("{id}/close")]
        public IActionResult CloseComplaint(int id, [FromBody] CloseComplaintRequest request)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    // First, check if complaint exists and get current status
                    string checkQuery = "SELECT status FROM complaints WHERE id = @id";
                    string currentStatus;

                    using (var checkCommand = new MySqlCommand(checkQuery, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@id", id);
                        var result = checkCommand.ExecuteScalar();
                        if (result == null)
                            return NotFound(new { error = "Complaint not found" });

                        currentStatus = result.ToString();
                    }

                    if (currentStatus == "Closed")
                        return BadRequest(new { error = "Complaint is already closed" });

                    // Update complaint with closure information
                    string updateQuery = @"UPDATE complaints 
                                        SET status = 'Closed',
                                            closed_date = @closedDate,
                                            closure_reason = @closureReason,
                                            closure_notes = @closureNotes,
                                            closed_by_officer_id = @closedByOfficerId,
                                            updated_at = @updatedAt
                                        WHERE id = @id";

                    using (var command = new MySqlCommand(updateQuery, connection))
                    {
                        command.Parameters.AddWithValue("@closedDate", DateTime.Now);
                        command.Parameters.AddWithValue("@closureReason", request.ClosureReason);
                        command.Parameters.AddWithValue("@closureNotes", request.ClosureNotes ?? "");
                        command.Parameters.AddWithValue("@closedByOfficerId", request.ClosedByOfficerId);
                        command.Parameters.AddWithValue("@updatedAt", DateTime.Now);
                        command.Parameters.AddWithValue("@id", id);

                        int affectedRows = command.ExecuteNonQuery();

                        if (affectedRows > 0)
                        {
                            return Ok(new { success = true, message = "Complaint closed successfully" });
                        }
                        else
                        {
                            return StatusCode(500, new { error = "Failed to close complaint" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to close complaint: " + ex.Message });
            }
        }
    }
}