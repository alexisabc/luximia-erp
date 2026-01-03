from django.core.management.base import BaseCommand
from django.core.files.uploadedfile import SimpleUploadedFile
import os
from django.contrib.auth import get_user_model
from contabilidad.views import EmpresaFiscalViewSet
from rest_framework.test import APIRequestFactory

class Command(BaseCommand):
    help = 'Test CSD Upload Endpoint'

    def handle(self, *args, **kwargs):
        if not os.path.exists("key.pem") or not os.path.exists("cert.pem"):
            self.stdout.write(self.style.ERROR("Generate keys first using demo_cfdi"))
            return

        with open("key.pem", "rb") as f:
            key_data = f.read()
        with open("cert.pem", "rb") as f:
            cer_data = f.read()

        User = get_user_model()
        user = User.objects.filter(is_superuser=True).first()
        if not user:
             self.stdout.write(self.style.WARNING("Creating temp superuser"))
             user = User.objects.create_superuser('admin_test', 'admin@test.com', 'admin')
        
        # Ensure user is staff and has all permissions
        user.is_staff = True
        user.is_superuser = True
        user.save()
             
        factory = APIRequestFactory()
        
        data = {
            'cer_file': SimpleUploadedFile("test.cer", cer_data),
            'key_file': SimpleUploadedFile("test.key", key_data),
            'password': ''
        }

        self.stdout.write("Uploading CSD...")
        try:
            request = factory.post('/api/contabilidad/configuracion-fiscal/upload_csd/', data, format='multipart')
            # Force authentication
            from rest_framework.test import force_authenticate
            force_authenticate(request, user=user)
            
            view = EmpresaFiscalViewSet.as_view({'post': 'upload_csd'})
            response = view(request)
            
            if response.status_code == 200:
                 self.stdout.write(self.style.SUCCESS(f"Success! {response.data}"))
            else:
                 self.stdout.write(self.style.ERROR(f"Failed: {response.status_code} - {response.data}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception during request: {e}"))
