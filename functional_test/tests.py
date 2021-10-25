from django.test import TestCase, LiveServerTestCase
from django.contrib.auth.models import User
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

from jobs.models import List, Job

class NewVisitorTest(LiveServerTestCase):

  def setUp(self):
    username = 'sakura'
    password = 'sakura'
    email = 'sakura@ciematweb.com'
    user = User.objects.create_user(username, email, password)
    list_ = List.objects.create()
    job = Job.objects.create(name='suma', list=list_)
    self.browser = webdriver.Firefox()
    self.browser.implicitly_wait(3)

  def tearDown(self):
    self.browser.quit()

  def test_user_can_start_sesion(self):
    # Sakura quiere iniciar sesión en el sistema para ver la lista de
    # tareas disponibles
    self.browser.get(self.live_server_url)

    # Comprueba en el título de la página que se trata del
    # sistema de gestión de tareas de CIEMAT
    self.assertIn('CIEMAT Web', self.browser.title)
    header_text = self.browser.find_element_by_tag_name('h1').text
    self.assertIn('ciemat web', header_text.lower())

    # Sigue el enlace para hacer inicio de sesión
    login = self.browser.find_element_by_id('id_login')
    login.send_keys(Keys.ENTER)

    # La página se actualiza para solicitar los datos de usuario
    # y Sakura los introduce para entrar en el sistema
    username_inputbox = self.browser.find_element_by_id('id_username')
    username_inputbox.send_keys('sakura')
    password_inputbox = self.browser.find_element_by_id('id_password')
    password_inputbox.send_keys('sakura')
    password_inputbox.send_keys(Keys.ENTER)

    # La página se actualiza para reflejar el inicio de sesión
    current_user = self.browser.find_element_by_id('id_current_user')
    self.assertIn('sakura', current_user.text)

  def test_can_submit_job(self):
    # Sakura necesita realizar un cálculo importantísimo
    # y muy difícil, consistente en sumar números. Entra en la 
    # página principal de "ioda_server" para lanzar la tarea
    self.browser.get(self.live_server_url)

    # Comprueba en el título de la página que se trata del
    # sistema de gestión de tareas de CIEMAT, y quiere ver la
    # lista de tareas...
    self.assertIn('CIEMAT Web', self.browser.title)
    header_text = self.browser.find_element_by_tag_name('h1').text

    # pero primero debe autenticarse en el sistema
    login_link = self.browser.find_element_by_id('id_login')
    login_link.send_keys(Keys.ENTER)

    # Introduce sus datos de usuario
    username_inputbox = self.browser.find_element_by_id('id_username')
    username_inputbox.send_keys('sakura')
    password_inputbox = self.browser.find_element_by_id('id_password')
    password_inputbox.send_keys('sakura')
    password_inputbox.send_keys(Keys.ENTER)

    # Una vez dentro, puede acceder a la lista de tareas,
    # entre las que se encuentra la suma de numeros
    available_jobs_link = self.browser.find_element_by_id("id_available_jobs")
    available_jobs_link.send_keys(Keys.ENTER)
    self.check_for_row_in_list_table('id_available_jobs', '1: suma')

    # Sakura introduce el id de la tarea suma, y envía el   
    # formulario para ejecutar.
    inputbox = self.browser.find_element_by_id('id_send_job')
    inputbox.send_keys('suma')
    inputbox.send_keys(Keys.ENTER)

    # Mas tarde, Sakura está impaciente por recibir los resultados
    # de su tarea, así que entra en la web para consultar el estado
    running_jobs_link = self.browser.find_element_by_id("id_running_jobs")
    running_jobs_link.send_keys(Keys.ENTER)

    # Comprueba en el título de la página que se trata del
    # sistema de gestión de tareas de CIEMAT, y quiere ver la
    # lista de tareas
    header_text = self.browser.find_element_by_tag_name('h1').text
    self.assertIn('running jobs', header_text.lower())

    # La interfaz le muestra la lista de tareas a ejecutar, 
    # entre las que se encuentra la suma de numeros
    self.check_for_row_in_list_table('id_running_jobs', '1: suma')
    
    # Finalmente, cierra la sesión 
    logout = self.browser.find_element_by_id('id_logout')
    logout.send_keys(Keys.ENTER)
    current_user = self.browser.find_element_by_id('id_current_user')
    self.assertNotIn('sakura', current_user)

  def check_for_row_in_list_table(self, table, row_text):
    table = self.browser.find_element_by_id(table)
    rows = table.find_elements_by_tag_name('tr')
    print([row_text for row in rows])
    self.assertIn(row_text, [row_text for row in rows])
