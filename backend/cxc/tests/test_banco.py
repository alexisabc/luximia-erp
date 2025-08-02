from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from cxc.models import Banco, Proyecto, Moneda


class BancoCRUDTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test', password='pass')
        self.client.force_authenticate(self.user)
        self.list_url = reverse('banco-list')

    def test_create_list_update_delete_banco(self):
        data = {
            'clave': '001',
            'nombre_corto': 'Banco Uno',
            'razon_social': 'Banco Uno S.A.'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        banco_id = response.data['id']
        self.assertEqual(Banco.objects.count(), 1)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

        detail_url = reverse('banco-detail', args=[banco_id])
        response = self.client.patch(detail_url, {'nombre_corto': 'Banco1'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre_corto'], 'Banco1')

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Banco.objects.count(), 0)


class ProyectoUPEValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test2', password='pass')
        self.client.force_authenticate(self.user)
        self.proyecto_url = reverse('proyecto-list')
        self.upe_url = reverse('upe-list')
        self.proyecto = Proyecto.objects.create(nombre='P1')
        self.moneda = Moneda.objects.create(codigo='MXN', nombre='Peso')

    def test_proyecto_unique_name(self):
        response = self.client.post(self.proyecto_url, {'nombre': 'P1'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upe_unique_identificador(self):
        payload = {
            'identificador': 'A1',
            'proyecto': self.proyecto.id,
            'nivel': 1,
            'metros_cuadrados': '100.00',
            'estacionamientos': 1,
            'valor_total': '1000.00',
            'moneda': self.moneda.id,
        }
        response = self.client.post(self.upe_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.upe_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
