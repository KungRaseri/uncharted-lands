using api.Hubs;
using api.Model;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace api
{
    public class GameManager
    {
        private readonly IHubContext<GameHub> _context;
        private readonly static Lazy<GameHub> _instance = new Lazy<GameHub>();
        private static ServerData _serverData = new ServerData();
        private readonly ConcurrentDictionary<string, Player> _players = new ConcurrentDictionary<string, Player>();
        private readonly ConcurrentDictionary<string, Npc> _npcs = new ConcurrentDictionary<string, Npc>();

        private readonly Timer _gameTickTimer;
        private int _gameTickInterval = 1000;

        public GameManager(IHubContext<GameHub> hub)
        {
            _context = hub;
            _serverData = LoadServerData();
            _players = new ConcurrentDictionary<string, Player>();
            _npcs = new ConcurrentDictionary<string, Npc>();

            _gameTickTimer = new Timer(GameTickUpdate, null, _gameTickInterval, _gameTickInterval);
        }

        private ServerData LoadServerData()
        {
            return _serverData;
        }

        private async void GameTickUpdate(object? state)
        {
            await _context.Clients.All.SendAsync("GameTick", DateTime.UtcNow);

            if (DateTime.Now.Minute == 0 && DateTime.Now.Second == 0)
            {
                // do hourly updates
                await _context.Clients.All.SendAsync("HourlyTick", DateTime.UtcNow);
            }

            if (DateTime.Now.Minute == 30 && DateTime.Now.Second == 0)
            {
                // do hourly updates on the half hour mark
                await _context.Clients.All.SendAsync("HalfHourHourlyTick", DateTime.UtcNow);
            }
        }
    }
}
