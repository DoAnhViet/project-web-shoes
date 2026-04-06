namespace WebBanGiay.API.DTOs
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsFromUser { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    public class CreateMessageDto
    {
        public string Content { get; set; } = string.Empty;
        public bool IsFromUser { get; set; } = true;
    }

    public class MessageSummaryDto
    {
        public int TotalMessages { get; set; }
        public int UnreadMessages { get; set; }
        public int TotalUsers { get; set; }
    }
}