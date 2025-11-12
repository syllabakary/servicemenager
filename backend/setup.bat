@echo off
echo Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

echo Installation des dependances...
pip install -r requirements.txt

echo Creation des migrations...
python manage.py makemigrations

echo Application des migrations...
python manage.py migrate

echo.
echo ========================================
echo Backend Django configure avec succes!
echo ========================================
echo.
echo Pour creer un superutilisateur:
echo   python manage.py createsuperuser
echo.
echo Pour lancer le serveur:
echo   python manage.py runserver
echo.

pause




