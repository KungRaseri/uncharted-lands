using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using api.Services;

namespace api.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class WeatherController : ControllerBase
{
    private readonly WeatherService _weatherService;

    private readonly ILogger<WeatherController> _logger;

    public WeatherController(WeatherService weatherService, ILogger<WeatherController> logger)
    {
        _weatherService = weatherService;
        _logger = logger;
    }

    /// <summary>
    /// Get the Geo Location for the given query
    /// </summary>
    /// <param name="q">Location (City, Area, etc.)</param>
    /// <param name="limit"></param>
    /// <param name="appid"></param>
    /// <returns></returns>
    [HttpGet]
    public async Task<JsonResult> GetGeoLocation([FromQuery] string q, [FromQuery] int limit, [FromQuery] string appid)
    {
        return new JsonResult(await _weatherService.GetGeoLocation(q, limit, appid));
    }

    /// <summary>
    /// Get the Weather Forecast for the given location
    /// </summary>
    /// <param name="lat"></param>
    /// <param name="lon"></param>
    /// <param name="exclude"></param>
    /// <param name="appid"></param>
    /// <returns></returns>
    [HttpGet]
    public async Task<JsonResult> GetForecast([FromQuery] Decimal lat, [FromQuery] Decimal lon, [FromQuery] string exclude, [FromQuery] string appid)
    {
        return new JsonResult(await _weatherService.GetForecast(lat, lon, exclude, appid));
    }
}
