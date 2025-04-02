# backend/api/serializers.py v1.2 - 2025-03-25
from rest_framework import serializers
from .models import Campaign, EntityType, Entity, Relationship

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'description', 'dm', 'is_active']

class EntityTypeSerializer(serializers.ModelSerializer):
    entities = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = EntityType
        fields = ['id', 'name', 'sort_order', 'components', 'entities']

class EntitySerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    token_image = serializers.ImageField(required=False, allow_null=True)
    relationships_out = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    relationships_in = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Entity
        fields = ['id', 'campaign', 'entity_type', 'name', 'description', 'image', 
                  'token_image', 'stats', 'dnd_beyond_url', 'sort_order', 
                  'relationships_out', 'relationships_in']

class RelationshipSerializer(serializers.ModelSerializer):
    from_entity_name = serializers.CharField(source='from_entity.name', read_only=True)
    to_entity_name = serializers.CharField(source='to_entity.name', read_only=True)

    class Meta:
        model = Relationship
        fields = ['id', 'from_entity', 'to_entity', 'description', 'reverse_description', 
                  'from_entity_name', 'to_entity_name']