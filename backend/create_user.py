"""
Script to create a default user for the application.
Run: python manage.py shell < create_user.py
Or run interactively in Django shell.
"""
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Create default user if it doesn't exist
username = 'admin'
password = 'admin'

if not User.objects.filter(username=username).exists():
    user = User.objects.create_user(username=username, password=password)
    token = Token.objects.create(user=user)
    print(f"User '{username}' created successfully!")
    print(f"Token: {token.key}")
else:
    user = User.objects.get(username=username)
    user.set_password(password)
    user.save()
    token, created = Token.objects.get_or_create(user=user)
    print(f"User '{username}' already exists. Password reset.")
    print(f"Token: {token.key}")
