import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from api.models import Campaign, EntityType, Entity, Relationship
import json

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def user():
    return User.objects.create_user(username='testuser', password='testpass')

@pytest.fixture
def token(client, user):
    response = client.post('/api/login/', {'username': 'testuser', 'password': 'testpass'})
    return response.data['access']

@pytest.mark.django_db
def test_campaign_crud(client, token, user):
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    # Create
    response = client.post('/api/campaigns/', 
                          json.dumps({'name': 'Test Campaign', 'description': 'Desc', 'dm': user.id}),
                          content_type='application/json')
    assert response.status_code == 201
    campaign_id = response.data['id']
    # Read
    response = client.get('/api/campaigns/')
    assert response.status_code == 200
    assert len(response.data) == 1
    # Update
    response = client.put(f'/api/campaigns/{campaign_id}/', 
                         json.dumps({'name': 'Updated Campaign', 'description': 'Desc', 'is_active': False, 'dm': user.id}),
                         content_type='application/json')
    assert response.status_code == 200
    # Delete
    response = client.delete(f'/api/campaigns/{campaign_id}/')
    assert response.status_code == 204

@pytest.mark.django_db
def test_entity_type_crud(client, token, user):
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    campaign = Campaign.objects.create(name='Test Campaign', dm=user)
    response = client.post(f'/api/campaigns/{campaign.id}/entity-types/', 
                          json.dumps({'name': 'NPC', 'components': ['notes']}),
                          content_type='application/json')
    assert response.status_code == 201
    type_id = response.data['id']
    response = client.get(f'/api/campaigns/{campaign.id}/entity-types/')
    assert response.status_code == 200
    assert len(response.data) == 1

@pytest.mark.django_db
def test_entity_crud(client, token, user):
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    campaign = Campaign.objects.create(name='Test Campaign', dm=user)
    entity_type = EntityType.objects.create(campaign=campaign, name='NPC', components=['notes'])
    response = client.post(f'/api/campaigns/{campaign.id}/entity-types/{entity_type.id}/entities/', 
                          json.dumps({'name': 'Test NPC', 'description': 'Desc', 'entity_type': entity_type.id, 'campaign': campaign.id}),
                          content_type='application/json')
    assert response.status_code == 201
    entity_id = response.data['id']
    response = client.get(f'/api/entities/{entity_id}/')
    assert response.status_code == 200
    response = client.delete(f'/api/campaigns/{campaign.id}/entity-types/{entity_type.id}/entities/{entity_id}/')
    assert response.status_code == 204

@pytest.mark.django_db
def test_relationship_crud(client, token, user):
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    campaign = Campaign.objects.create(name='Test Campaign', dm=user)
    entity_type = EntityType.objects.create(campaign=campaign, name='NPC')
    entity1 = Entity.objects.create(campaign=campaign, entity_type=entity_type, name='NPC 1')
    entity2 = Entity.objects.create(campaign=campaign, entity_type=entity_type, name='NPC 2')
    response = client.post(f'/api/campaigns/{campaign.id}/relationships/', 
                          json.dumps({'from_entity': entity1.id, 'to_entity': entity2.id, 'description': 'knows'}),
                          content_type='application/json')
    assert response.status_code == 201
    rel_id = response.data['id']
    response = client.delete(f'/api/campaigns/{campaign.id}/relationships/{rel_id}/')
    assert response.status_code == 204

@pytest.mark.django_db
def test_unauthenticated_access(client):
    response = client.get('/api/campaigns/')
    assert response.status_code == 401