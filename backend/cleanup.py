import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Campaign, EntityType, Entity

def cleanup_orphaned_data():
    # Check for entity types without a campaign
    orphaned_entity_types = EntityType.objects.filter(campaign__isnull=True)
    if orphaned_entity_types.exists():
        print(f"Found {orphaned_entity_types.count()} orphaned entity types:")
        for et in orphaned_entity_types:
            print(f"  - ID: {et.id}, Name: {et.name}")
        orphaned_entity_types.delete()
        print(f"Deleted {orphaned_entity_types.count()} orphaned entity types.")
    else:
        print("No orphaned entity types found.")

    # Check for entities without an entity type
    orphaned_entities = Entity.objects.filter(entity_type__isnull=True)
    if orphaned_entities.exists():
        print(f"Found {orphaned_entities.count()} orphaned entities:")
        for e in orphaned_entities:
            print(f"  - ID: {e.id}, Name: {e.name}")
        orphaned_entities.delete()
        print(f"Deleted {orphaned_entities.count()} orphaned entities.")
    else:
        print("No orphaned entities found.")

    # Check for entities whose entity type has no campaign
    orphaned_entities_by_campaign = Entity.objects.filter(entity_type__campaign__isnull=True)
    if orphaned_entities_by_campaign.exists():
        print(f"Found {orphaned_entities_by_campaign.count()} entities with missing campaign reference:")
        for e in orphaned_entities_by_campaign:
            print(f"  - ID: {e.id}, Name: {e.name}, Entity Type ID: {e.entity_type_id}")
        orphaned_entities_by_campaign.delete()
        print(f"Deleted {orphaned_entities_by_campaign.count()} entities with missing campaign reference.")
    else:
        print("No entities with missing campaign reference found.")

    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup_orphaned_data()