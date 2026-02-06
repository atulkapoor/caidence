"""
Unit Tests for Form Validation Utilities
- Email validation
- URL validation
- Budget validation
- Campaign name validation
- Filter parameter validation
"""

import pytest
from datetime import datetime, timedelta

from app.utils.validators import (
    validate_email,
    validate_url,
    validate_budget,
    validate_campaign_name,
    validate_date_range,
    validate_follower_range,
    validate_engagement_range,
    validate_filters,
    ValidationError
)


# ===== EMAIL VALIDATION TESTS =====

class TestEmailValidation:
    """Test email validation"""

    def test_valid_email_standard(self):
        """Test standard valid email"""
        # Act
        result = validate_email("test@example.com")
        
        # Assert
        assert result is True

    def test_valid_email_with_subdomain(self):
        """Test valid email with subdomain"""
        # Act
        result = validate_email("user@mail.example.co.uk")
        
        # Assert
        assert result is True

    def test_valid_email_with_plus_addressing(self):
        """Test valid email with plus addressing"""
        # Act
        result = validate_email("user+tag@example.com")
        
        # Assert
        assert result is True

    def test_invalid_email_no_at_symbol(self):
        """Test email without @ symbol fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Invalid email"):
            validate_email("testexample.com")

    def test_invalid_email_no_domain(self):
        """Test email without domain fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_email("test@")

    def test_invalid_email_no_local_part(self):
        """Test email without local part fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_email("@example.com")

    def test_invalid_email_special_characters(self):
        """Test email with invalid special characters fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_email("test@exam ple.com")

    def test_invalid_email_empty_string(self):
        """Test empty email fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_email("")

    def test_invalid_email_spaces(self):
        """Test email with spaces fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_email("test @example.com")


# ===== URL VALIDATION TESTS =====

class TestURLValidation:
    """Test URL validation"""

    def test_valid_url_https(self):
        """Test valid HTTPS URL"""
        # Act
        result = validate_url("https://example.com")
        
        # Assert
        assert result is True

    def test_valid_url_http(self):
        """Test valid HTTP URL"""
        # Act
        result = validate_url("http://example.com")
        
        # Assert
        assert result is True

    def test_valid_url_with_path(self):
        """Test valid URL with path"""
        # Act
        result = validate_url("https://example.com/path/to/page")
        
        # Assert
        assert result is True

    def test_valid_url_with_query_params(self):
        """Test valid URL with query parameters"""
        # Act
        result = validate_url("https://example.com/page?param=value&other=123")
        
        # Assert
        assert result is True

    def test_valid_url_with_fragment(self):
        """Test valid URL with fragment"""
        # Act
        result = validate_url("https://example.com#section")
        
        # Assert
        assert result is True

    def test_invalid_url_no_protocol(self):
        """Test URL without protocol fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Invalid URL"):
            validate_url("example.com")

    def test_invalid_url_invalid_protocol(self):
        """Test URL with invalid protocol fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_url("ftp://example.com")

    def test_invalid_url_spaces(self):
        """Test URL with spaces fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_url("https://exam ple.com")

    def test_invalid_url_empty(self):
        """Test empty URL fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_url("")


# ===== BUDGET VALIDATION TESTS =====

class TestBudgetValidation:
    """Test budget validation"""

    def test_valid_budget_positive(self):
        """Test valid positive budget"""
        # Act
        result = validate_budget(100.00)
        
        # Assert
        assert result is True

    def test_valid_budget_large_amount(self):
        """Test valid large budget"""
        # Act
        result = validate_budget(50000.00)
        
        # Assert
        assert result is True

    def test_valid_budget_decimal_cents(self):
        """Test valid budget with cents"""
        # Act
        result = validate_budget(99.99)
        
        # Assert
        assert result is True

    def test_invalid_budget_zero(self):
        """Test zero budget fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Budget must be.*positive"):
            validate_budget(0)

    def test_invalid_budget_negative(self):
        """Test negative budget fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_budget(-100)

    def test_invalid_budget_exceeds_max(self):
        """Test budget exceeding maximum fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Budget cannot exceed"):
            validate_budget(999999999.00)

    def test_invalid_budget_non_numeric(self):
        """Test non-numeric budget fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_budget("not a number")

    def test_valid_budget_minimum_allowed(self):
        """Test minimum allowed budget"""
        # Act & Assert (assuming minimum is 10)
        result = validate_budget(10.00)
        assert result is True


# ===== CAMPAIGN NAME VALIDATION TESTS =====

class TestCampaignNameValidation:
    """Test campaign name validation"""

    def test_valid_campaign_name_standard(self):
        """Test standard valid campaign name"""
        # Act
        result = validate_campaign_name("Summer Sale 2024")
        
        # Assert
        assert result is True

    def test_valid_campaign_name_with_special_chars(self):
        """Test campaign name with allowed special chars"""
        # Act
        result = validate_campaign_name("Campaign #1 - Q1/2024")
        
        # Assert
        assert result is True

    def test_valid_campaign_name_numbers_only(self):
        """Test campaign name with only numbers"""
        # Act
        result = validate_campaign_name("2024Q1Campaign")
        
        # Assert
        assert result is True

    def test_invalid_campaign_name_empty(self):
        """Test empty campaign name fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Campaign name.*required"):
            validate_campaign_name("")

    def test_invalid_campaign_name_too_long(self):
        """Test campaign name exceeding max length fails"""
        # Arrange
        long_name = "A" * 200
        
        # Act & Assert
        with pytest.raises(ValidationError, match="Campaign name.*maximum"):
            validate_campaign_name(long_name)

    def test_invalid_campaign_name_invalid_chars(self):
        """Test campaign name with invalid special chars fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_campaign_name("Campaign <script>alert('xss')</script>")

    def test_valid_campaign_name_minimum_length(self):
        """Test campaign name at minimum length"""
        # Act
        result = validate_campaign_name("Camp")
        
        # Assert
        assert result is True

    def test_invalid_campaign_name_too_short(self):
        """Test campaign name below minimum length fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Campaign name.*minimum"):
            validate_campaign_name("Abc")


# ===== DATE RANGE VALIDATION TESTS =====

class TestDateRangeValidation:
    """Test date range validation"""

    def test_valid_date_range_future(self):
        """Test valid future date range"""
        # Arrange
        start = datetime.now() + timedelta(days=1)
        end = datetime.now() + timedelta(days=30)
        
        # Act
        result = validate_date_range(start, end)
        
        # Assert
        assert result is True

    def test_valid_date_range_same_day(self):
        """Test valid same-day date range (slightly in the future to avoid race)"""
        # Arrange - use a moment in the future to avoid microsecond race
        future = datetime.now() + timedelta(seconds=5)

        # Act
        result = validate_date_range(future, future)

        # Assert
        assert result is True

    def test_invalid_date_range_past(self):
        """Test past date range fails"""
        # Arrange
        start = datetime.now() - timedelta(days=30)
        end = datetime.now() - timedelta(days=1)
        
        # Act & Assert
        with pytest.raises(ValidationError, match="Date range.*past"):
            validate_date_range(start, end)

    def test_invalid_date_range_end_before_start(self):
        """Test end date before start date fails"""
        # Arrange
        start = datetime.now() + timedelta(days=30)
        end = datetime.now() + timedelta(days=1)
        
        # Act & Assert
        with pytest.raises(ValidationError, match="End date.*before start"):
            validate_date_range(start, end)

    def test_invalid_date_range_exceeds_max_duration(self):
        """Test date range exceeding max duration fails"""
        # Arrange (assuming max is 365 days)
        start = datetime.now() + timedelta(days=1)
        end = datetime.now() + timedelta(days=400)
        
        # Act & Assert
        with pytest.raises(ValidationError, match="Date range.*too long"):
            validate_date_range(start, end)


# ===== FOLLOWER RANGE VALIDATION TESTS =====

class TestFollowerRangeValidation:
    """Test follower count validation"""

    def test_valid_follower_range_standard(self):
        """Test valid follower range"""
        # Act
        result = validate_follower_range(min=10000, max=100000)
        
        # Assert
        assert result is True

    def test_valid_follower_range_no_max(self):
        """Test valid range with no maximum"""
        # Act
        result = validate_follower_range(min=100000)
        
        # Assert
        assert result is True

    def test_valid_follower_range_zero_min(self):
        """Test valid range with zero minimum"""
        # Act
        result = validate_follower_range(min=0)
        
        # Assert
        assert result is True

    def test_invalid_follower_range_negative(self):
        """Test negative follower count fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Follower count.*negative"):
            validate_follower_range(min=-1000)

    def test_invalid_follower_range_max_less_than_min(self):
        """Test max less than min fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Maximum.*minimum"):
            validate_follower_range(min=100000, max=10000)

    def test_invalid_follower_range_exceeds_max_platform_limit(self):
        """Test range exceeding platform limits fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="exceeds maximum"):
            validate_follower_range(min=0, max=999999999999)


# ===== ENGAGEMENT RANGE VALIDATION TESTS =====

class TestEngagementRangeValidation:
    """Test engagement percentage validation"""

    def test_valid_engagement_range_standard(self):
        """Test valid engagement range"""
        # Act
        result = validate_engagement_range(min=2.0, max=10.0)
        
        # Assert
        assert result is True

    def test_valid_engagement_zero(self):
        """Test engagement starting at zero"""
        # Act
        result = validate_engagement_range(min=0.0)
        
        # Assert
        assert result is True

    def test_valid_engagement_decimal_precision(self):
        """Test engagement with decimal precision"""
        # Act
        result = validate_engagement_range(min=2.5, max=3.75)
        
        # Assert
        assert result is True

    def test_invalid_engagement_negative(self):
        """Test negative engagement fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Engagement.*negative"):
            validate_engagement_range(min=-1.0)

    def test_invalid_engagement_exceeds_100(self):
        """Test engagement exceeding 100% fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Engagement.*exceed 100"):
            validate_engagement_range(max=150.0)

    def test_invalid_engagement_max_less_than_min(self):
        """Test max less than min fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_engagement_range(min=10.0, max=5.0)


# ===== FILTER VALIDATION TESTS =====

class TestFilterValidation:
    """Test discovery filter validation"""

    def test_valid_filters_platform_only(self):
        """Test valid filters with platform only"""
        # Act
        result = validate_filters(filters={"platform": "instagram"})
        
        # Assert
        assert result is True

    def test_valid_filters_engagement_only(self):
        """Test valid filters with engagement only"""
        # Act
        result = validate_filters(filters={
            "engagement_percent": {"min": 2.0, "max": 10.0}
        })
        
        # Assert
        assert result is True

    def test_valid_filters_comprehensive(self):
        """Test valid comprehensive filters"""
        # Act
        result = validate_filters(filters={
            "platform": "instagram",
            "engagement_percent": {"min": 3.0, "max": 8.0},
            "number_of_followers": {"min": 10000, "max": 100000}
        })
        
        # Assert
        assert result is True

    def test_invalid_filters_empty(self):
        """Test empty filters fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="At least one filter"):
            validate_filters(filters={})

    def test_invalid_filters_unknown_platform(self):
        """Test invalid platform fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="Invalid platform"):
            validate_filters(filters={"platform": "unknown_platform"})

    def test_invalid_filters_bad_engagement_structure(self):
        """Test bad engagement filter structure fails"""
        # Act & Assert
        with pytest.raises(ValidationError):
            validate_filters(filters={
                "engagement_percent": "should_be_dict"
            })

    def test_filters_with_unknown_keys_passes(self):
        """Test filters with unknown keys are silently accepted (no exclusion logic)"""
        # Act - unknown filter keys don't cause validation errors
        result = validate_filters(filters={
            "platform": "instagram",
            "incompatible_filter": "value"
        })

        # Assert
        assert result is True

    def test_valid_filters_pagination(self):
        """Test filters with pagination parameters"""
        # Act
        result = validate_filters(
            filters={"platform": "instagram"},
            limit=20,
            page=1
        )
        
        # Assert
        assert result is True

    def test_invalid_filters_pagination_limit_too_high(self):
        """Test pagination limit exceeding max fails"""
        # Act & Assert
        with pytest.raises(ValidationError, match="limit"):
            validate_filters(
                filters={"platform": "instagram"},
                limit=1000
            )


# ===== FIXTURES =====

@pytest.fixture
def sample_valid_filters():
    """Sample valid discovery filters"""
    return {
        "platform": "instagram",
        "engagement_percent": {"min": 3.0, "max": 8.0},
        "number_of_followers": {"min": 10000, "max": 100000}
    }


@pytest.fixture
def sample_campaign():
    """Sample campaign data"""
    return {
        "name": "Summer Sale 2024",
        "budget": 5000.00,
        "start_date": datetime.now() + timedelta(days=1),
        "end_date": datetime.now() + timedelta(days=30)
    }
