using System;

namespace PoliceCaseManagementSystem.Models
{
    public class Suspect
    {
        public int Id { get; set; }
        public string SuspectId { get; set; }  // This is the automatic ID
        public string Name { get; set; }
        public string Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; }
        public string IdentificationNumber { get; set; }
        public DateTime CreatedAt { get; set; }

        // NEW: Link suspect to complaint
        public int? ComplaintId { get; set; }
        public string ComplaintCaseNumber { get; set; } // For display purposes
        public string CrimeType { get; set; } // From the related complaint

        // NEW: Additional properties for detailed view
        public string ComplaintDescription { get; set; }
        public string ComplaintStatus { get; set; }
        public int? Age
        {
            get
            {
                if (DateOfBirth.HasValue)
                {
                    var today = DateTime.Today;
                    var age = today.Year - DateOfBirth.Value.Year;
                    if (DateOfBirth.Value.Date > today.AddYears(-age)) age--;
                    return age;
                }
                return null;
            }
        }
    }

    public class SuspectCreateRequest
    {
        public string Name { get; set; }
        public string Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; }
        public string IdentificationNumber { get; set; }
        public int? ComplaintId { get; set; } // NEW: Link to complaint
    }
}