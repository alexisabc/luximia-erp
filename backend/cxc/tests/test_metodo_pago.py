from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from cxc.models import MetodoPago


class MetodoPagoCRUDTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test', password='pass')
        self.client.force_authenticate(self.user)
        self.list_url = reverse('metodopago-list')

    def test_create_list_update_delete_metodo_pago(self):
        data = {'nombre': 'EFECTIVO'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        metodo_id = response.data['id']
        self.assertEqual(MetodoPago.objects.count(), 1)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

        detail_url = reverse('metodopago-detail', args=[metodo_id])
        response = self.client.patch(detail_url, {'nombre': 'TRANSFERENCIA'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'TRANSFERENCIA')

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MetodoPago.objects.count(), 0)
