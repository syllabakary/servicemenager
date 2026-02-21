# Copie le dossier media (logos, images agences) vers le serveur.
# À lancer depuis votre MACHINE LOCALE dans PowerShell, depuis la racine du projet.
#
# Usage : .\sync-media-to-server.ps1
# Ou après avoir adapté les variables ci-dessous.

# --- À ADAPTER ---
$User = "root"
$ServerHost = "76.13.56.224"
$ServerPath = "/opt/servicemenager"

$MediaDir = "backend\media"
if (-not (Test-Path $MediaDir)) {
    Write-Error "Dossier $MediaDir introuvable. Lancez ce script depuis la racine du projet."
    exit 1
}

$Target = "${User}@${ServerHost}:${ServerPath}/backend/"
Write-Host "Envoi de $MediaDir vers $Target"
scp -r $MediaDir $Target
Write-Host "Terminé. Les images (logo, agences) devraient maintenant s'afficher sur le site."
