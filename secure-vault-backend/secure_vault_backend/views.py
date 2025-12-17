from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Secure Vault Backend Running"})
