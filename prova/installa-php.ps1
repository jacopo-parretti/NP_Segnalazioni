param(
    [Parameter(Mandatory = $true)][string]$Destinazione
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$pacchetti = @(
    @{
        Url = 'https://downloads.php.net/~windows/releases/archives/php-8.2.7-nts-Win32-vs16-x64.zip'
        Sha256 = 'C69EA318DD3185931BE29431DE2CD04260806ACD2EDE08DD8E869AEC02995DBA'
        Nome = 'php.zip'
    },
    @{
        Url = 'https://github.com/microsoft/msphpsql/releases/download/v5.12.0/Windows_5.12.0RTW.zip'
        Sha256 = '48C2067C8FC4683418D3096807AF92A65660245BE846A61BB65F93D28272FF71'
        Nome = 'sqlsrv.zip'
    }
)

$temp = Join-Path ([IO.Path]::GetTempPath()) ('np-php-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
try {
    foreach ($p in $pacchetti) {
        $file = Join-Path $temp $p.Nome
        Write-Host ('Scarico ' + $p.Url)
        Invoke-WebRequest -Uri $p.Url -OutFile $file -UseBasicParsing -UserAgent 'Mozilla/5.0'
        $hash = (Get-FileHash -Algorithm SHA256 -Path $file).Hash
        if ($hash -ne $p.Sha256) {
            throw ('Hash inatteso per ' + $p.Nome + ': ' + $hash)
        }
    }
    New-Item -ItemType Directory -Force -Path $Destinazione | Out-Null
    Expand-Archive -Path (Join-Path $temp 'php.zip') -DestinationPath $Destinazione -Force
    $estratti = Join-Path $temp 'sqlsrv'
    Expand-Archive -Path (Join-Path $temp 'sqlsrv.zip') -DestinationPath $estratti -Force
    Copy-Item -Path (Join-Path $estratti 'Windows\php_sqlsrv_82_nts_x64.dll') -Destination (Join-Path $Destinazione 'ext') -Force
    $ini = @(
        '[PHP]',
        'extension_dir = "ext"',
        'extension = curl',
        'extension = php_sqlsrv_82_nts_x64.dll',
        'display_errors = Off',
        'log_errors = On',
        'error_reporting = E_ALL',
        'date.timezone = Europe/Rome',
        'default_charset = "UTF-8"',
        'session.use_strict_mode = 1',
        'session.cookie_httponly = 1',
        ''
    ) -join "`r`n"
    [IO.File]::WriteAllText((Join-Path $Destinazione 'php.ini'), $ini)
    Write-Host ('PHP 8.2.7 con sqlsrv installato in ' + $Destinazione)
}
finally {
    Remove-Item -Recurse -Force -Path $temp -ErrorAction SilentlyContinue
}
