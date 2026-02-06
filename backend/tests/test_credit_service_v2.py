"""
Unit Tests for CreditService - SQLAlchemy 2.0 Async Patterns
Tests credit management with proper async session mocking
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User, CreditAccount, CreditTransaction
from app.services.credit_service import CreditService, CREDIT_COSTS, PAID_TIER_MONTHLY_LIMIT


class TestCreditServiceInitialization:
    """Test credit account initialization"""

    @pytest.mark.asyncio
    async def test_initialize_credits_creates_account(self):
        """Test initialize_credits creates new account"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        user_id = 1
        
        # Mock the execute call - account doesn't exist
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        account = await CreditService.initialize_credits(session, user_id, PAID_TIER_MONTHLY_LIMIT)
        
        # Assert
        assert account is not None
        assert account.user_id == user_id
        assert account.balance == PAID_TIER_MONTHLY_LIMIT
        session.add.assert_called_once()
        session.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_initialize_credits_skips_existing(self):
        """Test initialize_credits returns existing account"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        user_id = 1
        
        # Create existing account
        existing_account = CreditAccount(
            user_id=user_id,
            balance=500.0,
            monthly_allotment=1000.0
        )
        
        # Mock the execute call
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = existing_account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        account = await CreditService.initialize_credits(session, user_id)
        
        # Assert
        assert account == existing_account
        assert account.balance == 500.0
        session.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_initialize_credits_custom_balance(self):
        """Test initialize_credits with custom initial balance"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        custom_balance = 2500.0
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        account = await CreditService.initialize_credits(session, 1, custom_balance)
        
        # Assert
        assert account.balance == custom_balance
        assert account.monthly_allotment == custom_balance


class TestCreditServiceBalance:
    """Test balance checking"""

    @pytest.mark.asyncio
    async def test_get_balance_existing_account(self):
        """Test get_balance returns correct values"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=750.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        balance, limit = await CreditService.get_balance(session, 1)
        
        # Assert
        assert balance == 750.0
        assert limit == 1000.0

    @pytest.mark.asyncio
    async def test_get_balance_auto_initializes(self):
        """Test get_balance auto-initializes missing account"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        user_id = 1
        
        # First call returns None (account doesn't exist)
        # Second call returns the created account
        mock_result_none = AsyncMock()
        mock_result_none.scalar_one_or_none.return_value = None
        
        account = CreditAccount(
            user_id=user_id,
            balance=PAID_TIER_MONTHLY_LIMIT,
            monthly_allotment=PAID_TIER_MONTHLY_LIMIT
        )
        
        mock_result_account = AsyncMock()
        mock_result_account.scalar_one_or_none.return_value = account
        
        session.execute = AsyncMock(side_effect=[mock_result_none, mock_result_account])
        
        # Act
        balance, limit = await CreditService.get_balance(session, user_id)
        
        # Assert
        assert balance == PAID_TIER_MONTHLY_LIMIT
        assert limit == PAID_TIER_MONTHLY_LIMIT
        assert session.add.called  # Account should have been added

    @pytest.mark.asyncio
    async def test_has_sufficient_credits_true(self):
        """Test has_sufficient_credits returns True when balance sufficient"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=500.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await CreditService.has_sufficient_credits(session, 1, 100.0)
        
        # Assert
        assert result is True

    @pytest.mark.asyncio
    async def test_has_sufficient_credits_false(self):
        """Test has_sufficient_credits returns False when insufficient"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=50.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await CreditService.has_sufficient_credits(session, 1, 100.0)
        
        # Assert
        assert result is False

    @pytest.mark.asyncio
    async def test_has_sufficient_credits_exact_amount(self):
        """Test has_sufficient_credits with exact balance"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=100.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await CreditService.has_sufficient_credits(session, 1, 100.0)
        
        # Assert
        assert result is True


class TestCreditServiceDeduction:
    """Test credit deduction"""

    @pytest.mark.asyncio
    async def test_deduct_credits_success(self):
        """Test successful credit deduction"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=500.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        account.id = 1  # Set ID
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, message = await CreditService.deduct_credits(
            session, 1, 50.0, "discovery_search", "Test search"
        )
        
        # Assert
        assert success is True
        assert account.balance == 450.0
        assert account.total_spent == 50.0
        session.add.assert_called()  # Transaction should be added

    @pytest.mark.asyncio
    async def test_deduct_credits_insufficient(self):
        """Test deduction fails with insufficient balance"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=30.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, message = await CreditService.deduct_credits(
            session, 1, 50.0, "discovery_search"
        )
        
        # Assert
        assert success is False
        assert "Insufficient" in message

    @pytest.mark.asyncio
    async def test_deduct_credits_auto_initializes(self):
        """Test deduction auto-initializes missing account"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        # First call returns None
        mock_result_none = AsyncMock()
        mock_result_none.scalar_one_or_none.return_value = None
        
        # After initialization, account exists
        account = CreditAccount(
            user_id=1,
            balance=PAID_TIER_MONTHLY_LIMIT,
            total_spent=0.0,
            monthly_allotment=PAID_TIER_MONTHLY_LIMIT
        )
        account.id = 1
        
        mock_result_account = AsyncMock()
        mock_result_account.scalar_one_or_none.return_value = account
        
        session.execute = AsyncMock(side_effect=[mock_result_none, mock_result_account])
        
        # Act
        success, message = await CreditService.deduct_credits(
            session, 1, 10.0, "test_operation"
        )
        
        # Assert
        assert success is True
        assert session.add.called

    @pytest.mark.asyncio
    async def test_deduct_credits_creates_transaction(self):
        """Test deduction creates transaction record"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=100.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, message = await CreditService.deduct_credits(
            session, 1, 25.0, "discovery_search", "Search with 20 creators"
        )
        
        # Assert
        assert success is True
        # session.add should be called for the transaction
        assert session.add.call_count >= 1


class TestCreditServiceAddCredits:
    """Test adding credits (top-ups)"""

    @pytest.mark.asyncio
    async def test_add_credits_success(self):
        """Test adding credits to account"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=100.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, message = await CreditService.add_credits(
            session, 1, 500.0, "topup", "User purchased 500 credits"
        )
        
        # Assert
        assert success is True
        assert account.balance == 600.0
        session.add.assert_called()

    @pytest.mark.asyncio
    async def test_add_credits_creates_transaction(self):
        """Test add_credits creates transaction record"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=100.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, _ = await CreditService.add_credits(
            session, 1, 200.0, "promotional", "Promotional credit"
        )
        
        # Assert
        assert success is True
        assert session.add.called


class TestCreditServiceResets:
    """Test monthly credit resets"""

    @pytest.mark.asyncio
    async def test_reset_monthly_credits(self):
        """Test monthly credit reset"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        # Account with spent credits
        account = CreditAccount(
            user_id=1,
            balance=200.0,
            total_spent=800.0,
            monthly_allotment=1000.0
        )
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, message = await CreditService.reset_monthly_credits(session, 1)
        
        # Assert
        assert success is True
        # After reset, balance should equal monthly allotment
        assert account.balance == account.monthly_allotment
        session.add.assert_called()


class TestCreditServiceStats:
    """Test credit usage statistics"""

    @pytest.mark.asyncio
    async def test_get_credit_usage_stats(self):
        """Test getting credit usage statistics"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=300.0,
            total_spent=700.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        stats = await CreditService.get_credit_usage_stats(session, 1)
        
        # Assert
        assert stats['current_balance'] == 300.0
        assert stats['total_spent'] == 700.0
        assert stats['monthly_allotment'] == 1000.0
        assert stats['usage_percent'] == 70.0  # 700/1000

    @pytest.mark.asyncio
    async def test_get_usage_percentage(self):
        """Test usage percentage calculation"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=250.0,
            total_spent=750.0,
            monthly_allotment=1000.0
        )
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        stats = await CreditService.get_credit_usage_stats(session, 1)
        
        # Assert
        assert stats['usage_percent'] == 75.0


class TestCreditServiceEdgeCases:
    """Test edge cases"""

    @pytest.mark.asyncio
    async def test_deduct_zero_credits(self):
        """Test deducting zero credits"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(user_id=1, balance=100.0, total_spent=0.0)
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, message = await CreditService.deduct_credits(
            session, 1, 0.0, "test"
        )
        
        # Assert
        # Deducting zero should succeed but not change balance
        assert account.total_spent == 0.0

    @pytest.mark.asyncio
    async def test_add_large_credit_amount(self):
        """Test adding large credit amounts"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=100.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        success, _ = await CreditService.add_credits(
            session, 1, 1000000.0, "bulk", "Enterprise plan"
        )
        
        # Assert
        assert success is True
        assert account.balance == 1000100.0

    @pytest.mark.asyncio
    async def test_multiple_operations_sequence(self):
        """Test multiple credit operations in sequence"""
        # Arrange
        session = AsyncMock(spec=AsyncSession)
        
        account = CreditAccount(
            user_id=1,
            balance=1000.0,
            total_spent=0.0,
            monthly_allotment=1000.0
        )
        account.id = 1
        
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = account
        session.execute = AsyncMock(return_value=mock_result)
        
        # Act & Assert
        # Deduct 100
        success1, _ = await CreditService.deduct_credits(
            session, 1, 100.0, "op1"
        )
        assert success1 is True
        assert account.balance == 900.0
        
        # Deduct another 200
        success2, _ = await CreditService.deduct_credits(
            session, 1, 200.0, "op2"
        )
        assert success2 is True
        assert account.balance == 700.0
        
        # Add 500
        success3, _ = await CreditService.add_credits(
            session, 1, 500.0, "topup"
        )
        assert success3 is True
        assert account.balance == 1200.0


# ===== FIXTURES =====

@pytest.fixture
def mock_session():
    """Create mock async session"""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def sample_account():
    """Create sample credit account"""
    account = CreditAccount(
        user_id=1,
        balance=1000.0,
        monthly_allotment=1000.0,
        total_spent=0.0
    )
    account.id = 1
    return account
