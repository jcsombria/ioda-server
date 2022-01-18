from django.contrib import admin

import eda.models

admin.site.register(eda.models.ProjectTemplate)
admin.site.register(eda.models.Project)
admin.site.register(eda.models.DefaultElement)
admin.site.register(eda.models.UserElement)
admin.site.register(eda.models.ElementGroup)
admin.site.register(eda.models.DefaultElementGroup)
admin.site.register(eda.models.UserElementGroup)
