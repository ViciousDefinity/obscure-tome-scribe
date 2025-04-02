# backend/api/models.py v1.2 - 2025-03-25
from django.db import models
from django.contrib.auth.models import User

class Campaign(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    dm = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class EntityType(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='entity_types')
    name = models.CharField(max_length=255)
    sort_order = models.IntegerField(default=0)
    components = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

class Entity(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    entity_type = models.ForeignKey(EntityType, on_delete=models.CASCADE, related_name='entities')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='entity_images/', null=True, blank=True)
    token_image = models.ImageField(upload_to='entity_tokens/', null=True, blank=True)
    stats = models.JSONField(default=dict, blank=True)
    dnd_beyond_url = models.URLField(max_length=500, blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

class Relationship(models.Model):
    from_entity = models.ForeignKey(Entity, related_name='relationships_out', on_delete=models.CASCADE)
    to_entity = models.ForeignKey(Entity, related_name='relationships_in', on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    reverse_description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.from_entity} -> {self.to_entity}"