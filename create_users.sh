#!/bin/sh
USERNAME=admin
EMAIL=admin@localhost

python3 manage.py createsuperuser --username $USERNAME --email $EMAIL
