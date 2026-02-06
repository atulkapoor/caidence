"""
Unit Tests for InfluencersClubClient  
- API authentication
- Rate limiting
- Creator discovery with proper mocking
"""

import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from tenacity import RetryError

from app.integrations.influencers_club import InfluencersClubClient, RATE_LIMIT_REQUESTS, RATE_LIMIT_RESET


class TestInfluencersClubClientInitialization:
    """Test client initialization and configuration"""

    def test_client_initialization(self):
        """Test client initializes with correct config"""
        # Act
        client = InfluencersClubClient(api_key="test_key_12345")
        
        # Assert
        assert client.api_key == "test_key_12345"
        assert client.timeout == 30
        assert f"Bearer test_key_12345" in client.headers["Authorization"]

    def test_client_custom_timeout(self):
        """Test client accepts custom timeout"""
        # Act
        client = InfluencersClubClient(api_key="test_key", timeout=60)
        
        # Assert
        assert client.timeout == 60

    def test_client_headers_include_auth(self):
        """Test client headers properly set"""
        # Act
        client = InfluencersClubClient(api_key="test_key")
        
        # Assert
        assert "Authorization" in client.headers
        assert client.headers["Content-Type"] == "application/json"
        assert client.headers["Authorization"].startswith("Bearer ")


class TestInfluencersClubClientDiscovery:
    """Test creator discovery endpoint"""

    @pytest.mark.asyncio
    async def test_discover_creators_with_correct_payload(self):
        """Test discover_creators constructs proper API request"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        # Mock the _make_request method
        mock_response = {
            'total': 1000,
            'accounts': [
                {
                    'user_id': 'test_user_1',
                    'profile': {
                        'username': 'testuser',
                        'followers': 10000,
                        'engagement_percent': 5.2
                    }
                }
            ]
        }
        
        with patch.object(client, '_make_request', new_callable=AsyncMock, return_value=mock_response) as mock_request:
            # Act
            result = await client.discover_creators(
                platform='instagram',
                filters={'engagement_percent': {'min': 5}},
                limit=20,
                page=1
            )
            
            # Assert
            assert result['total'] == 1000
            assert len(result['accounts']) == 1
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_discover_creators_validates_limit_range(self):
        """Test discover_creators enforces limit constraints"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        with patch.object(client, '_make_request', new_callable=AsyncMock, return_value={'accounts': []}) as mock_request:
            # Act - try with excessive limit
            await client.discover_creators(platform='instagram', filters={}, limit=100)
            
            # Assert - should be capped at 50
            call_args = mock_request.call_args
            payload = call_args[1]['json']
            assert payload['paging']['limit'] == 50

    @pytest.mark.asyncio
    async def test_discover_creators_passes_filters(self):
        """Test filters are properly passed to API"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        test_filters = {
            'engagement_percent': {'min': 3.0, 'max': 8.0},
            'number_of_followers': {'min': 10000, 'max': 100000}
        }
        
        with patch.object(client, '_make_request', new_callable=AsyncMock, return_value={'accounts': []}) as mock_request:
            # Act
            await client.discover_creators(
                platform='instagram',
                filters=test_filters,
                limit=20
            )
            
            # Assert - filters should be in request
            call_args = mock_request.call_args
            payload = call_args[1]['json']
            assert payload['filters'] == test_filters


class TestInfluencersClubClientEnrichment:
    """Test enrichment endpoints"""

    @pytest.mark.asyncio
    async def test_enrich_handle_with_full_mode(self):
        """Test enrich_handle with full enrichment mode"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response_data = {
            'handle': 'testuser',
            'email': 'test@example.com',
            'followers': 50000
        }
        
        with patch.object(client, '_make_request', new_callable=AsyncMock, return_value=response_data) as mock_request:
            # Act
            result = await client.enrich_handle(
                handle='testuser',
                platform='instagram',
                enrichment_mode='full'
            )
            
            # Assert
            assert result['handle'] == 'testuser'
            assert result['email'] == 'test@example.com'
            call_args = mock_request.call_args
            assert 'full' in str(call_args[0])

    @pytest.mark.asyncio
    async def test_enrich_email_creates_request(self):
        """Test enrich_email constructs proper request"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response_data = {
            'email': 'test@example.com',
            'profiles': []
        }
        
        with patch.object(client, '_make_request', new_callable=AsyncMock, return_value=response_data) as mock_request:
            # Act
            result = await client.enrich_email(email='test@example.com')
            
            # Assert
            assert 'email' in result
            call_args = mock_request.call_args
            payload = call_args[1]['json']
            assert payload['email'] == 'test@example.com'


class TestInfluencersClubClientErrorHandling:
    """Test error handling and edge cases"""

    @pytest.mark.asyncio
    async def test_invalid_api_key_raises_error(self):
        """Test invalid API key raises appropriate error"""
        # Arrange
        client = InfluencersClubClient(api_key="invalid_key")
        
        # Simulate 401 response
        response = MagicMock()
        response.status_code = 401
        response.text = "Invalid API key"
        
        exception = httpx.HTTPStatusError("401", request=MagicMock(), response=response)
        
        with patch.object(client.client, 'request', side_effect=exception):
            # Act & Assert - tenacity wraps the ValueError in RetryError
            with pytest.raises((ValueError, RetryError)):
                await client._make_request('POST', 'discovery', json={})

    @pytest.mark.asyncio
    async def test_network_error_handling(self):
        """Test request handles network errors"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        with patch.object(client.client, 'request', side_effect=httpx.RequestError("Network unreachable")):
            # Act & Assert - tenacity wraps the ValueError in RetryError
            with pytest.raises((ValueError, RetryError)):
                await client._make_request('POST', 'discovery', json={})


class TestInfluencersClubClientDataValidation:
    """Test response data parsing"""

    @pytest.mark.asyncio
    async def test_discovery_response_validation(self):
        """Test discovery response has expected structure"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response_data = {
            'total': 1500,
            'limit': 20,
            'page': 1,
            'accounts': [
                {
                    'user_id': '12345',
                    'profile': {
                        'username': 'creator1',
                        'followers': 50000,
                        'engagement_percent': 4.2
                    }
                }
            ]
        }
        
        with patch.object(client, '_make_request', new_callable=AsyncMock, return_value=response_data):
            # Act
            result = await client.discover_creators(platform='instagram', filters={}, limit=20)
            
            # Assert
            assert result['total'] == 1500
            assert result['limit'] == 20
            assert len(result['accounts']) == 1
            assert result['accounts'][0]['profile']['username'] == 'creator1'


# ===== FIXTURES =====

@pytest.fixture
def sample_discovery_response():
    """Sample API discovery response"""
    return {
        'total': 250000,
        'limit': 20,
        'page': 1,
        'accounts': [
            {
                'user_id': 'user123',
                'profile': {
                    'username': 'fitnessguru',
                    'full_name': 'Fitness Guru',
                    'followers': 75000,
                    'engagement_percent': 5.5,
                    'picture': 'https://cdn.example.com/pic.jpg',
                    'verified': True
                }
            }
        ]
    }
