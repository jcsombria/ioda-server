from django.contrib import admin

import eda.models

admin.site.register(eda.models.ProjectTemplate)
admin.site.register(eda.models.Project)
admin.site.register(eda.models.Element)
