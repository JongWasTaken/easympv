
#Get-PnpDevice -Class Camera,image -Status OK

Get-CimInstance -ClassName Win32_PNPEntity | Out-GridView -Title 'Select a device' -OutputMode Single | Select-Object -Property *