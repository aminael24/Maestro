FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["GitHubService.csproj", "./"]
RUN dotnet restore "GitHubService.csproj"

COPY . ./
RUN dotnet publish "GitHubService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GitHubService.dll"]
