Set-Location .\api
dotnet restore --project .\api.csproj
dotnet build --project .\api.csproj --without-restore
dotnet run --project .\api.csproj