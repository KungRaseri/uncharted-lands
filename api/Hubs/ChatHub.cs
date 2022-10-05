using Microsoft.AspNetCore.SignalR;

namespace api.Hubs;

public class ChatHub : Hub
{
    public async Task SendMessageToAll(string user, string message) => await Clients.All.SendAsync("ReceiveMessage", user, message);
    public async Task SendMessageToCaller(string user, string message) => await Clients.Caller.SendAsync("ReceiveMessage", user, message);
    public async Task SendMessageToGroup(string user, string message, string group) => await Clients.Group(group).SendAsync("ReceiveMessage", user, message);
    public async Task SendMessageToUser(string user, string message) => await Clients.User(user).SendAsync("ReceiveMessage", user, message);

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Administrators");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}