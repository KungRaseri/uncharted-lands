
namespace api.Services;

public sealed class WeatherService
{
    private readonly HttpClient _httpClient = null!;
    private readonly ILogger<WeatherService> _logger = null!;

    public WeatherService(
        HttpClient httpClient,
        ILogger<WeatherService> logger) =>
        (_httpClient, _logger) = (httpClient, logger);

    public async Task<object> GetGeoLocation(string q, int limit, string appid)
    {
        var response = await _httpClient.GetAsync($"geo/1.0/direct?q={q}&limit={limit}&appid={appid}");
        var result = await response.Content.ReadFromJsonAsync<object>();

        return result;
    }

    public async Task<object> GetForecast(Decimal lat, Decimal lon, string exclude, string appid)
    {
        var response = await _httpClient.GetAsync($"data/3.0/onecall?lat={lat}&lon={lon}&exclude={exclude}&appid={appid}");
        var result = await response.Content.ReadFromJsonAsync<object>();

        return result;
    }
}