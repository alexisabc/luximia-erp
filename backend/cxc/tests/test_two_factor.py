from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from unittest.mock import patch
from cxc.models import UserTwoFactor


User = get_user_model()


class TwoFactorTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="john", password="secret")

    @patch('cxc.serializers.request_sms')
    def test_login_requires_otp_when_enabled(self, mock_sms):
        UserTwoFactor.objects.create(user=self.user, authy_id='1', is_enabled=True)
        response = self.client.post('/api/token/', {"username": "john", "password": "secret"}, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('two_factor', response.data['detail'])

    @patch('cxc.serializers.verify_token', return_value=True)
    def test_login_with_otp_succeeds(self, mock_verify):
        UserTwoFactor.objects.create(user=self.user, authy_id='1', is_enabled=True)
        response = self.client.post('/api/token/', {"username": "john", "password": "secret", "otp": "123456"}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
