# Dockerfile pour le backend Django
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Créer les dossiers pour les fichiers statiques et médias
RUN mkdir -p /app/staticfiles /app/media

# Collecter les fichiers statiques (sera fait au build)
# RUN python manage.py collectstatic --noinput

# Exposer le port
EXPOSE 8000

# Créer le dossier de logs
RUN mkdir -p /app/logs

# Commande par défaut (sera override par docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

