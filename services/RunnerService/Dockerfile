FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file first (for caching restore)
COPY ["RunnerService.csproj", "./"]
RUN dotnet restore "RunnerService.csproj"

# Copy everything else
COPY . .

# Build + publish
RUN dotnet publish "RunnerService.csproj" -c Release -o /app/publish --no-restore


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Expose API port (adjust if needed)
EXPOSE 8080

# Copy published output
COPY --from=build /app/publish .

# Start application
ENTRYPOINT ["dotnet", "RunnerService.dll"]