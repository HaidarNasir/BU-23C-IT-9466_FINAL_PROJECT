using System;

namespace PoliceCaseManagementSystem.Models
{
    public class Detention
    {
        public int Id { get; set; }
        public int SuspectId { get; set; }
        public string SuspectName { get; set; }
        public DateTime IntakeTime { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public string Reason { get; set; }
        public int CreatedBy { get; set; }
        public string OfficerName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class DetentionCreateRequest
    {
        public int SuspectId { get; set; }
        public DateTime IntakeTime { get; set; }
        public string Reason { get; set; }
    }
}