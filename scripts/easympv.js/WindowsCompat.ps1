# WINDOWSCOMPAT.PS1
#
# Author:              Jong
# URL:                 https://smto.pw/mpv
# License:             MIT License
#
# This file does all the windows-specific things that are not possible using mpv.

param([string]$command="",[string]$arguments="")

$webclient = New-Object System.Net.WebClient

if($command -eq "get-version-latest")
{
    $latest = $webclient.DownloadString("https://smto.pw/mpv/hosted/latest.json")
    Write-Output $latest.Trim()
    exit 0
}

if($command -eq "get-version-latest-mpv")
{
    $latest = $webclient.DownloadString("https://smto.pw/mpv/meta/mpv")
    Write-Output $latest.Trim()
    exit 0
}

if($command -eq "get-connection-status")
{
    $status = Test-Connection smto.pw -Quiet
    Write-Output $status
    exit 0
}



if($command -eq "get-package")
{

    if(Test-Path -Path "$env:APPDATA\mpv\package.zip" -PathType Any)
    {Remove-Item -Path "$env:APPDATA\mpv\package.zip" -Force}
    try 
    {
        $webclient.DownloadFile("https://smto.pw/mpv/hosted/$arguments")
    }
    Catch [system.exception]
    {exit 1}
    exit 0
}

if($command -eq "extract-package")
{
    try 
    {
        New-Item -ItemType directory -Path "$env:APPDATA\mpv\extractedPackage" -Force

        $shell = New-Object -ComObject Shell.Application
        $zip = $shell.Namespace("$env:APPDATA\mpv\package.zip")
        $items = $zip.items()
        $shell.Namespace("$env:APPDATA\mpv\extractedPackage").CopyHere($items, 1556)
    }
    Catch [system.exception]
    {exit 1}
    exit 0
}

if($command -eq "remove-package")
{
    if(Test-Path -Path "$env:APPDATA\mpv\package.zip" -PathType Any)
    {Remove-Item -Path "$env:APPDATA\mpv\package.zip" -Force}
}

if($command -eq "apply-package")
{
    if(Test-Path -Path "$env:APPDATA\mpv\extractedPackage" -PathType Any)
    {
        Copy-Item -Path "$env:APPDATA\mpv\extractedPackage\*" -Destination "$env:APPDATA\mpv" -Recurse
        Remove-Item -Path "$env:APPDATA\mpv\extractedPackage" -Force
    }
}

if($command -eq "remove-file")
{
    if(Test-Path -Path "$env:APPDATA\mpv\$arguments" -PathType Any)
    {Remove-Item -Path "$env:APPDATA\mpv\$arguments" -Force}
}

if($command -eq "get-gpus")
{
    $fstring = ""
    foreach($gpu in Get-WmiObject Win32_VideoController)
    {
            $fstring += $gpu.Description
            $fstring += "|"
    }
    $fstring = $fstring -replace "(.*)\|(.*)", '$1$2'
    Write-Output $fstring
}

if($command -eq "get-drive-usb")
{
    $fstring = ""
    $filter = "DriveType = 2" # usb
    try 
    {
        $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop;
    
        $w | ForEach-Object {
            $fstring += $_.DeviceID + "|"
        }
    
    }
    Catch [system.exception]
    {exit 1}
    if($w.Count -eq 0){exit 1}
    $fstring = $fstring -replace "(.*)\|(.*)", '$1$2'
    
    Write-Output $fstring
    exit 0
}

if($command -eq "get-drive-disc")
{
    $fstring = ""
    $filter = "DriveType = 5" # cd
    try 
    {
        $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop;
    
        $w | ForEach-Object {
            $fstring += $_.DeviceID + "|"
        }
    
    }
    Catch [system.exception]
    {exit 1}
    if($w.Count -eq 0){exit 1}
    $fstring = $fstring -replace "(.*)\|(.*)", '$1$2'
    
    Write-Output $fstring
    exit 0
}

if($command -eq "get-drive-local")
{
    $fstring = ""
    $filter = "DriveType = 3" # local
    try 
    {
        $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop;
    
        $w | ForEach-Object {
            $fstring += $_.DeviceID + "|"
        }
    
    }
    Catch [system.exception]
    {exit 1}
    if($w.Count -eq 0){exit 1}
    $fstring = $fstring -replace "(.*)\|(.*)", '$1$2'
    
    Write-Output $fstring
    exit 0
}

if($command -eq "get-drive-network")
{
    $fstring = ""
    $filter = "DriveType = 4" # network
    try 
    {
        $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop;
    
        $w | ForEach-Object {
            $fstring += $_.DeviceID + "|"
        }
    
    }
    Catch [system.exception]
    {exit 1}
    if($w.Count -eq 0){exit 1}
    $fstring = $fstring -replace "(.*)\|(.*)", '$1$2'
    
    Write-Output $fstring
    exit 0
}

if($command -eq "show-url-box")
{
    # From https://docs.microsoft.com/en-us/powershell/scripting/samples/creating-a-custom-input-box?view=powershell-7.2
    # This is basically the windows equivalent of zenity --forms

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'mpv'
    $form.Size = New-Object System.Drawing.Size(300,200)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MinimizeBox = $false
    $form.MaximizeBox = $false

    $okButton = New-Object System.Windows.Forms.Button
    $okButton.Location = New-Object System.Drawing.Point(75,120)
    $okButton.Size = New-Object System.Drawing.Size(75,23)
    $okButton.Text = 'OK'
    $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.AcceptButton = $okButton
    $form.Controls.Add($okButton)

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Location = New-Object System.Drawing.Point(150,120)
    $cancelButton.Size = New-Object System.Drawing.Size(75,23)
    $cancelButton.Text = 'Cancel'
    $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.CancelButton = $cancelButton
    $form.Controls.Add($cancelButton)

    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(10,20)
    $label.Size = New-Object System.Drawing.Size(280,20)
    $label.Text = 'Paste URL:'
    $form.Controls.Add($label)

    $textBox = New-Object System.Windows.Forms.TextBox
    $textBox.Location = New-Object System.Drawing.Point(10,40)
    $textBox.Size = New-Object System.Drawing.Size(260,20)
    $form.Controls.Add($textBox)

    $form.Topmost = $true

    $form.Add_Shown({$textBox.Select()})
    $result = $form.ShowDialog()

    if ($result -eq [System.Windows.Forms.DialogResult]::OK)
    {
        $x = $textBox.Text
        Write-Output $x
        exit 0
    }
    else
    {
        exit 1
    }
}

if($command -eq "show-command-box")
{
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'mpv'
    $form.Size = New-Object System.Drawing.Size(300,200)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MinimizeBox = $false
    $form.MaximizeBox = $false

    $okButton = New-Object System.Windows.Forms.Button
    $okButton.Location = New-Object System.Drawing.Point(75,120)
    $okButton.Size = New-Object System.Drawing.Size(75,23)
    $okButton.Text = 'OK'
    $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.AcceptButton = $okButton
    $form.Controls.Add($okButton)

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Location = New-Object System.Drawing.Point(150,120)
    $cancelButton.Size = New-Object System.Drawing.Size(75,23)
    $cancelButton.Text = 'Cancel'
    $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.CancelButton = $cancelButton
    $form.Controls.Add($cancelButton)

    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(10,20)
    $label.Size = New-Object System.Drawing.Size(280,20)
    $label.Text = 'mpv command:'
    $form.Controls.Add($label)

    $textBox = New-Object System.Windows.Forms.TextBox
    $textBox.Location = New-Object System.Drawing.Point(10,40)
    $textBox.Size = New-Object System.Drawing.Size(260,20)
    $form.Controls.Add($textBox)

    $form.Topmost = $true

    $form.Add_Shown({$textBox.Select()})
    $result = $form.ShowDialog()

    if ($result -eq [System.Windows.Forms.DialogResult]::OK)
    {
        $x = $textBox.Text
        Write-Output $x
        exit 0
    }
    else
    {
        exit 1
    }
}

exit 1

# Below is the source code for the included GetDevices.exe application:
# Slightly modified DShow example code from MSDN
# Remove the first # and compile with Visual Studio

##include <windows.h>
##include <dshow.h>
##pragma comment(lib, "strmiids")
# HRESULT EnumerateDevices(REFGUID category, IEnumMoniker** ppEnum)
# {
#     ICreateDevEnum* pDevEnum;
#     HRESULT hr = CoCreateInstance(CLSID_SystemDeviceEnum, NULL,
#         CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pDevEnum));
#     if (SUCCEEDED(hr))
#     {
#         hr = pDevEnum->CreateClassEnumerator(category, ppEnum, 0);
#         if (hr == S_FALSE)
#         {
#             hr = VFW_E_NOT_FOUND;
#         }
#         pDevEnum->Release();
#     }
#     return hr;
# }
# void DisplayDeviceInformation(IEnumMoniker* pEnum)
# {
#     IMoniker* pMoniker = NULL;
#     while (pEnum->Next(1, &pMoniker, NULL) == S_OK)
#     {
#         IPropertyBag* pPropBag;
#         HRESULT hr = pMoniker->BindToStorage(0, 0, IID_PPV_ARGS(&pPropBag));
#         if (FAILED(hr))
#         {
#             pMoniker->Release();
#             continue;
#         }
#         VARIANT var;
#         VariantInit(&var);
#         hr = pPropBag->Read(L"Description", &var, 0);
#         if (FAILED(hr))
#         {
#             hr = pPropBag->Read(L"FriendlyName", &var, 0);
#         }
#         if (SUCCEEDED(hr))
#         {
#             printf("%S|", var.bstrVal);
#             VariantClear(&var);
#         }
#         hr = pPropBag->Write(L"FriendlyName", &var);
#         pPropBag->Release();
#         pMoniker->Release();
#     }
# }
# void main()
# {
#     HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
#     if (SUCCEEDED(hr))
#     {
#         IEnumMoniker* pEnum;
#         hr = EnumerateDevices(CLSID_VideoInputDeviceCategory, &pEnum);
#         if (SUCCEEDED(hr))
#         {
#             DisplayDeviceInformation(pEnum);
#             pEnum->Release();
#         }
#         CoUninitialize();
#     }
# }