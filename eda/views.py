from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def job(request, job_name):
    return render(request, 'task/interactive.html', {
        'job_name': job_name
    })