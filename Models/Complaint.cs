using System;

namespace PoliceCaseManagementSystem.Models
{
    public class Complaint
    {
        public int Id { get; set; }
        public string CaseNumber { get; set; }
        public string ComplainantName { get; set; }
        public string ComplainantContact { get; set; }
        public string CrimeType { get; set; }
        public string CrimeLocation { get; set; }
        public string Description { get; set; }
        public DateTime DateReported { get; set; }
        public string Status { get; set; }
        public int? AssignedOfficerId { get; set; }
        public string AssignedOfficerName { get; set; }
        public string Priority { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByOfficerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // NEW: Closure properties
        public DateTime? ClosedDate { get; set; }
        public string ClosureReason { get; set; }
        public string ClosureNotes { get; set; }
        public int? ClosedByOfficerId { get; set; }
        public string ClosedByOfficerName { get; set; }

        // NEW: Calculated properties for display
        public string DaysOpen
        {
            get
            {
                var endDate = Status == "Closed" && ClosedDate.HasValue ? ClosedDate.Value : DateTime.Now;
                var days = (endDate - DateReported).TotalDays;
                return $"{(int)days} days";
            }
        }

        public string CurrentStatusBadge
        {
            get
            {
                return Status switch
                {
                    "Closed" => "🔴 Closed",
                    "Under Investigation" => "🟡 Under Investigation",
                    "Charged" => "🔵 Charged",
                    _ => "⚪ " + Status
                };
            }
        }

        public string PriorityBadge
        {
            get
            {
                return Priority switch
                {
                    "High" => "🔴 High",
                    "Medium" => "🟡 Medium",
                    "Low" => "🟢 Low",
                    _ => "⚪ " + Priority
                };
            }
        }
    }

    public class ComplaintCreateRequest
    {
        public string ComplainantName { get; set; }
        public string ComplainantContact { get; set; }
        public string CrimeType { get; set; }
        public string CrimeLocation { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public int? AssignedOfficerId { get; set; }
    }

    // NEW: Close complaint request model
    public class CloseComplaintRequest
    {
        public string ClosureReason { get; set; }
        public string ClosureNotes { get; set; }
        public int ClosedByOfficerId { get; set; }
    }
}