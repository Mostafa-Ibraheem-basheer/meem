param (
    [string]$name
)

Get-Content ".\src\migrations\$name.sql" -Raw |
    docker exec -i my-postgres psql -U postgres -d meem