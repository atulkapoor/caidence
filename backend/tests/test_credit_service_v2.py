"""
Unit Tests for CreditService - SQLAlchemy 2.0 Async Patterns
Tests credit management with proper async session mocking.

KEY: session.execute() is async (needs AsyncMock), but
     result.scalar_one_or_none() and result.scalars().all() are SYNC (need MagicMock).
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import CreditAccount, CreditTransaction
from app.services.credit_service import (
    CreditService, CREDIT_COSTS, PAID_TIER_MONTHLY_LIMIT, FREE_TIER_MONTHLY_LIMIT
)


def make_mock_result(scalar_value=None):
    """Helper: create a MagicMock result where scalar_one_or_none() returns scalar_value."""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = scalar_value
    return mock_result


def make_mock_scalars_result(items=None):
    """Helper: create a MagicMock result where scalars().all() returns items."""
    mock_result = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = items or []
    mock_result.scalars.return_value = mock_scalars
    return mock_result


class TestCreditServiceInitialization:
    """Test credit account initialization"""

    @pytest.mark.asyncio
    async def test_initialize_credits_creates_account(self):
        """Test initialize_credits creates new account when none exists"""
        session = AsyncMock(spec=AsyncSession)
        user_id = 1

        session.execute = AsyncMock(return_value=make_mock_result(None))

        account = await CreditService.initialize_credits(session, user_id, PAID_TIER_MONTHLY_LIMIT)

        assert account is not None
        assert account.user_id == user_id
        assert account.balance == PAID_TIER_MONTHLY_LIMIT
        assert account.monthly_allotment == PAID_TIER_MONTHLY_LIMIT
        session.add.assert_called_once()
        session.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_initialize_credits_skips_existing(self):
        """Test initialize_credits returns existing account without creating"""
        session = AsyncMock(spec=AsyncSession)
        user_id = 1

        existing_account = CreditAccount(
            user_id=user_id,
            balance=500.0,
            monthly_allotment=1000.0
        )

        session.execute = AsyncMock(return_value=make_mock_result(existing_account))

        account = await CreditService.initialize_credits(session, user_id)

        assert account is existing_account
        assert account.balance == 500.0
        session.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_initialize_credits_custom_balance(self):
        """Test initialize_credits with custom initial balance"""
        session = AsyncMock(spec=AsyncSession)
        custom_balance = 2500.0

        session.execute = AsyncMock(return_value=make_mock_result(None))

        account = await CreditService.initialize_credits(session, 1, custom_balance)

        assert account.balance == custom_balance
        assert account.monthly_allotment == custom_balance

    @pytest.mark.asyncio
    async def test_initialize_credits_default_balance(self):
        """Test initialize_credits uses PAID_TIER default"""
        session = AsyncMock(spec=AsyncSession)

        session.execute = AsyncMock(return_value=make_mock_result(None))

        account = await CreditService.initialize_credits(session, 1)

        assert account.balance == PAID_TIER_MONTHLY_LIMIT
        assert account.monthly_allotment == PAID_TIER_MONTHLY_LIMIT


class TestCreditServiceBalance:
    """Test balance checking"""

    @pytest.mark.asyncio
    async def test_get_balance_existing_account(self):
        """Test get_balance returns correct values for existing account"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1,
            balance=750.0,
            monthly_allotment=1000.0
        )

        session.execute = AsyncMock(return_value=make_mock_result(account))

        balance, limit = await CreditService.get_balance(session, 1)

        assert balance == 750.0
        assert limit == 1000.0

    @pytest.mark.asyncio
    async def test_get_balance_auto_initializes(self):
        """Test get_balance auto-initializes missing account"""
        session = AsyncMock(spec=AsyncSession)

        # Both calls to session.execute return None (get_balance + initialize_credits)
        session.execute = AsyncMock(return_value=make_mock_result(None))

        balance, limit = await CreditService.get_balance(session, 1)

        # Auto-initialized with PAID_TIER_MONTHLY_LIMIT
        assert balance == PAID_TIER_MONTHLY_LIMIT
        assert limit == PAID_TIER_MONTHLY_LIMIT
        assert session.add.called

    @pytest.mark.asyncio
    async def test_has_sufficient_credits_true(self):
        """Test has_sufficient_credits returns True when balance is sufficient"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(user_id=1, balance=500.0, monthly_allotment=1000.0)
        session.execute = AsyncMock(return_value=make_mock_result(account))

        result = await CreditService.has_sufficient_credits(session, 1, 100.0)

        assert result is True

    @pytest.mark.asyncio
    async def test_has_sufficient_credits_false(self):
        """Test has_sufficient_credits returns False when insufficient"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(user_id=1, balance=50.0, monthly_allotment=1000.0)
        session.execute = AsyncMock(return_value=make_mock_result(account))

        result = await CreditService.has_sufficient_credits(session, 1, 100.0)

        assert result is False

    @pytest.mark.asyncio
    async def test_has_sufficient_credits_exact_amount(self):
        """Test has_sufficient_credits with exact balance match"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(user_id=1, balance=100.0, monthly_allotment=1000.0)
        session.execute = AsyncMock(return_value=make_mock_result(account))

        result = await CreditService.has_sufficient_credits(session, 1, 100.0)

        assert result is True


class TestCreditServiceDeduction:
    """Test credit deduction"""

    @pytest.mark.asyncio
    async def test_deduct_credits_success(self):
        """Test successful credit deduction"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=500.0, total_spent=0.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, message = await CreditService.deduct_credits(
            session, 1, 50.0, "discovery_search", "Test search"
        )

        assert success is True
        assert account.balance == 450.0
        assert account.total_spent == 50.0
        session.add.assert_called()  # Transaction added

    @pytest.mark.asyncio
    async def test_deduct_credits_insufficient(self):
        """Test deduction fails with insufficient balance"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=30.0, total_spent=0.0, monthly_allotment=1000.0
        )

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, message = await CreditService.deduct_credits(
            session, 1, 50.0, "discovery_search"
        )

        assert success is False
        assert "Insufficient" in message

    @pytest.mark.asyncio
    async def test_deduct_credits_auto_initializes(self):
        """Test deduction auto-initializes missing account"""
        session = AsyncMock(spec=AsyncSession)

        # Both execute calls return None (deduct_credits + initialize_credits)
        session.execute = AsyncMock(return_value=make_mock_result(None))

        success, message = await CreditService.deduct_credits(
            session, 1, 10.0, "test_operation"
        )

        # Auto-initialized with 1000 credits, deducted 10 -> should succeed
        assert success is True
        assert session.add.called

    @pytest.mark.asyncio
    async def test_deduct_credits_creates_transaction(self):
        """Test deduction creates a transaction record"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=100.0, total_spent=0.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, message = await CreditService.deduct_credits(
            session, 1, 25.0, "discovery_search", "Search with 20 creators"
        )

        assert success is True
        assert session.add.call_count >= 1

    @pytest.mark.asyncio
    async def test_deduct_credits_records_balance_change(self):
        """Test that deduction properly tracks balance before/after"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=200.0, total_spent=800.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, _ = await CreditService.deduct_credits(
            session, 1, 75.0, "creator_enrich"
        )

        assert success is True
        assert account.balance == 125.0
        assert account.total_spent == 875.0


class TestCreditServiceAddCredits:
    """Test adding credits (top-ups)"""

    @pytest.mark.asyncio
    async def test_add_credits_success(self):
        """Test adding credits to account"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=100.0, total_spent=0.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, message = await CreditService.add_credits(
            session, 1, 500.0, "topup", "User purchased 500 credits"
        )

        assert success is True
        assert account.balance == 600.0
        session.add.assert_called()

    @pytest.mark.asyncio
    async def test_add_credits_creates_transaction(self):
        """Test add_credits creates transaction record"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=100.0, total_spent=0.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, _ = await CreditService.add_credits(
            session, 1, 200.0, "promotional", "Promotional credit"
        )

        assert success is True
        assert session.add.called


class TestCreditServiceResets:
    """Test monthly credit resets"""

    @pytest.mark.asyncio
    async def test_reset_monthly_credits(self):
        """Test monthly credit reset restores balance"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=200.0, total_spent=800.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, message = await CreditService.reset_monthly_credits(session, 1)

        assert success is True
        assert account.balance == 1000.0  # Reset to monthly_allotment
        assert account.reset_at is not None
        session.add.assert_called()

    @pytest.mark.asyncio
    async def test_reset_monthly_credits_no_account(self):
        """Test monthly reset returns False when no account"""
        session = AsyncMock(spec=AsyncSession)

        session.execute = AsyncMock(return_value=make_mock_result(None))

        success, message = await CreditService.reset_monthly_credits(session, 999)

        assert success is False
        assert "No credit account" in message


class TestCreditServiceStats:
    """Test credit usage statistics"""

    @pytest.mark.asyncio
    async def test_get_credit_usage_stats_no_transactions(self):
        """Test stats with no transactions returns zeros"""
        session = AsyncMock(spec=AsyncSession)

        session.execute = AsyncMock(return_value=make_mock_scalars_result([]))

        stats = await CreditService.get_credit_usage_stats(session, 1)

        assert stats['period_days'] == 30
        assert stats['total_spent'] == 0
        assert stats['total_earned'] == 0
        assert stats['transaction_count'] == 0
        assert stats['by_type'] == {}

    @pytest.mark.asyncio
    async def test_get_credit_usage_stats_with_transactions(self):
        """Test stats with mixed transactions"""
        session = AsyncMock(spec=AsyncSession)

        t1 = MagicMock(spec=CreditTransaction)
        t1.amount = -50.0
        t1.transaction_type = 'discovery_search'

        t2 = MagicMock(spec=CreditTransaction)
        t2.amount = -25.0
        t2.transaction_type = 'creator_enrich'

        t3 = MagicMock(spec=CreditTransaction)
        t3.amount = 500.0
        t3.transaction_type = 'topup'

        session.execute = AsyncMock(return_value=make_mock_scalars_result([t1, t2, t3]))

        stats = await CreditService.get_credit_usage_stats(session, 1)

        assert stats['total_spent'] == 75.0  # |−50| + |−25|
        assert stats['total_earned'] == 500.0
        assert stats['transaction_count'] == 3
        assert 'discovery_search' in stats['by_type']
        assert 'creator_enrich' in stats['by_type']
        assert 'topup' in stats['by_type']

    @pytest.mark.asyncio
    async def test_get_credit_usage_stats_custom_period(self):
        """Test stats with custom period"""
        session = AsyncMock(spec=AsyncSession)

        session.execute = AsyncMock(return_value=make_mock_scalars_result([]))

        stats = await CreditService.get_credit_usage_stats(session, 1, days=7)

        assert stats['period_days'] == 7


class TestCreditServiceEdgeCases:
    """Test edge cases"""

    @pytest.mark.asyncio
    async def test_deduct_zero_credits(self):
        """Test deducting zero credits"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(user_id=1, balance=100.0, total_spent=0.0)
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, message = await CreditService.deduct_credits(session, 1, 0.0, "test")

        assert success is True
        assert account.balance == 100.0
        assert account.total_spent == 0.0

    @pytest.mark.asyncio
    async def test_add_large_credit_amount(self):
        """Test adding large credit amounts"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=100.0, total_spent=0.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        success, _ = await CreditService.add_credits(
            session, 1, 1000000.0, "bulk", "Enterprise plan"
        )

        assert success is True
        assert account.balance == 1000100.0

    @pytest.mark.asyncio
    async def test_multiple_operations_sequence(self):
        """Test multiple credit operations in sequence"""
        session = AsyncMock(spec=AsyncSession)

        account = CreditAccount(
            user_id=1, balance=1000.0, total_spent=0.0, monthly_allotment=1000.0
        )
        account.id = 1

        session.execute = AsyncMock(return_value=make_mock_result(account))

        # Deduct 100
        success1, _ = await CreditService.deduct_credits(session, 1, 100.0, "op1")
        assert success1 is True
        assert account.balance == 900.0

        # Deduct another 200
        success2, _ = await CreditService.deduct_credits(session, 1, 200.0, "op2")
        assert success2 is True
        assert account.balance == 700.0

        # Add 500
        success3, _ = await CreditService.add_credits(session, 1, 500.0, "topup")
        assert success3 is True
        assert account.balance == 1200.0

    @pytest.mark.asyncio
    async def test_credit_costs_constants_valid(self):
        """Test CREDIT_COSTS constants are positive"""
        for key, cost in CREDIT_COSTS.items():
            assert cost > 0, f"Cost for {key} should be positive"

    @pytest.mark.asyncio
    async def test_tier_limits_valid(self):
        """Test tier limits are properly ordered"""
        assert PAID_TIER_MONTHLY_LIMIT > FREE_TIER_MONTHLY_LIMIT
        assert FREE_TIER_MONTHLY_LIMIT > 0
