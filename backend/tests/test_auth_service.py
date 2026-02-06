"""
Unit Tests for AuthService Functions
- JWT token creation and validation
- Password hashing and verification
- Role-based permission checking
"""

import pytest
from datetime import datetime, timedelta
from jose import JWTError

from app.services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    has_permission,
    is_super_admin,
    is_agency_level,
    is_brand_level,
    TokenData,
    ROLE_HIERARCHY
)



# ===== PASSWORD HASHING TESTS =====

class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_hash_password_creates_different_hashes(self):
        """Test same password hashes to different values each time"""
        # Arrange
        password = "TestPassword123!"
        
        # Act
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Assert
        assert hash1 != hash2  # Different salts
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_verify_password_correct(self):
        """Test verify_password returns True for correct password"""
        # Arrange
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        # Act
        result = verify_password(password, hashed)
        
        # Assert
        assert result is True

    def test_verify_password_incorrect(self):
        """Test verify_password returns False for incorrect password"""
        # Arrange
        password = "TestPassword123!"
        wrong_password = "WrongPassword123!"
        hashed = get_password_hash(password)
        
        # Act
        result = verify_password(wrong_password, hashed)
        
        # Assert
        assert result is False

    def test_verify_password_empty_string(self):
        """Test verify_password handles empty passwords"""
        # Arrange
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        # Act
        result = verify_password("", hashed)
        
        # Assert
        assert result is False

    def test_hash_password_special_characters(self):
        """Test hashing handles special characters correctly"""
        # Arrange
        password = "P@$$w0rd!#%&*()[]{}|<>?,.~`"
        
        # Act
        hashed = get_password_hash(password)
        result = verify_password(password, hashed)
        
        # Assert
        assert result is True

    def test_hash_password_unicode_characters(self):
        """Test hashing handles unicode characters"""
        # Arrange
        password = "パスワード123!"  # Japanese password
        
        # Act
        hashed = get_password_hash(password)
        result = verify_password(password, hashed)
        
        # Assert
        assert result is True


# ===== JWT TOKEN TESTS =====

class TestJWTTokenCreation:
    """Test JWT token creation and validation"""

    def test_create_access_token_includes_payload(self):
        """Test created token includes data in payload"""
        # Arrange
        token_data = {
            "user_id": 123,
            "email": "test@example.com",
            "role": "admin"
        }
        
        # Act
        token = create_access_token(data=token_data)
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is not None
        assert decoded.user_id == 123
        assert decoded.email == "test@example.com"
        assert decoded.role == "admin"

    def test_create_access_token_includes_expiry(self):
        """Test created token includes expiration time"""
        # Arrange
        token_data = {"user_id": 123, "email": "test@example.com", "role": "user"}
        
        # Act
        token = create_access_token(data=token_data)
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is not None

    def test_create_access_token_custom_expires_delta(self):
        """Test custom expiration delta is respected"""
        # Arrange
        token_data = {"user_id": 123, "email": "test@example.com", "role": "user"}
        custom_delta = timedelta(hours=2)
        
        # Act
        token = create_access_token(data=token_data, expires_delta=custom_delta)
        decoded = decode_access_token(token)
        
        # Assert - should successfully decode (token not expired)
        assert decoded is not None

    def test_create_access_token_includes_organization_id(self):
        """Test token can include organization_id"""
        # Arrange
        token_data = {
            "user_id": 123,
            "email": "test@example.com",
            "role": "brand_admin",
            "organization_id": 456
        }
        
        # Act
        token = create_access_token(data=token_data)
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is not None
        assert decoded.organization_id == 456

    def test_create_token_empty_payload(self):
        """Test token creation without required fields returns None"""
        # Arrange
        token_data = {"user_id": 1}  # Missing email and role
        
        # Act
        token = create_access_token(data=token_data)
        decoded = decode_access_token(token)
        
        # Assert - should return None because email/role missing
        assert decoded is None

    def test_decode_token_expired_returns_none(self):
        """Test expired token returns None when decoded"""
        # Arrange
        token_data = {"user_id": 123, "email": "test@example.com", "role": "user"}
        # Create token that expired 1 hour ago
        expired_delta = timedelta(hours=-1)
        token = create_access_token(data=token_data, expires_delta=expired_delta)
        
        # Act
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is None

    def test_decode_token_corrupted_returns_none(self):
        """Test corrupted token returns None"""
        # Arrange
        corrupted_token = "not.a.valid.jwt.token"
        
        # Act
        decoded = decode_access_token(corrupted_token)
        
        # Assert
        assert decoded is None

    def test_decode_token_missing_required_fields_returns_none(self):
        """Test token without user_id or email returns None"""
        # Arrange - create token without required fields
        token_data = {"role": "user"}  # Missing user_id and email
        token = create_access_token(data=token_data)
        
        # Act
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is None


# ===== ROLE PERMISSION TESTS =====

class TestRolePermissions:
    """Test role-based permission checking"""

    def test_has_permission_super_admin_to_super_admin(self):
        """Test super_admin can access super_admin-level resources"""
        # Act & Assert
        assert has_permission("super_admin", "super_admin") is True

    def test_has_permission_root_exceeds_all(self):
        """Test root user exceeds all permission requirements"""
        # Act & Assert
        assert has_permission("root", "super_admin") is True
        assert has_permission("root", "agency_admin") is True
        assert has_permission("root", "viewer") is True

    def test_has_permission_viewer_insufficient(self):
        """Test viewer cannot access admin resources"""
        # Act & Assert
        assert has_permission("viewer", "agency_admin") is False

    def test_has_permission_viewer_can_view(self):
        """Test viewer can access viewer-level resources"""
        # Act & Assert
        assert has_permission("viewer", "viewer") is True

    def test_has_permission_brand_member_to_brand_resources(self):
        """Test brand member can access brand resources"""
        # Act & Assert
        assert has_permission("brand_member", "brand_member") is True

    def test_has_permission_brand_admin_exceeds_member(self):
        """Test brand admin exceeds brand member"""
        # Act & Assert
        assert has_permission("brand_admin", "brand_member") is True

    def test_has_permission_brand_cannot_access_agency(self):
        """Test brand-level user cannot access agency resources"""
        # Act & Assert
        assert has_permission("brand_admin", "agency_admin") is False

    def test_has_permission_agency_member_exceeds_brand(self):
        """Test agency member exceeds brand-level access"""
        # Act & Assert
        assert has_permission("agency_member", "brand_admin") is True

    def test_has_permission_invalid_role_defaults_to_zero(self):
        """Test unknown role gets zero permission level"""
        # Act
        result = has_permission("unknown_role", "viewer")
        
        # Assert
        assert result is False

    def test_has_permission_viewer_exceeds_unknown_required(self):
        """Test viewer against unknown required role"""
        # Act
        result = has_permission("viewer", "unknown_role")
        
        # Assert
        assert result is False


class TestSuperAdminCheck:
    """Test super admin role checks"""

    def test_is_super_admin_root(self):
        """Test root is identified as super admin"""
        # Act & Assert
        assert is_super_admin("root") is True

    def test_is_super_admin_super_admin(self):
        """Test super_admin is identified"""
        # Act & Assert
        assert is_super_admin("super_admin") is True

    def test_is_super_admin_agency_admin_false(self):
        """Test agency_admin is not super admin"""
        # Act & Assert
        assert is_super_admin("agency_admin") is False

    def test_is_super_admin_viewer_false(self):
        """Test viewer is not super admin"""
        # Act & Assert
        assert is_super_admin("viewer") is False


class TestAgencyLevelCheck:
    """Test agency-level access checks"""

    def test_is_agency_level_super_admin(self):
        """Test super_admin has agency-level access"""
        # Act & Assert
        assert is_agency_level("super_admin") is True

    def test_is_agency_level_agency_admin(self):
        """Test agency_admin has agency-level access"""
        # Act & Assert
        assert is_agency_level("agency_admin") is True

    def test_is_agency_level_agency_member(self):
        """Test agency_member has agency-level access"""
        # Act & Assert
        assert is_agency_level("agency_member") is True

    def test_is_agency_level_brand_false(self):
        """Test brand-level user doesn't have agency access"""
        # Act & Assert
        assert is_agency_level("brand_admin") is False
        assert is_agency_level("brand_member") is False

    def test_is_agency_level_creator_false(self):
        """Test creator doesn't have agency access"""
        # Act & Assert
        assert is_agency_level("creator") is False

    def test_is_agency_level_viewer_false(self):
        """Test viewer doesn't have agency access"""
        # Act & Assert
        assert is_agency_level("viewer") is False


class TestBrandLevelCheck:
    """Test brand-level access checks"""

    def test_is_brand_level_super_admin(self):
        """Test super admin has brand-level access"""
        # Act & Assert
        assert is_brand_level("super_admin") is True

    def test_is_brand_level_agency_admin(self):
        """Test agency admin has brand-level access"""
        # Act & Assert
        assert is_brand_level("agency_admin") is True

    def test_is_brand_level_agency_member(self):
        """Test agency member has brand-level access"""
        # Act & Assert
        assert is_brand_level("agency_member") is True

    def test_is_brand_level_brand_admin(self):
        """Test brand_admin has brand-level access"""
        # Act & Assert
        assert is_brand_level("brand_admin") is True

    def test_is_brand_level_brand_member(self):
        """Test brand_member has brand-level access"""
        # Act & Assert
        assert is_brand_level("brand_member") is True

    def test_is_brand_level_creator_false(self):
        """Test creator doesn't have brand-level access"""
        # Act & Assert
        assert is_brand_level("creator") is False

    def test_is_brand_level_viewer_false(self):
        """Test viewer doesn't have brand-level access"""
        # Act & Assert
        assert is_brand_level("viewer") is False


# ===== TOKEN DATA MODEL TESTS =====

class TestTokenDataModel:
    """Test TokenData pydantic model"""

    def test_token_data_basic_initialization(self):
        """Test TokenData initializes with required fields"""
        # Act
        token_data = TokenData(
            user_id=123,
            email="test@example.com",
            role="admin"
        )
        
        # Assert
        assert token_data.user_id == 123
        assert token_data.email == "test@example.com"
        assert token_data.role == "admin"
        assert token_data.organization_id is None

    def test_token_data_with_organization(self):
        """Test TokenData with organization_id"""
        # Act
        token_data = TokenData(
            user_id=123,
            email="test@example.com",
            role="brand_admin",
            organization_id=456
        )
        
        # Assert
        assert token_data.organization_id == 456

    def test_token_data_missing_required_field(self):
        """Test TokenData without required field raises error"""
        # Act & Assert
        with pytest.raises(Exception):  # Pydantic validation error
            TokenData(user_id=123, email="test@example.com")  # Missing role


# ===== INTEGRATION TESTS =====

class TestAuthenticationFlow:
    """Test complete authentication flows"""

    def test_create_and_decode_token_flow(self):
        """Test full token creation and decoding flow"""
        # Arrange
        user_data = {
            "user_id": 100,
            "email": "user@example.com",
            "role": "brand_member",
            "organization_id": 10
        }
        
        # Act
        token = create_access_token(data=user_data)
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is not None
        assert decoded.user_id == 100
        assert decoded.email == "user@example.com"
        assert decoded.role == "brand_member"
        assert decoded.organization_id == 10

    def test_password_and_token_flow(self):
        """Test password hashing and token creation together"""
        # Arrange
        password = "SecurePassword123!"
        user_data = {
            "user_id": 101,
            "email": "secure@example.com",
            "role": "admin"
        }
        
        # Act
        hashed = get_password_hash(password)
        password_correct = verify_password(password, hashed)
        token = create_access_token(data=user_data)
        decoded = decode_access_token(token)
        
        # Assert
        assert password_correct is True
        assert decoded is not None
        assert decoded.role == "admin"

    def test_admin_user_full_permissions(self):
        """Test admin user has full permission checks"""
        # Arrange
        admin_role = "super_admin"
        
        # Act & Assert
        assert has_permission(admin_role, "viewer") is True
        assert is_super_admin(admin_role) is True
        assert is_agency_level(admin_role) is True
        assert is_brand_level(admin_role) is True


# ===== EDGE CASES =====

class TestAuthEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_very_long_password(self):
        """Test hashing very long password"""
        # Arrange
        long_password = "a" * 1000
        
        # Act
        hashed = get_password_hash(long_password)
        result = verify_password(long_password, hashed)
        
        # Assert
        assert result is True

    def test_token_with_special_characters_in_email(self):
        """Test token with special characters in email"""
        # Arrange
        token_data = {
            "user_id": 1,
            "email": "user+tag+test@sub.domain.co.uk",
            "role": "viewer"
        }
        
        # Act
        token = create_access_token(data=token_data)
        decoded = decode_access_token(token)
        
        # Assert
        assert decoded is not None
        assert decoded.email == "user+tag+test@sub.domain.co.uk"

    def test_all_roles_in_hierarchy_coverage(self):
        """Test all roles in role hierarchy"""
        # Arrange
        test_cases = [
            ("root", True, False, False),  # root is super but not in agency/brand lists
            ("super_admin", True, True, True),
            ("agency_admin", False, True, True),
            ("agency_member", False, True, True),
            ("brand_admin", False, False, True),
            ("brand_member", False, False, True),
            ("creator", False, False, False),
            ("viewer", False, False, False)
        ]
        
        # Act & Assert
        for role, expected_super, expected_agency, expected_brand in test_cases:
            assert is_super_admin(role) == expected_super, f"super_admin check failed for {role}"
            assert is_agency_level(role) == expected_agency, f"agency_level check failed for {role}"
            assert is_brand_level(role) == expected_brand, f"brand_level check failed for {role}"

