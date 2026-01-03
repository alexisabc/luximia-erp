from django.urls import path
from .views import AIAssistantView

urlpatterns = [
    path('chat/', AIAssistantView.as_view(), name='ai-chat'),
    path('daily-briefing/', DailyBriefingView.as_view(), name='daily-briefing'),
    path('audit-trigger/', AuditTriggerView.as_view(), name='audit-trigger'),
]
