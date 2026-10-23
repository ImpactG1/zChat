; Inno Setup Script for zChat Desktop
; Compatible with Inno Setup 5 and Inno Setup 6

#define MyAppName "zChat"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "ImpactG1"
#define MyAppURL "https://github.com/ImpactG1/zChat"
#define MyAppExeName "zChat.exe"

[Setup]
AppId={{E14D2A4B-391B-4FD6-B578-8DFE63D0845B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=README.md
OutputDir=release
OutputBaseFilename=zChat-Setup-v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Dist web bundle and Electron runtime assets
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "electron\*"; DestDir: "{app}\electron"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
; If using pre-packaged electron binaries from dist_electron, include them below:
; Source: "dist_electron\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\electron\main.cjs"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\electron\main.cjs"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: shellexec postinstall skipifsilent
