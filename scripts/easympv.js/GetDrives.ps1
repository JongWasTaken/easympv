# Microsoft has deprecated the WMIC cli app, so we need to use the powershell version.
# From https://www.jasongaylord.com/blog/using-powershell-to-obtain-cd-dvd-disk-information

#Value	Description
#0	Unknown
#1	No Root Directory
#2	Removable Disk
#3	Local Disk
#4	Network Drive
#5	Compact Disc
#6	RAM Disk

param([string]$type="2") 
$fstring = ""
$filter = "DriveType = "+$type
try 
{
    $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop;

    $w | ForEach-Object {
        $fstring += $_.DeviceID + "|"
    }

}
Catch [system.exception]
{exit 1}

$fstring = $fstring -replace "(.*)\|(.*)", '$1$2'

Write-Output $fstring
exit 0