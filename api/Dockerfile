FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 5036
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["./api.csproj", "./"]
RUN dotnet restore "./api.csproj"
COPY . .
RUN dotnet build "api.csproj" -c Release -o /app
FROM build AS publish
RUN dotnet publish "api.csproj" -c Release -o /app
FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "api.dll"]