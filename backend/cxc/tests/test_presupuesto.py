from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from cxc.models import Cliente, Proyecto, UPE, Presupuesto


class PresupuestoCRUDTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass')
        self.client.force_authenticate(self.user)
        self.list_url = reverse('presupuesto-list')
        self.cliente = Cliente.objects.create(nombre_completo='Cliente 1')
        self.proyecto = Proyecto.objects.create(nombre='Proyecto 1')
        self.upe = UPE.objects.create(identificador='A1', proyecto=self.proyecto)

    def test_create_update_delete_presupuesto(self):
        data = {
            'cliente': self.cliente.id,
            'proyecto': self.proyecto.id,
            'upe': self.upe.id,
            'monto_apartado': '1000.00',
            'monto_total': '5000.00'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        presupuesto_id = response.data['id']
        self.assertEqual(Presupuesto.objects.count(), 1)

        detail_url = reverse('presupuesto-detail', args=[presupuesto_id])
        response = self.client.patch(detail_url, {'monto_total': '6000.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['monto_total'], '6000.00')

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Presupuesto.objects.count(), 0)


class PresupuestoValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester2', password='pass')
        self.client.force_authenticate(self.user)
        self.list_url = reverse('presupuesto-list')
        self.cliente = Cliente.objects.create(nombre_completo='Cliente 2')
        self.proyecto1 = Proyecto.objects.create(nombre='Proyecto A')
        self.proyecto2 = Proyecto.objects.create(nombre='Proyecto B')
        self.upe = UPE.objects.create(identificador='B1', proyecto=self.proyecto1)

    def test_upe_must_belong_to_project(self):
        data = {
            'cliente': self.cliente.id,
            'proyecto': self.proyecto2.id,
            'upe': self.upe.id,
            'monto_apartado': '500.00',
            'monto_total': '4000.00'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('La UPE no pertenece al proyecto seleccionado.', str(response.data))
