from django import forms

class NewUserForm(forms.Form):
  username = forms.CharField(label='User Name',
    max_length=100,
    widget=forms.TextInput(attrs={'required':True}),
  )
  email = forms.EmailField(label='Email',
#    widget=forms.TextInput(attrs={'required':True}),
  )
  password = forms.CharField(label='Password',
    max_length=100,
    widget=forms.PasswordInput(attrs={'required':True})
  )
  confirm_password = forms.CharField(label='Confirm password',
    max_length=100,
    widget=forms.PasswordInput(attrs={'required':True})
  )


class NewJobForm(forms.Form):
  job_name = forms.CharField(label='Job Name',
    widget=forms.TextInput(attrs={'readonly':True})
  )
  job_input = forms.FileField(label='Input Files',
      widget=forms.FileInput(attrs={'required':True})
  )

