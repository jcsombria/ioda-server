from django.urls import resolve
from django.contrib.auth.models import User
from django.test import TestCase
from django.template.loader import render_to_string

from jobs.views import home_page

class LoginTest(TestCase):
    def setUp(self):
        self.username = 'sakura'
        self.password = 'sakura'
        self.email = 'sakura@ciematweb.com'
        self.user = User.objects.create_user(self.username, self.email, self.password)

    def test_user_can_log_in(self):
        response = self.client.post( '/login/', data={'username': self.username, 'password': self.password})
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, '/')
    
    def test_user_can_log_out(self):
        user_data = {'username': self.username, 'password': self.password}
        self.client.post('/login/', data=user_data)
        response = self.client.get('/logout/')    
        self.assertRedirects(response, '/')


class HomePageTest(TestCase):

    def test_root_url_resolves_to_home_page_view(self):
        found = resolve('/')
        self.assertEqual(found.func, home_page)
    
    def test_home_page_returns_correct_html_before_login(self):
        expected_html = render_to_string('home.html')
        response = self.client.get('/')
        self.assertEqual(response.content.decode(), expected_html)
    
    def test_home_page_returns_correct_html_after_login(self):
        username = 'sakura'
        password = 'sakura'
        email = 'sakura@ciematweb.com'
        user = User.objects.create_user(username, email, password)
        self.client.post( '/login/', data={'username': username, 'password': password})
        expected_html = render_to_string('home.html', {'user': user})
        response = self.client.get('/')
        self.assertEqual(response.content.decode(), expected_html)