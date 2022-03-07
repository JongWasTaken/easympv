# Microsoft has deprecated the WMIC cli app, so we need to use the powershell version.
# From https://www.jasongaylord.com/blog/using-powershell-to-obtain-cd-dvd-disk-information
Function Get-Discs
{
    $deviceId = ""
    try 
    {
        $w = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType = 2 or DriveType = 5" -errorvariable MyErr -erroraction Stop;
        if ($w.Count -gt 0) 
        {
            $w | ForEach-Object {
                $deviceId = $_.DeviceID
                if ($deviceId.Length -eq 0) 
                {
                    $err = "No drive found."
                }
                Write-Output 
            }
        } else {
            $deviceId = $w.DeviceID
            if ($deviceId.Length -eq 0) 
            {
                $err = "No drive found."
            }
            Write-Output $deviceId
        }
    }
    Catch [system.exception]
    {exit 1}
}

# Execute this function
Write-Output Get-Discs
exit 0