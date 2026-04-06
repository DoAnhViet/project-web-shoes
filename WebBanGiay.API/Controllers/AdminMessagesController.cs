using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Middleware;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    [RequireRole("Admin")]
    public class AdminMessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminMessagesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/messages - Get all messages for admin
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetAllMessages()
        {
            var messages = await _context.Messages
                .Include(m => m.User)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    UserName = m.User != null ? m.User.FullName : "Unknown User",
                    Content = m.Content,
                    IsFromUser = m.IsFromUser,
                    IsRead = m.IsRead,
                    CreatedAt = m.CreatedAt,
                    ReadAt = m.ReadAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        // GET: api/admin/messages/conversations - Get conversations grouped by user
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<object>>> GetConversations()
        {
            var conversations = await _context.Messages
                .Include(m => m.User)
                .GroupBy(m => m.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    UserName = g.First().User != null ? g.First().User.FullName : "Unknown User",
                    UserEmail = g.First().User != null ? g.First().User.Email : "",
                    LastMessage = g.OrderByDescending(m => m.CreatedAt).First().Content,
                    LastMessageTime = g.Max(m => m.CreatedAt),
                    UnreadCount = g.Count(m => !m.IsRead && m.IsFromUser),
                    TotalMessages = g.Count()
                })
                .OrderByDescending(c => c.LastMessageTime)
                .ToListAsync();

            return Ok(conversations);
        }

        // GET: api/admin/messages/user/{userId} - Get messages for specific user
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetUserMessages(string userId)
        {
            if (!int.TryParse(userId, out var parsedUserId))
                return BadRequest("Invalid user ID");

            var messages = await _context.Messages
                .Where(m => m.UserId == parsedUserId)
                .Include(m => m.User)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    UserName = m.User != null ? m.User.FullName : "Unknown User",
                    Content = m.Content,
                    IsFromUser = m.IsFromUser,
                    IsRead = m.IsRead,
                    CreatedAt = m.CreatedAt,
                    ReadAt = m.ReadAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        // POST: api/admin/messages/user/{userId} - Send message to user
        [HttpPost("user/{userId}")]
        public async Task<ActionResult<MessageDto>> SendMessageToUser(string userId, CreateMessageDto createMessageDto)
        {
            if (!int.TryParse(userId, out var parsedUserId))
                return BadRequest("Invalid user ID");

            // Verify user exists
            var user = await _context.Users.FindAsync(parsedUserId);
            if (user == null)
                return NotFound("User not found");

            var message = new Message
            {
                UserId = parsedUserId,
                Content = createMessageDto.Content,
                IsFromUser = false, // Admin message
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var messageDto = new MessageDto
            {
                Id = message.Id,
                UserId = message.UserId,
                UserName = user.FullName,
                Content = message.Content,
                IsFromUser = message.IsFromUser,
                IsRead = message.IsRead,
                CreatedAt = message.CreatedAt
            };

            return CreatedAtAction(nameof(GetUserMessages), new { userId = userId }, messageDto);
        }

        // PUT: api/admin/messages/{id}/read - Mark message as read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null)
                return NotFound();

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/admin/messages/summary - Get message summary for admin
        [HttpGet("summary")]
        public async Task<ActionResult<MessageSummaryDto>> GetMessageSummary()
        {
            var totalMessages = await _context.Messages.CountAsync();
            var unreadMessages = await _context.Messages.CountAsync(m => !m.IsRead && m.IsFromUser);
            var totalUsers = await _context.Messages.Select(m => m.UserId).Distinct().CountAsync();

            var summary = new MessageSummaryDto
            {
                TotalMessages = totalMessages,
                UnreadMessages = unreadMessages,
                TotalUsers = totalUsers
            };

            return Ok(summary);
        }
    }
}