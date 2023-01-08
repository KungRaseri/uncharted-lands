using Microsoft.AspNetCore.SignalR;

namespace api.Hubs;

public class GameHub : Hub
{
    public async Task UpdateGameTime(DateTime gameTime) =>
        await Clients.All.SendAsync("UpdateGameTime", gameTime);
}