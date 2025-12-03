# PowerShell script to copy SSH public key to remote server
# Usage: .\ssh_copy_id.ps1 -User <username> -Host <hostname> -PublicKeyPath <path_to_public_key>

param(
    [Parameter(Mandatory=$true)][string]$User,
    [Parameter(Mandatory=$true)][string]$Host,
    [string]$PublicKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
)

# Check if public key file exists
if (-not (Test-Path $PublicKeyPath)) {
    Write-Error "Public key file not found at $PublicKeyPath"
    exit 1
}

# Read public key content
$publicKey = Get-Content $PublicKeyPath

# Create the ssh-copy-id equivalent command
$command = "mkdir -p ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# Execute the command on remote server
Write-Host "Copying public key to $User@$Host..."
ssh "$User@$Host" "$command"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Public key successfully copied to $User@$Host"
    Write-Host "You can now login without password using: ssh $User@$Host"
} else {
    Write-Error "Failed to copy public key. Please check your SSH connection and try again."
    exit 1
}