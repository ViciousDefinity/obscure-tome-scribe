# backend/api/views.py v1.2 - 2025-03-25
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign, EntityType, Entity, Relationship
from .serializers import CampaignSerializer, EntityTypeSerializer, EntitySerializer, RelationshipSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(dm=self.request.user)

class EntityTypeViewSet(viewsets.ModelViewSet):
    serializer_class = EntityTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        campaign_id = self.kwargs['campaign_id']
        return EntityType.objects.filter(campaign_id=campaign_id, campaign__dm=self.request.user)

    def perform_create(self, serializer):
        campaign_id = self.kwargs['campaign_id']
        serializer.save(campaign_id=campaign_id)

class EntityViewSet(viewsets.ModelViewSet):
    serializer_class = EntitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        campaign_id = self.kwargs.get('campaign_id')  # Optional for non-nested routes
        entity_type_id = self.kwargs.get('entity_type_id')
        qs = Entity.objects.filter(campaign__dm=self.request.user)  # Always filter by DM
        if campaign_id:
            qs = qs.filter(campaign_id=campaign_id)
        if entity_type_id:
            qs = qs.filter(entity_type_id=entity_type_id)
        return qs

    def perform_create(self, serializer):
        campaign_id = self.request.data.get('campaign')
        entity_type_id = self.request.data.get('entity_type')
        serializer.save(campaign_id=campaign_id, entity_type_id=entity_type_id)

class RelationshipViewSet(viewsets.ModelViewSet):
    serializer_class = RelationshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        campaign_id = self.kwargs['campaign_id']
        return Relationship.objects.filter(from_entity__campaign_id=campaign_id, from_entity__campaign__dm=self.request.user)

    def perform_create(self, serializer):
        campaign_id = self.kwargs['campaign_id']
        serializer.save()