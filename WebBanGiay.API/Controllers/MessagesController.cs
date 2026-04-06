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
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MessagesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/messages - Get messages for current user
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetUserMessages()
        {
            var userIdString = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
                return Unauthorized();

            var messages = await _context.Messages
                .Where(m => m.UserId == userId)
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

        // POST: api/messages - Send a message
        [HttpPost]
        public async Task<ActionResult<MessageDto>> SendMessage(CreateMessageDto createMessageDto)
        {
            var userIdString = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
                return Unauthorized();

            var message = new Message
            {
                UserId = userId,
                Content = createMessageDto.Content,
                IsFromUser = createMessageDto.IsFromUser,
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var messageDto = new MessageDto
            {
                Id = message.Id,
                UserId = message.UserId,
                UserName = User.FindFirst("fullName")?.Value ?? "Unknown User",
                Content = message.Content,
                IsFromUser = message.IsFromUser,
                IsRead = message.IsRead,
                CreatedAt = message.CreatedAt
            };

            return CreatedAtAction(nameof(GetUserMessages), new { id = message.Id }, messageDto);
        }

        // PUT: api/messages/{id}/read - Mark message as read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userIdString = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
                return Unauthorized();

            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (message == null)
                return NotFound();

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/messages/unread-count - Get unread messages count
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userIdString = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
                return Unauthorized();

            var count = await _context.Messages
                .CountAsync(m => m.UserId == userId && !m.IsRead && !m.IsFromUser);

            return Ok(count);
        }
    }
}