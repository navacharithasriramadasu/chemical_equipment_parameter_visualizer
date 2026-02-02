from django.urls import path
from .views import FileUploadView, DataSummaryView, HistoryView, GeneratePDFView, LoginView, LogoutView

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('upload/', FileUploadView.as_view()),
    path('summary/<int:dataset_id>/', DataSummaryView.as_view()),
    path('history/', HistoryView.as_view()),
    path('pdf/<int:dataset_id>/', GeneratePDFView.as_view()),
]
