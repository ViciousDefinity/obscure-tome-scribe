# backend/api/urls.py v1.2 - 2025-03-25
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'campaigns', views.CampaignViewSet, basename='campaigns')
router.register(r'entity-types', views.EntityTypeViewSet, basename='entity-types')
router.register(r'entities', views.EntityViewSet, basename='entities')
router.register(r'relationships', views.RelationshipViewSet, basename='relationships')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('campaigns/<int:campaign_id>/entity-types/', views.EntityTypeViewSet.as_view({'get': 'list', 'post': 'create'}), name='campaign-entity-types'),
    path('campaigns/<int:campaign_id>/entity-types/<int:pk>/', views.EntityTypeViewSet.as_view({'put': 'update'}), name='campaign-entity-type-detail'),
    path('campaigns/<int:campaign_id>/entity-types/<int:entity_type_id>/entities/', views.EntityViewSet.as_view({'post': 'create'}), name='campaign-entity-create'),
    path('campaigns/<int:campaign_id>/entity-types/<int:entity_type_id>/entities/<int:pk>/', views.EntityViewSet.as_view({'put': 'update', 'delete': 'destroy'}), name='campaign-entity-detail'),
    path('campaigns/<int:campaign_id>/relationships/', views.RelationshipViewSet.as_view({'post': 'create'}), name='campaign-relationships'),
    path('campaigns/<int:campaign_id>/relationships/<int:pk>/', views.RelationshipViewSet.as_view({'delete': 'destroy'}), name='campaign-relationship-detail'),
]