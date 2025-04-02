import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const apiCall = async (method, url, data = null, isMultipart = false, token) => {
    const baseUrl = 'http://localhost:8000';
    const fullUrl = url.startsWith(baseUrl) ? url : `${baseUrl}${url}`;
    let config = {
        method,
        url: fullUrl,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isMultipart ? { 'Content-Type': 'multipart/form-data' } : method === 'get' ? {} : { 'Content-Type': 'application/json' })
        }
    };
    if (data) config.data = data;
    if (method === 'get' && url.includes('/media/')) {
        return fetch(fullUrl, { headers: config.headers })
            .then(res => res.blob())
            .then(blob => ({ data: URL.createObjectURL(blob) }));
    }
    console.log('apiCall making request:', config);
    try {
        const response = await axios(config);
        return response || { data: [] };
    } catch (error) {
        if (error.response?.status === 401) {
            const refreshResponse = await axios.post('http://localhost:8000/api/token/refresh/', { refresh: localStorage.getItem('refresh') });
            const newToken = refreshResponse.data.access;
            localStorage.setItem('token', newToken);
            config.headers.Authorization = `Bearer ${newToken}`;
            return await axios(config);
        }
        throw error;
    }
};

function App() {
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [password, setPassword] = useState(localStorage.getItem('password') || '');
    const [rememberMe, setRememberMe] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh') || '');
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [campaigns, setCampaigns] = useState([]);
    const [newCampaign, setNewCampaign] = useState({ name: '', description: '' });
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [entityTypes, setEntityTypes] = useState([]);
    const [newEntities, setNewEntities] = useState({});
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [editingEntityType, setEditingEntityType] = useState(null);
    const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
    const [showAddEntityTypeModal, setShowAddEntityTypeModal] = useState(false);
    const [newEntityTypeName, setNewEntityTypeName] = useState('');
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [showAddEntityModal, setShowAddEntityModal] = useState(null);
    const [newEntityData, setNewEntityData] = useState({ name: '', description: '' });
    const [campaignSearch, setCampaignSearch] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [showAddRelationshipModal, setShowAddRelationshipModal] = useState(false);
    const [newRelationship, setNewRelationship] = useState({ to_entity: '', description: '', reverse_description: '' });
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [fullImage, setFullImage] = useState(null);
    const [isLoadingSheet, setIsLoadingSheet] = useState(false);

    const COMPONENT_OPTIONS = [
        { value: 'notes', label: 'Notes' },
        { value: 'stat_block', label: 'Stat Block' },
        { value: 'image', label: 'Image' },
        { value: 'token', label: 'Token' },
    ];

    const STAT_BLOCK_TYPES = {
        character: ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma', 'HP'],
        monster: ['AC', 'HP', 'Speed', 'CR'],
        dndbeyond: []
    };

    const handleLogin = async () => {
        console.log('Login clicked:', { username, password, rememberMe }); // Debug start
        try {
            const response = await apiCall('post', 'http://localhost:8000/api/login/', { username, password });
            console.log('Login response:', response.data); // Debug success
            const newToken = response.data.access;
            setToken(newToken);
            setRefreshToken(response.data.refresh);
            localStorage.setItem('token', newToken);
            localStorage.setItem('refresh', response.data.refresh);
            if (rememberMe) {
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);
            } else {
                localStorage.removeItem('username');
                localStorage.removeItem('password');
            }
            await fetchCampaigns();
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message); // Debug failure
            alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
            setToken('');
            setRefreshToken('');
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
        }
    };

    const fetchCampaigns = async () => {
        console.log('fetchCampaigns called');
        try {
            const response = await apiCall('get', '/api/campaigns/', null, false, token);
            console.log('fetchCampaigns response:', response.data);
            setCampaigns(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            alert(`Failed to fetch campaigns: ${errorMessage}`);
        }
    };

    const handleAddCampaign = async () => {
        if (!newCampaign.name) return alert('Campaign name is required');
        try {
            const response = await apiCall('post', 'http://localhost:8000/api/campaigns/', { ...newCampaign, is_active: true }, false, token);
            setCampaigns([...campaigns, response.data]);
            setNewCampaign({ name: '', description: '' });
            setShowAddCampaignModal(false);
        } catch (error) {
            alert('Failed to add campaign: ' + (error.response?.data || error.message));
        }
    };

    const handleToggleCampaignStatus = async (campaignId) => {
        const campaign = campaigns.find(c => c.id === campaignId);
        try {
            const response = await apiCall('put', `http://localhost:8000/api/campaigns/${campaignId}/`, {
                ...campaign,
                is_active: !campaign.is_active
            }, false, token);
            setCampaigns(campaigns.map(c => c.id === campaignId ? response.data : c));
        } catch (error) {
            alert('Failed to update campaign status: ' + (error.response?.data || error.message));
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm('Are you sure you want to delete this campaign? All related data will be lost.')) return;
        try {
            await apiCall('delete', `http://localhost:8000/api/campaigns/${campaignId}/`, null, false, token);
            setCampaigns(campaigns.filter(c => c.id !== campaignId));
            if (selectedCampaign === campaignId) setSelectedCampaign(null);
        } catch (error) {
            alert('Failed to delete campaign: ' + (error.response?.data || error.message));
        }
    };

    const fetchEntityTypes = async (campaignId) => {
        try {
            const response = await apiCall('get', `http://localhost:8000/api/campaigns/${campaignId}/entity-types/`, null, false, token);
            const sortedTypes = (response.data || []).sort((a, b) => a.sort_order - b.sort_order);
            const typesWithEntities = await Promise.all(sortedTypes.map(async (type) => {
                const entities = await Promise.all((type.entities || []).map(async (entityId) => {
                    const entityResponse = await apiCall('get', `http://localhost:8000/api/entities/${entityId}/`, null, false, token);
                    return { ...entityResponse.data, sort_order: entityResponse.data.sort_order || 0 };
                }));
                return { ...type, entities: entities.sort((a, b) => a.sort_order - b.sort_order) };
            }));
            setEntityTypes(typesWithEntities);
            setSelectedCampaign(campaignId);
            setNewEntities((response.data || []).reduce((acc, type) => ({ ...acc, [type.id]: { name: '', description: '' } }), {}));
            setCollapsedGroups((response.data || []).reduce((acc, type) => ({ ...acc, [type.id]: false }), {}));
            setIsNavOpen(false);
        } catch (error) {
            console.error('Fetch Entity Types Error:', error.response?.data || error.message);
            setEntityTypes([]);
            alert('Failed to fetch entity types: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleAddEntityType = async () => {
        if (!newEntityTypeName) return alert('Entity type name is required');
        try {
            const response = await apiCall('post', `http://localhost:8000/api/campaigns/${selectedCampaign}/entity-types/`, { name: newEntityTypeName, components: [] }, false, token);
            setEntityTypes([...entityTypes, response.data]);
            setNewEntities({ ...newEntities, [response.data.id]: { name: '', description: '' } });
            setCollapsedGroups({ ...collapsedGroups, [response.data.id]: false });
            setNewEntityTypeName('');
            setShowAddEntityTypeModal(false);
        } catch (error) {
            alert('Failed to add entity type: ' + (error.response?.data || error.message));
        }
    };

    const handleEditEntityType = async (entityTypeId) => {
        const updatedName = editingEntityType?.name;
        if (!updatedName) return alert('Entity type name is required');
        try {
            const originalType = entityTypes.find(t => t.id === entityTypeId);
            const response = await apiCall('put', `http://localhost:8000/api/campaigns/${selectedCampaign}/entity-types/${entityTypeId}/`, {
                name: updatedName,
                components: editingEntityType.components
            }, false, token);
            setEntityTypes(entityTypes.map(t =>
                t.id === entityTypeId ? { ...response.data, entities: originalType.entities } : t
            ));
            setEditingEntityType(null);
        } catch (error) {
            alert('Failed to edit entity type: ' + (error.response?.data || error.message));
        }
    };

    const handleAddEntity = async (entityTypeId) => {
        if (!newEntityData.name) return alert('Entity name is required');
        try {
            const entityData = {
                name: newEntityData.name,
                description: newEntityData.description || '',
                entity_type: entityTypeId,
                stats: { notes: [] }
            };
            const response = await apiCall('post', `http://localhost:8000/api/campaigns/${selectedCampaign}/entity-types/${entityTypeId}/entities/`, entityData, false, token);
            setEntityTypes(entityTypes.map(type =>
                type.id === entityTypeId
                    ? { ...type, entities: [...(type.entities || []), { ...response.data, dndBeyondUrl: '' }] }
                    : type
            ));
            setNewEntityData({ name: '', description: '' });
            setShowAddEntityModal(null);
        } catch (error) {
            console.error('Add Entity Error:', error.response?.data || error.message);
            alert('Failed to add entity: ' + JSON.stringify(error.response?.data || error.message));
        }
    };

    const handleEditEntity = async (entityTypeId, entityId, updatedEntity) => {
        if (!updatedEntity.name) return alert('Entity name is required');
        try {
            const formData = new FormData();
            formData.append('name', updatedEntity.name);
            formData.append('description', updatedEntity.description || '');
            formData.append('entity_type', entityTypeId);
            formData.append('campaign', selectedCampaign);
            formData.append('stats', JSON.stringify(updatedEntity.stats || { notes: [] }));
            formData.append('dnd_beyond_url', updatedEntity.dnd_beyond_url || updatedEntity.dndBeyondUrl || '');
            formData.append('sort_order', updatedEntity.sort_order || 0);
            if (updatedEntity.image && typeof updatedEntity.image !== 'string') {
                const file = updatedEntity.image;
                const ext = file.name.split('.').pop();
                const baseName = file.name.substring(0, file.name.length - ext.length - 1);
                const truncatedName = baseName.slice(0, 95) + '.' + ext;
                formData.append('image', new File([file], truncatedName, { type: file.type }));
            } else if (updatedEntity.image === null) {
                formData.append('image', '');
            }
            if (updatedEntity.token_image && typeof updatedEntity.token_image !== 'string') {
                const file = updatedEntity.token_image;
                const ext = file.name.split('.').pop();
                const baseName = file.name.substring(0, file.name.length - ext.length - 1);
                const truncatedName = baseName.slice(0, 95) + '.' + ext;
                formData.append('token_image', new File([file], truncatedName, { type: file.type }));
            } else if (updatedEntity.token_image === null) {
                formData.append('token_image', '');
            }
            const response = await apiCall('put', `http://localhost:8000/api/campaigns/${selectedCampaign}/entity-types/${entityTypeId}/entities/${entityId}/`, formData, true, token);
            const updatedEntityWithPreview = {
                ...response.data,
                entityTypeId,
                imagePreview: response.data.image ? `http://localhost:8000${response.data.image}` : null,
                token_imagePreview: response.data.token_image ? `http://localhost:8000${response.data.token_image}` : null,
                dnd_beyond_url: response.data.dnd_beyond_url || ''
            };
            setEntityTypes(entityTypes.map(t =>
                t.id === entityTypeId
                    ? { ...t, entities: t.entities.map(e => e.id === entityId ? response.data : e).sort((a, b) => a.sort_order - b.sort_order) }
                    : t
            ));
            setSelectedEntity(updatedEntityWithPreview);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert('Failed to edit entity: ' + errorMessage);
            throw error;
        }
    };

    const handleDeleteEntity = async (entityTypeId, entityId) => {
        if (!window.confirm('Are you sure you want to delete this entity?')) return;
        try {
            await apiCall('delete', `http://localhost:8000/api/campaigns/${selectedCampaign}/entity-types/${entityTypeId}/entities/${entityId}/`, null, false, token);
            setEntityTypes(entityTypes.map(type =>
                type.id === entityTypeId ? { ...type, entities: type.entities.filter(e => e.id !== entityId) } : type
            ));
            if (selectedEntity?.id === entityId) setSelectedEntity(null);
        } catch (error) {
            alert('Failed to delete entity: ' + (error.response?.data || error.message));
        }
    };

    const handleAddNote = async () => {
        const newNote = prompt('Enter new note:');
        if (newNote) {
            const updatedEntity = {
                ...selectedEntity,
                stats: { ...selectedEntity.stats, notes: [...(selectedEntity.stats.notes || []), newNote] }
            };
            setSelectedEntity(updatedEntity);
            await handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, updatedEntity);
        }
    };

    const handleDeleteNote = async (index) => {
        const updatedNotes = (selectedEntity.stats.notes || []).filter((_, i) => i !== index);
        const updatedEntity = {
            ...selectedEntity,
            stats: { ...selectedEntity.stats, notes: updatedNotes }
        };
        setSelectedEntity(updatedEntity);
        await handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, updatedEntity);
    };

    const handleStatBlockChange = async (newType) => {
        const updatedStats = {
            ...selectedEntity.stats,
            stat_block: {
                type: newType,
                ...(STAT_BLOCK_TYPES[newType].reduce((acc, key) => ({ ...acc, [key]: selectedEntity.stats.stat_block?.[key] || '' }), {}))
            }
        };
        const updatedEntity = { ...selectedEntity, stats: updatedStats };
        setSelectedEntity(updatedEntity);
        await handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, updatedEntity);
    };

    const handleStatBlockFieldChange = async (field, value) => {
        const updatedStats = {
            ...selectedEntity.stats,
            stat_block: { ...selectedEntity.stats.stat_block, [field]: value }
        };
        const updatedEntity = { ...selectedEntity, stats: updatedStats };
        setSelectedEntity(updatedEntity);
        await handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, updatedEntity);
    };

    const handleImageUpload = async (field, file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        const updatedEntity = { ...selectedEntity, [field]: file, [`${field}Preview`]: previewUrl };
        setSelectedEntity(updatedEntity);
        const response = await handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, updatedEntity);
        if (response[field]) {
            const imageResponse = await apiCall('get', `http://localhost:8000${response[field]}`, null, false, token);
            setSelectedEntity(prev => ({
                ...prev,
                [field]: response[field],
                [`${field}Preview`]: imageResponse.data
            }));
        }
    };

    const handleDeleteImage = async (field) => {
        const updatedEntity = { ...selectedEntity, [field]: null, [`${field}Preview`]: null };
        setSelectedEntity(updatedEntity);
        await handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, updatedEntity);
    };

    const generateReverseDescription = (description) => {
        const lowerDesc = description.toLowerCase().trim();
        if (lowerDesc === 'owns') return 'is owned by';
        if (lowerDesc === 'knows') return 'is known by';
        if (lowerDesc === 'loves') return 'is loved by';
        if (lowerDesc === 'hates') return 'is hated by';
        if (lowerDesc === 'works for') return 'employs';
        return `is ${lowerDesc} by`;
    };

    const handleAddRelationship = async () => {
        if (!newRelationship.to_entity || !newRelationship.description)
            return alert('Target entity and description are required');
        const reverseDesc = newRelationship.reverse_description || generateReverseDescription(newRelationship.description);
        try {
            const response = await apiCall('post', `http://localhost:8000/api/campaigns/${selectedCampaign}/relationships/`, {
                from_entity: selectedEntity.id,
                to_entity: newRelationship.to_entity,
                description: newRelationship.description,
                reverse_description: reverseDesc
            }, false, token);
            const updatedFromEntity = {
                ...selectedEntity,
                relationships_out: [...(selectedEntity.relationships_out || []), response.data]
            };
            const toEntity = allEntities.find(e => e.id === newRelationship.to_entity);
            const updatedToEntity = {
                ...toEntity,
                relationships_in: [...(toEntity.relationships_in || []), { ...response.data, from_entity_name: selectedEntity.name }]
            };
            setSelectedEntity(updatedFromEntity);
            setEntityTypes(entityTypes.map(t => ({
                ...t,
                entities: t.entities.map(e =>
                    e.id === selectedEntity.id ? updatedFromEntity :
                        e.id === newRelationship.to_entity ? updatedToEntity : e
                )
            })));
            setNewRelationship({ to_entity: '', description: '', reverse_description: '' });
            setShowAddRelationshipModal(false);
        } catch (error) {
            alert('Failed to add relationship: ' + (error.response?.data || error.message));
        }
    };

    const handleDeleteRelationship = async (relationshipId) => {
        if (!window.confirm('Are you sure you want to delete this relationship?')) return;
        try {
            await apiCall('delete', `http://localhost:8000/api/campaigns/${selectedCampaign}/relationships/${relationshipId}/`, null, false, token);
            const updatedEntity = {
                ...selectedEntity,
                relationships_out: selectedEntity.relationships_out.filter(r => r.id !== relationshipId),
                relationships_in: selectedEntity.relationships_in.filter(r => r.id !== relationshipId)
            };
            setSelectedEntity(updatedEntity);
            setEntityTypes(entityTypes.map(t =>
                t.id === selectedEntity.entityTypeId
                    ? { ...t, entities: t.entities.map(e => e.id === selectedEntity.id ? updatedEntity : e) }
                    : t
            ));
        } catch (error) {
            alert('Failed to delete relationship: ' + (error.response?.data || error.message));
        }
    };

    useEffect(() => { if (token && isAuthenticated) fetchCampaigns(); }, [token, isAuthenticated]);

    const handleLogout = () => {
        setToken('');
        setRefreshToken('');
        setIsAuthenticated(false);
        setCampaigns([]);
        setSelectedCampaign(null);
        setEntityTypes([]);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        if (!rememberMe) {
            localStorage.removeItem('username');
            localStorage.removeItem('password');
        }
    };

    const toggleNav = () => setIsNavOpen(!isNavOpen);
    const toggleGroup = (typeId) => setCollapsedGroups({ ...collapsedGroups, [typeId]: !collapsedGroups[typeId] });

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(campaignSearch.toLowerCase())
    );

    const filteredEntityTypes = entityTypes
        .filter(type => type && type.name)
        .map(type => ({
            ...type,
            entities: (type.entities || []).filter(e =>
                e && e.name && e.name.toLowerCase().includes(entityFilter.toLowerCase())
            )
        }));

    const allEntities = entityTypes.flatMap(type => type.entities);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Cinzel", serif', background: '#f4e8c1', color: '#3c2f2f' }}>
            {isAuthenticated && (
                <>
                    <button onClick={toggleNav} style={{ position: 'fixed', top: 10, left: 10, zIndex: 1000, background: '#6b4e31', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>☰</button>
                    <div style={{
                        width: isNavOpen ? '250px' : '0',
                        background: '#6b4e31',
                        color: '#f4e8c1',
                        padding: isNavOpen ? '40px 20px 20px 20px' : '0',
                        overflow: 'hidden',
                        transition: 'width 0.3s',
                        position: 'fixed',
                        height: '100%',
                        zIndex: 999,
                        boxShadow: isNavOpen ? '2px 0 5px rgba(0,0,0,0.5)' : 'none'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', textAlign: 'center', fontSize: '1.5em', textShadow: '1px 1px 2px #3c2f2f' }}>Campaigns</h3>
                        <input
                            type="text"
                            placeholder="Search Campaigns"
                            value={campaignSearch}
                            onChange={(e) => setCampaignSearch(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '20px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        {console.log('Rendering campaigns:', filteredCampaigns)}
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {filteredCampaigns.map(campaign => (
                                <li key={campaign.id} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
                                    <span
                                        onClick={() => fetchEntityTypes(campaign.id)}
                                        style={{ flex: 1, color: selectedCampaign === campaign.id ? '#d4a017' : '#f4e8c1', textDecoration: 'none', cursor: 'pointer', padding: '5px' }}
                                    >
                                        {campaign.name}
                                    </span>
                                    <span style={{ color: campaign.is_active ? '#d4a017' : '#96281b', fontSize: '12px' }}>{campaign.is_active ? '●' : '○'}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setShowAddCampaignModal(true)} style={{ marginTop: '20px', width: '100%', background: '#8a5522', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', cursor: 'pointer', borderRadius: '4px' }}>Add Campaign</button>
                        <button onClick={handleLogout} style={{ marginTop: '10px', width: '100%', background: '#96281b', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', cursor: 'pointer', borderRadius: '4px' }}>Logout</button>
                    </div>
                </>
            )}

            <div style={{ flex: 1, padding: '20px', marginLeft: isAuthenticated && isNavOpen ? '250px' : '0', marginRight: selectedEntity ? '400px' : '0', transition: 'margin-left 0.3s, margin-right 0.3s', background: '#f4e8c1', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <h1 style={{ color: '#3c2f2f', margin: '0 0 20px 0', textAlign: 'center', fontSize: '2em', textShadow: '2px 2px 4px rgba(60, 47, 47, 0.3)' }}>D&D Campaign Manager</h1>
                {!isAuthenticated ? (
                    <div style={{ maxWidth: '300px', margin: '0 auto', background: '#fff', padding: '20px', borderRadius: '8px', border: '2px solid #3c2f2f' }}>
                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }} />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }} />
                        <label style={{ display: 'block', margin: '10px 0' }}>
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ marginRight: '5px' }} />
                            Remember Me
                        </label>
                        <button onClick={handleLogin} style={{ display: 'block', width: '100%', background: '#8a5522', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Login</button>
                    </div>
                ) : (
                    <div>
                        {selectedCampaign && (
                            <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: `2px solid ${campaigns.find(c => c.id === selectedCampaign)?.is_active ? '#d4a017' : '#96281b'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: '0', color: '#3c2f2f', fontSize: '1.5em' }}>{campaigns.find(c => c.id === selectedCampaign)?.name}</h2>
                                    <p style={{ margin: '5px 0 0 0', color: '#6b4e31' }}>{campaigns.find(c => c.id === selectedCampaign)?.description}</p>
                                </div>
                                <div>
                                    <button
                                        data-testid="toggle-campaign-status"
                                        onClick={() => handleToggleCampaignStatus(selectedCampaign)}
                                        style={{ marginRight: '10px', background: campaigns.find(c => c.id === selectedCampaign)?.is_active ? '#96281b' : '#d4a017', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {campaigns.find(c => c.id === selectedCampaign)?.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        data-testid="delete-campaign"
                                        onClick={() => handleDeleteCampaign(selectedCampaign)}
                                        style={{ fontSize: '20px', background: 'none', border: 'none', color: '#96281b', cursor: 'pointer' }}
                                    >🗑️</button>
                                </div>
                            </div>
                        )}

                        {selectedCampaign && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Filter Entities"
                                    value={entityFilter}
                                    onChange={(e) => setEntityFilter(e.target.value)}
                                    style={{ width: '200px', padding: '8px', marginBottom: '20px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                                />
                                <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                    {filteredEntityTypes.length > 0 ? (
                                        filteredEntityTypes.map(type => (
                                            <div key={type.id} style={{ flex: '0 0 300px', background: '#fff', border: '2px solid #3c2f2f', padding: '15px', borderRadius: '8px' }}>
                                                <h3 style={{ margin: '0 0 10px 0', color: '#3c2f2f', fontSize: '1.2em' }}>
                                                    {type.name}
                                                    <button onClick={() => setEditingEntityType(type)} style={{ marginLeft: '10px', background: '#8a5522', color: '#f4e8c1', border: '1px solid #3c2f2f', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                                </h3>
                                                <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                                                    {type.entities.map(entity => (
                                                        <li key={entity.id} style={{ margin: '10px 0', padding: '10px', background: '#f9f1e4', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span
                                                                onClick={async () => {
                                                                    if (selectedEntity?.id === entity.id) {
                                                                        setSelectedEntity(null);
                                                                    } else {
                                                                        const newEntity = { ...entity, entityTypeId: type.id, dnd_beyond_url: entity.dnd_beyond_url || '' };
                                                                        if (entity.image) {
                                                                            const imageResponse = await apiCall('get', entity.image, null, false, token);
                                                                            newEntity.imagePreview = imageResponse.data;
                                                                        }
                                                                        if (entity.token_image) {
                                                                            const tokenResponse = await apiCall('get', entity.token_image, null, false, token);
                                                                            newEntity.token_imagePreview = tokenResponse.data;
                                                                        }
                                                                        setSelectedEntity(newEntity);
                                                                    }
                                                                }}
                                                                style={{ cursor: 'pointer', color: '#3c2f2f' }}
                                                            >
                                                                {entity.name}
                                                            </span>
                                                            <button
                                                                data-testid="delete-entity"
                                                                onClick={() => handleDeleteEntity(type.id, entity.id)}
                                                                style={{ background: 'none', border: 'none', color: '#96281b', fontSize: '18px', cursor: 'pointer' }}
                                                            >🗑️</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button
                                                    data-testid="add-entity"
                                                    onClick={() => setShowAddEntityModal(type.id)}
                                                    style={{ width: '100%', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
                                                >Add {type.name}</button>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: '#6b4e31' }}>No entity types yet.</p>
                                    )}
                                </div>
                                <button onClick={() => setShowAddEntityTypeModal(true)} style={{ marginTop: '20px', background: '#8a5522', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Add Entity Type</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showAddCampaignModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', border: '2px solid #3c2f2f' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#3c2f2f' }}>Add Campaign</h3>
                        <input
                            type="text"
                            placeholder="Campaign Name"
                            value={newCampaign.name}
                            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newCampaign.description}
                            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <button
                            data-testid="add-campaign-submit"
                            onClick={handleAddCampaign}
                            style={{ marginRight: '10px', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
                        >Add</button>
                        <button onClick={() => setShowAddCampaignModal(false)} style={{ background: '#96281b', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            {editingEntityType && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '350px', border: '2px solid #3c2f2f' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#3c2f2f' }}>Edit Entity Type</h3>
                        <input
                            type="text"
                            value={editingEntityType.name}
                            onChange={(e) => setEditingEntityType({ ...editingEntityType, name: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <div style={{ margin: '10px 0' }}>
                            <strong>Components:</strong>
                            {COMPONENT_OPTIONS.map(option => (
                                <label key={option.value} style={{ display: 'block', margin: '5px 0' }}>
                                    <input
                                        type="checkbox"
                                        checked={(editingEntityType.components || []).includes(option.value)}
                                        onChange={(e) => {
                                            const updatedComponents = e.target.checked
                                                ? [...(editingEntityType.components || []), option.value]
                                                : (editingEntityType.components || []).filter(c => c !== option.value);
                                            setEditingEntityType({ ...editingEntityType, components: updatedComponents });
                                        }}
                                        style={{ marginRight: '5px' }}
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        <button onClick={() => handleEditEntityType(editingEntityType.id)} style={{ marginRight: '10px', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingEntityType(null)} style={{ background: '#96281b', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Add Entity Type Modal */}
            {showAddEntityTypeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', border: '2px solid #3c2f2f' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#3c2f2f' }}>Add Entity Type</h3>
                        <input
                            type="text"
                            placeholder="Entity Type Name"
                            value={newEntityTypeName}
                            onChange={(e) => setNewEntityTypeName(e.target.value)}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <button onClick={handleAddEntityType} style={{ marginRight: '10px', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                        <button onClick={() => setShowAddEntityTypeModal(false)} style={{ background: '#96281b', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Entity Details/Edit Modal */}
            {selectedEntity && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1001 }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedEntity(null); }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: selectedEntity ? '0' : '-400px',
                        width: '400px',
                        height: '100%',
                        background: '#fff',
                        borderLeft: '2px solid #3c2f2f',
                        padding: '20px',
                        transition: 'right 0.3s ease-in-out',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#3c2f2f' }}>Entity Details: {selectedEntity.name}</h3>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Name:</strong>
                            <input
                                type="text"
                                value={selectedEntity.name}
                                onChange={(e) => setSelectedEntity({ ...selectedEntity, name: e.target.value })}
                                onBlur={() => handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, selectedEntity)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', marginTop: '5px', background: '#f9f1e4' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Description:</strong>
                            <textarea
                                value={selectedEntity.description}
                                onChange={(e) => setSelectedEntity({ ...selectedEntity, description: e.target.value })}
                                onBlur={() => handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, selectedEntity)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', marginTop: '5px', minHeight: '100px', background: '#f9f1e4' }}
                            />
                        </div>

                        {entityTypes.find(t => t.id === selectedEntity.entityTypeId)?.components.includes('notes') && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Notes:</strong>
                                <ul style={{ listStyle: 'none', padding: '0', margin: '5px 0' }}>
                                    {(selectedEntity.stats.notes || []).map((note, index) => (
                                        <li key={index} style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                                            <span>{note}</span>
                                            <button
                                                onClick={() => handleDeleteNote(index)}
                                                style={{ background: '#96281b', color: '#f4e8c1', border: 'none', padding: '2px 5px', borderRadius: '4px', cursor: 'pointer' }}
                                            >X</button>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={handleAddNote}
                                    style={{ background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                >Add Note</button>
                            </div>
                        )}

                        {entityTypes.find(t => t.id === selectedEntity.entityTypeId)?.components.includes('stat_block') && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Stat Block:</strong>
                                <select
                                    value={selectedEntity.stats.stat_block?.type || 'character'}
                                    onChange={(e) => handleStatBlockChange(e.target.value)}
                                    style={{ width: '100%', padding: '8px', margin: '5px 0', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                                >
                                    <option value="character">Character Sheet</option>
                                    <option value="monster">Monster Stat Block</option>
                                    <option value="dndbeyond">D&D Beyond Embed</option>
                                </select>
                                {selectedEntity.stats.stat_block?.type === 'dndbeyond' && (
                                    <div style={{ marginTop: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="Paste D&D Beyond URL"
                                            value={selectedEntity.dnd_beyond_url || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, dnd_beyond_url: e.target.value })}
                                            onBlur={() => handleEditEntity(selectedEntity.entityTypeId, selectedEntity.id, selectedEntity)}
                                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                                        />
                                        {!isLoadingSheet && selectedEntity.dnd_beyond_url && (
                                            <iframe
                                                src={selectedEntity.dnd_beyond_url}
                                                style={{ width: '100%', height: '500px', border: '1px solid #3c2f2f', borderRadius: '4px', marginTop: '10px' }}
                                                title="D&D Beyond Character Sheet"
                                                sandbox="allow-same-origin allow-scripts"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {entityTypes.find(t => t.id === selectedEntity.entityTypeId)?.components.includes('image') && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Image:</strong>
                                {(selectedEntity.imagePreview || selectedEntity.image) && (
                                    <div>
                                        <img
                                            src={selectedEntity.imagePreview || `http://localhost:8000${selectedEntity.image}`}
                                            alt={selectedEntity.name}
                                            style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => setFullImage(selectedEntity.imagePreview || `http://localhost:8000${selectedEntity.image}`)}
                                        />
                                        <button
                                            onClick={() => handleDeleteImage('image')}
                                            style={{ marginTop: '5px', background: 'none', border: 'none', color: '#96281b', fontSize: '18px', cursor: 'pointer' }}
                                        >🗑️</button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload('image', e.target.files[0])}
                                    style={{ marginTop: '5px' }}
                                />
                            </div>
                        )}

                        {entityTypes.find(t => t.id === selectedEntity.entityTypeId)?.components.includes('token') && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Token:</strong>
                                {(selectedEntity.token_imagePreview || selectedEntity.token_image) && (
                                    <div>
                                        <img
                                            src={selectedEntity.token_imagePreview || `http://localhost:8000${selectedEntity.token_image}`}
                                            alt={`${selectedEntity.name} Token`}
                                            style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => setFullImage(selectedEntity.token_imagePreview || `http://localhost:8000${selectedEntity.token_image}`)}
                                        />
                                        <button
                                            onClick={() => handleDeleteImage('token_image')}
                                            style={{ marginTop: '5px', background: 'none', border: 'none', color: '#96281b', fontSize: '18px', cursor: 'pointer' }}
                                        >🗑️</button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload('token_image', e.target.files[0])}
                                    style={{ marginTop: '5px' }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <strong>Relationships:</strong>
                            <ul style={{ listStyle: 'none', padding: '0', margin: '10px 0' }}>
                                {(selectedEntity.relationships_out || []).map(rel => (
                                    <li key={rel.id} style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{rel.description} {rel.to_entity_name}</span>
                                        <button onClick={() => handleDeleteRelationship(rel.id)} style={{ background: 'none', border: 'none', color: '#96281b', cursor: 'pointer' }}>🗑️</button>
                                    </li>
                                ))}
                                {(selectedEntity.relationships_in || []).map(rel => (
                                    <li key={rel.id} style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{rel.reverse_description} {rel.from_entity_name}</span>
                                        <button onClick={() => handleDeleteRelationship(rel.id)} style={{ background: 'none', border: 'none', color: '#96281b', cursor: 'pointer' }}>🗑️</button>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setShowAddRelationshipModal(true)}
                                style={{ width: '100%', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
                            >Add Relationship</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Image Modal */}
            {fullImage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1002
                }}>
                    <img
                        src={fullImage}
                        alt="Full size"
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }}
                    />
                    <button
                        onClick={() => setFullImage(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: '#96281b',
                            color: '#f4e8c1',
                            border: '2px solid #3c2f2f',
                            padding: '10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >Close</button>
                </div>
            )}

            {/* Add Entity Modal */}
            {showAddEntityModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', border: '2px solid #3c2f2f' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#3c2f2f' }}>Add Entity</h3>
                        <input
                            type="text"
                            placeholder="Entity Name"
                            value={newEntityData.name}
                            onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newEntityData.description}
                            onChange={(e) => setNewEntityData({ ...newEntityData, description: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <button
                            data-testid="save-entity" // Add test ID
                            onClick={() => handleAddEntity(showAddEntityModal)}
                            style={{ marginRight: '10px', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
                        >Save</button>
                        <button onClick={() => { setShowAddEntityModal(null); setNewEntityData({ name: '', description: '' }); }} style={{ background: '#96281b', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Add Relationship Modal */}
            {showAddRelationshipModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', border: '2px solid #3c2f2f' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#3c2f2f' }}>Add Relationship</h3>
                        <div style={{ position: 'relative', margin: '10px 0' }}>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #3c2f2f',
                                    borderRadius: '4px',
                                    background: '#f9f1e4',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{newRelationship.to_entity ? allEntities.find(e => e.id === newRelationship.to_entity)?.name : 'Select Target Entity'}</span>
                                <span>{isDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {isDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    width: '100%',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    background: '#f9f1e4',
                                    border: '1px solid #3c2f2f',
                                    borderRadius: '4px',
                                    zIndex: 1002
                                }}>
                                    {entityTypes.map(type => (
                                        <div key={type.id}>
                                            <div
                                                onClick={(e) => { e.stopPropagation(); toggleGroup(type.id); }}
                                                style={{
                                                    padding: '8px',
                                                    background: '#e0d4b5',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <span>{type.name}</span>
                                                <span>{collapsedGroups[type.id] ? '▼' : '▲'}</span>
                                            </div>
                                            {!collapsedGroups[type.id] && type.entities
                                                .filter(e => e.id !== selectedEntity.id)
                                                .map(entity => (
                                                    <div
                                                        key={entity.id}
                                                        onClick={() => {
                                                            setNewRelationship({ ...newRelationship, to_entity: entity.id });
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '8px',
                                                            cursor: 'pointer',
                                                            background: newRelationship.to_entity === entity.id ? '#d4a017' : 'transparent'
                                                        }}
                                                    >
                                                        {entity.name}
                                                    </div>
                                                ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Description (e.g., owns)"
                            value={newRelationship.description}
                            onChange={(e) => setNewRelationship({ ...newRelationship, description: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <input
                            type="text"
                            placeholder="Reverse Description (optional)"
                            value={newRelationship.reverse_description}
                            onChange={(e) => setNewRelationship({ ...newRelationship, reverse_description: e.target.value })}
                            style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px', border: '1px solid #3c2f2f', borderRadius: '4px', background: '#f9f1e4' }}
                        />
                        <button onClick={handleAddRelationship} style={{ marginRight: '10px', background: '#d4a017', color: '#3c2f2f', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => { setShowAddRelationshipModal(false); setNewRelationship({ to_entity: '', description: '', reverse_description: '' }); }} style={{ background: '#96281b', color: '#f4e8c1', border: '2px solid #3c2f2f', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;