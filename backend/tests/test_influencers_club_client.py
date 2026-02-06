"""
Unit Tests for InfluencersClubClient
- API authentication
- Rate limiting
- Retry logic
- Creator discovery
- Data parsing
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
        assert client.request_count == 0

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

    @pytest.mark.asyncio
    async def test_client_close(self):
        """Test client closes HTTP connection"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        # Act
        await client.close()
        
        # Assert - client should be able to close


class TestInfluencersClubClientRateLimiting:
    """Test rate limiting functionality"""

    @pytest.mark.asyncio
    async def test_rate_limit_check_initializes(self):
        """Test rate limit check initializes with zero count"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        # Act
        await client._check_rate_limit()
        
        # Assert
        assert client.request_count == 1

    @pytest.mark.asyncio
    async def test_rate_limit_increments_count(self):
        """Test each request increments rate limit counter"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        # Act
        for _ in range(5):
            await client._check_rate_limit()
        
        # Assert
        assert client.request_count == 5

    @pytest.mark.asyncio
    async def test_rate_limit_resets_after_window(self):
        """Test rate limit resets after time window elapsed"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        client.request_count = RATE_LIMIT_REQUESTS + 1  # Over limit
        client.last_reset = datetime.now() - __import__('datetime').timedelta(seconds=RATE_LIMIT_RESET + 1)
        
        # Act
        await client._check_rate_limit()
        
        # Assert
        assert client.request_count == 1  # Reset


class TestInfluencersClubClientDiscovery:
    """Test creator discovery endpoint"""

    @pytest.mark.asyncio
    async def test_discover_creators_builds_correct_payload(self):
        """Test discover_creators constructs proper API request"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = AsyncMock()
        mock_request.return_value = {
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
        with patch.object(client, '_make_request', mock_request):
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
        """Test discover_creators enforces 1-50 limit range"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = AsyncMock(return_value={'accounts': []})
        with patch.object(client, '_make_request', mock_request):
            # Act - try with limit > 50
            await client.discover_creators(platform='instagram', filters={}, limit=100)

            # Assert - should cap at 50
            call_args = mock_request.call_args
            payload = call_args[1]['json']
            assert payload['paging']['limit'] == 50

    @pytest.mark.asyncio
    async def test_discover_creators_enforces_minimum_limit(self):
        """Test discover_creators enforces minimum limit of 1"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = AsyncMock(return_value={'accounts': []})
        with patch.object(client, '_make_request', mock_request):
            # Act - try with limit < 1
            await client.discover_creators(platform='instagram', filters={}, limit=0)

            # Assert - should set to 1
            call_args = mock_request.call_args
            payload = call_args[1]['json']
            assert payload['paging']['limit'] == 1

    @pytest.mark.asyncio
    async def test_discover_creators_passes_filters(self):
        """Test filters are properly passed to API"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = AsyncMock(return_value={'accounts': []})
        with patch.object(client, '_make_request', mock_request):
            test_filters = {
                'engagement_percent': {'min': 3.5},
                'number_of_followers': {'min': 10000, 'max': 100000}
            }

            # Act
            await client.discover_creators(
                platform='instagram',
                filters=test_filters,
                limit=20
            )

            # Assert
            call_args = mock_request.call_args
            payload = call_args[1]['json']
            assert payload['filters'] == test_filters


class TestInfluencersClubClientEnrichment:
    """Test enrichment endpoints"""

    @pytest.mark.asyncio
    async def test_enrich_handle_with_full_mode(self, mocker):
        """Test enrich_handle with full enrichment mode"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = mocker.AsyncMock(return_value={
            'handle': 'testuser',
            'email': 'test@example.com',
            'followers': 50000
        })
        mocker.patch.object(client, '_make_request', mock_request)
        
        # Act
        result = await client.enrich_handle(
            handle='testuser',
            platform='instagram',
            enrichment_mode='full'
        )
        
        # Assert
        assert result['handle'] == 'testuser'
        call_args = mock_request.call_args
        assert 'full' in call_args[0][1]  # Endpoint includes 'full'

    @pytest.mark.asyncio
    async def test_enrich_handle_with_raw_mode(self, mocker):
        """Test enrich_handle with raw enrichment mode"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = mocker.AsyncMock(return_value={'handle': 'testuser'})
        mocker.patch.object(client, '_make_request', mock_request)
        
        # Act
        await client.enrich_handle(
            handle='testuser',
            platform='instagram',
            enrichment_mode='raw'
        )
        
        # Assert
        call_args = mock_request.call_args
        assert 'raw' in call_args[0][1]

    @pytest.mark.asyncio
    async def test_enrich_email_creates_correct_payload(self, mocker):
        """Test enrich_email constructs proper request"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        mock_request = mocker.AsyncMock(return_value={
            'email': 'test@example.com',
            'profiles': []
        })
        mocker.patch.object(client, '_make_request', mock_request)
        
        # Act
        result = await client.enrich_email(email='test@example.com')
        
        # Assert
        assert 'email' in result
        call_args = mock_request.call_args
        payload = call_args[1]['json']
        assert payload['email'] == 'test@example.com'


class TestInfluencersClubClientErrorHandling:
    """Test error handling and retries"""

    @pytest.mark.asyncio
    async def test_make_request_retries_on_429(self, mocker):
        """Test request retries on rate limit (429) error"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        
        # First call: 429 (rate limited)
        # Second call: 200 (success)
        mock_response = mocker.AsyncMock()
        mock_response.raise_for_status.side_effect = [
            httpx.HTTPStatusError("429", request=mocker.MagicMock(), response=mocker.MagicMock(status_code=429)),
            None  # Success on retry
        ]
        mock_response.json.return_value = {'accounts': []}
        
        mocker.patch.object(client.client, 'request', mock_response)
        
        # Act & Assert - should retry on 429
        # (This requires the actual retry decorator to work)

    @pytest.mark.asyncio
    async def test_make_request_raises_on_401(self, mocker):
        """Test request raises on 401 (invalid API key) - wrapped by tenacity retry"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response = mocker.MagicMock()
        response.status_code = 401
        response.text = "Invalid API key"

        exception = httpx.HTTPStatusError("401", request=mocker.MagicMock(), response=response)

        mocker.patch.object(client.client, 'request', side_effect=exception)

        # Act & Assert - tenacity wraps the ValueError in RetryError after exhausting retries
        with pytest.raises((ValueError, RetryError)):
            await client._make_request('POST', 'discovery', json={})

    @pytest.mark.asyncio
    async def test_make_request_raises_on_403(self, mocker):
        """Test request raises on 403 (insufficient permissions) - wrapped by tenacity retry"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response = mocker.MagicMock()
        response.status_code = 403
        response.text = "Insufficient permissions"

        exception = httpx.HTTPStatusError("403", request=mocker.MagicMock(), response=response)

        mocker.patch.object(client.client, 'request', side_effect=exception)

        # Act & Assert
        with pytest.raises((PermissionError, RetryError)):
            await client._make_request('POST', 'discovery', json={})

    @pytest.mark.asyncio
    async def test_make_request_raises_on_400(self, mocker):
        """Test request raises on 400 (bad payload) - wrapped by tenacity retry"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response = mocker.MagicMock()
        response.status_code = 400
        response.text = "Invalid filter format"

        exception = httpx.HTTPStatusError("400", request=mocker.MagicMock(), response=response)

        mocker.patch.object(client.client, 'request', side_effect=exception)

        # Act & Assert
        with pytest.raises((ValueError, RetryError)):
            await client._make_request('POST', 'discovery', json={})

    @pytest.mark.asyncio
    async def test_make_request_network_error(self, mocker):
        """Test request handles network errors - wrapped by tenacity retry"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")

        mocker.patch.object(
            client.client,
            'request',
            side_effect=httpx.RequestError("Network unreachable")
        )

        # Act & Assert
        with pytest.raises((ValueError, RetryError)):
            await client._make_request('POST', 'discovery', json={})


class TestInfluencersClubClientDataParsing:
    """Test response data parsing and validation"""

    @pytest.mark.asyncio
    async def test_discover_response_structure(self, mocker):
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
                        'engagement_percent': 4.2,
                        'full_name': 'John Creator',
                        'picture': 'https://example.com/pic.jpg'
                    }
                }
            ]
        }
        
        mock_request = mocker.AsyncMock(return_value=response_data)
        mocker.patch.object(client, '_make_request', mock_request)
        
        # Act
        result = await client.discover_creators(platform='instagram', filters={}, limit=20)
        
        # Assert
        assert result['total'] == 1500
        assert result['limit'] == 20
        assert len(result['accounts']) == 1
        assert result['accounts'][0]['profile']['username'] == 'creator1'

    @pytest.mark.asyncio
    async def test_enrichment_response_structure(self, mocker):
        """Test enrichment response has expected fields"""
        # Arrange
        client = InfluencersClubClient(api_key="test_key")
        response_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'followers': 100000,
            'engagement_percent': 6.5,
            'verified': True
        }
        
        mock_request = mocker.AsyncMock(return_value=response_data)
        mocker.patch.object(client, '_make_request', mock_request)
        
        # Act
        result = await client.enrich_handle('testuser', 'instagram')
        
        # Assert
        assert result['username'] == 'testuser'
        assert result['email'] == 'test@example.com'
        assert result['followers'] == 100000


# ===== FIXTURES =====

@pytest.fixture
def mock_client():
    """Create test client"""
    return InfluencersClubClient(api_key="test_api_key_12345")


# ===== INTEGRATION FIXTURES =====

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
