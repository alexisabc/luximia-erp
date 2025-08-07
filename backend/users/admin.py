# backend/users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EnrollmentToken

# Registra aquí los modelos de la app 'users'
admin.site.register(CustomUser, UserAdmin)
# Es útil ver los tokens en el admin durante el desarrollo
admin.site.register(EnrollmentToken)
