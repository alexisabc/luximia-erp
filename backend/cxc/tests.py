from django.test import TestCase

# Create your tests here.
from django.urls import reverse
from rest_framework.test import APITestCase


class RootViewTests(APITestCase):
    def test_root_view(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("api"), "/api/")
