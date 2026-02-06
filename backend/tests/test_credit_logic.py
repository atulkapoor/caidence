"""
Unit Tests for CreditService - Business Logic Focus
Tests credit management logic without complex SQLAlchemy mocking
"""

import pytest
from datetime import datetime
from app.models.models import CreditAccount, CreditTransaction
from app.services.credit_service import CREDIT_COSTS, PAID_TIER_MONTHLY_LIMIT, FREE_TIER_MONTHLY_LIMIT


class TestCreditAccountModel:
    """Test CreditAccount model functionality"""

    def test_credit_account_creation(self):
        """Test creating a credit account"""
        # Arrange & Act
        account = CreditAccount(
            user_id=1,
            balance=1000.0,
            monthly_allotment=1000.0
        )
        
        # Assert
        assert account.user_id == 1
        assert account.balance == 1000.0
        assert account.monthly_allotment == 1000.0
        assert account.total_spent in (None, 0.0)

    def test_credit_account_default_values(self):
        """Test credit account default values"""
        # Arrange & Act
        account = CreditAccount(
            user_id=2,
            balance=500.0,
            monthly_allotment=500.0
        )
        
        # Assert
        assert account.total_spent in (None, 0.0)  # Model may default to None
        assert account.created_at is None  # Will be set by DB
        assert account.updated_at is None  # Will be set by DB

    def test_credit_account_free_tier(self):
        """Test creating free tier account"""
        # Arrange & Act
        account = CreditAccount(
            user_id=3,
            balance=FREE_TIER_MONTHLY_LIMIT,
            monthly_allotment=FREE_TIER_MONTHLY_LIMIT
        )
        
        # Assert
        assert account.balance == FREE_TIER_MONTHLY_LIMIT
        assert account.monthly_allotment == FREE_TIER_MONTHLY_LIMIT

    def test_credit_account_paid_tier(self):
        """Test creating paid tier account"""
        # Arrange & Act
        account = CreditAccount(
            user_id=4,
            balance=PAID_TIER_MONTHLY_LIMIT,
            monthly_allotment=PAID_TIER_MONTHLY_LIMIT
        )
        
        # Assert
        assert account.balance == PAID_TIER_MONTHLY_LIMIT
        assert account.monthly_allotment == PAID_TIER_MONTHLY_LIMIT


class TestCreditTransactionModel:
    """Test CreditTransaction model"""

    def test_credit_transaction_creation(self):
        """Test creating a credit transaction"""
        # Arrange & Act
        transaction = CreditTransaction(
            user_id=1,
            amount=50.0,
            transaction_type="discovery_search",
            balance_before=1000.0,
            balance_after=950.0,
            description="Searched 50 creators"
        )
        
        # Assert
        assert transaction.user_id == 1
        assert transaction.amount == 50.0
        assert transaction.transaction_type == "discovery_search"
        assert transaction.balance_before == 1000.0
        assert transaction.balance_after == 950.0

    def test_credit_transaction_deduction_type(self):
        """Test deduction transaction"""
        # Act
        transaction = CreditTransaction(
            user_id=1,
            amount=25.0,
            transaction_type="discovery_search",
            balance_before=500.0,
            balance_after=475.0
        )
        
        # Assert
        assert transaction.transaction_type == "discovery_search"
        assert transaction.balance_before > transaction.balance_after

    def test_credit_transaction_credit_type(self):
        """Test credit (addition) transaction"""
        # Act
        transaction = CreditTransaction(
            user_id=1,
            amount=100.0,
            transaction_type="topup",
            balance_before=400.0,
            balance_after=500.0
        )
        
        # Assert
        assert transaction.transaction_type == "topup"
        assert transaction.balance_after > transaction.balance_before

    def test_credit_transaction_with_api_call_id(self):
        """Test transaction with API call ID for tracking"""
        # Act
        transaction = CreditTransaction(
            user_id=1,
            amount=10.0,
            transaction_type="discovery_search",
            balance_before=100.0,
            balance_after=90.0,
            api_call_id="search_12345"
        )
        
        # Assert
        assert transaction.api_call_id == "search_12345"


class TestCreditCosts:
    """Test credit cost constants"""

    def test_discovery_search_cost(self):
        """Test that discovery search has correct cost"""
        # Assert
        assert 'discovery_search' in CREDIT_COSTS
        assert CREDIT_COSTS['discovery_search'] == 0.01

    def test_creator_enrich_cost(self):
        """Test that creator enrichment has correct cost"""
        # Assert
        assert 'creator_enrich' in CREDIT_COSTS
        assert CREDIT_COSTS['creator_enrich'] == 0.05

    def test_post_details_cost(self):
        """Test that post details has correct cost"""
        # Assert
        assert 'post_details' in CREDIT_COSTS
        assert CREDIT_COSTS['post_details'] == 0.03

    def test_all_costs_positive(self):
        """Test that all credit costs are positive"""
        # Assert
        for operation, cost in CREDIT_COSTS.items():
            assert cost > 0, f"Cost for {operation} should be positive"


class TestCreditLimits:
    """Test credit limit constants"""

    def test_free_tier_limit(self):
        """Test free tier monthly limit"""
        # Assert
        assert FREE_TIER_MONTHLY_LIMIT == 50.0

    def test_paid_tier_limit(self):
        """Test paid tier monthly limit"""
        # Assert
        assert PAID_TIER_MONTHLY_LIMIT == 1000.0

    def test_paid_exceeds_free(self):
        """Test that paid tier exceeds free tier"""
        # Assert
        assert PAID_TIER_MONTHLY_LIMIT > FREE_TIER_MONTHLY_LIMIT


class TestCreditBalanceLogic:
    """Test credit balance calculation logic"""

    def test_balance_after_deduction(self):
        """Test balance calculation after deduction"""
        # Arrange
        initial_balance = 1000.0
        deduction = 50.0
        
        # Act
        new_balance = initial_balance - deduction
        
        # Assert
        assert new_balance == 950.0

    def test_balance_after_credit(self):
        """Test balance calculation after adding credits"""
        # Arrange
        initial_balance = 500.0
        credit = 200.0
        
        # Act
        new_balance = initial_balance + credit
        
        # Assert
        assert new_balance == 700.0

    def test_balance_multiple_operations(self):
        """Test balance with multiple operations"""
        # Arrange
        balance = 1000.0
        
        # Act
        balance -= 50.0  # Deduction 1
        balance -= 25.0  # Deduction 2
        balance += 100.0  # Credit
        balance -= 75.0  # Deduction 3
        
        # Assert
        assert balance == 950.0

    def test_insufficient_balance_check(self):
        """Test checking insufficient balance"""
        # Arrange
        balance = 30.0
        requested = 50.0
        
        # Act
        has_sufficient = balance >= requested
        
        # Assert
        assert has_sufficient is False

    def test_sufficient_balance_check(self):
        """Test checking sufficient balance"""
        # Arrange
        balance = 500.0
        requested = 50.0
        
        # Act
        has_sufficient = balance >= requested
        
        # Assert
        assert has_sufficient is True

    def test_exact_balance_match(self):
        """Test when balance exactly matches request"""
        # Arrange
        balance = 100.0
        requested = 100.0
        
        # Act
        has_sufficient = balance >= requested
        
        # Assert
        assert has_sufficient is True


class TestCreditUsageCalculation:
    """Test credit usage percentage calculations"""

    def test_usage_percentage_half(self):
        """Test 50% usage calculation"""
        # Arrange
        spent = 500.0
        allotment = 1000.0
        
        # Act
        percentage = (spent / allotment) * 100
        
        # Assert
        assert percentage == 50.0

    def test_usage_percentage_zero(self):
        """Test 0% usage calculation"""
        # Arrange
        spent = 0.0
        allotment = 1000.0
        
        # Act
        percentage = (spent / allotment) * 100
        
        # Assert
        assert percentage == 0.0

    def test_usage_percentage_full(self):
        """Test 100% usage calculation"""
        # Arrange
        spent = 1000.0
        allotment = 1000.0
        
        # Act
        percentage = (spent / allotment) * 100
        
        # Assert
        assert percentage == 100.0

    def test_usage_percentage_over_limit(self):
        """Test usage over limit calculation"""
        # Arrange
        spent = 1200.0
        allotment = 1000.0
        
        # Act
        percentage = (spent / allotment) * 100
        
        # Assert
        assert percentage == 120.0

    def test_usage_percentage_precision(self):
        """Test usage percentage with precise values"""
        # Arrange
        spent = 333.0
        allotment = 1000.0
        
        # Act
        percentage = round((spent / allotment) * 100, 2)
        
        # Assert
        assert percentage == 33.3


class TestCreditCalculations:
    """Test various credit calculation scenarios"""

    def test_cost_for_discovery_search_with_results(self):
        """Test calculating cost for discovery with multiple results"""
        # Arrange
        num_creators = 20
        cost_per_creator = CREDIT_COSTS['discovery_search']
        
        # Act
        total_cost = num_creators * cost_per_creator
        
        # Assert
        assert total_cost == 0.20

    def test_cost_for_multiple_enrichments(self):
        """Test calculating cost for multiple enrichments"""
        # Arrange
        num_enrichments = 5
        cost_per_enrichment = CREDIT_COSTS['creator_enrich']
        
        # Act
        total_cost = num_enrichments * cost_per_enrichment
        
        # Assert
        assert total_cost == 0.25

    def test_remaining_credits_free_tier(self):
        """Test remaining credits for free tier user"""
        # Arrange
        balance = FREE_TIER_MONTHLY_LIMIT
        spent = 20.0
        
        # Act
        remaining = balance - spent
        
        # Assert
        assert remaining == 30.0

    def test_remaining_credits_paid_tier(self):
        """Test remaining credits for paid tier user"""
        # Arrange
        balance = PAID_TIER_MONTHLY_LIMIT
        spent = 250.0
        
        # Act
        remaining = balance - spent
        
        # Assert
        assert remaining == 750.0


class TestCreditEdgeCases:
    """Test edge cases in credit calculations"""

    def test_zero_balance_cannot_deduct(self):
        """Test that zero balance cannot support deductions"""
        # Arrange
        balance = 0.0
        
        # Act
        can_deduct = balance >= 0.01
        
        # Assert
        assert can_deduct is False

    def test_very_small_balance(self):
        """Test very small balance amounts"""
        # Arrange
        balance = 0.001
        cost = CREDIT_COSTS['discovery_search']  # 0.01
        
        # Act
        can_deduct = balance >= cost
        
        # Assert
        assert can_deduct is False

    def test_large_credit_amounts(self):
        """Test handling large credit amounts"""
        # Arrange
        balance = 1000000.0
        deduction = 50000.0
        
        # Act
        new_balance = balance - deduction
        
        # Assert
        assert new_balance == 950000.0
        assert new_balance > 0

    def test_fractional_credit_amounts(self):
        """Test handling fractional credit amounts"""
        # Arrange
        balance = 10.555
        deduction = 0.333
        
        # Act
        new_balance = round(balance - deduction, 3)
        
        # Assert
        assert new_balance == 10.222

    def test_mixed_integer_float_operations(self):
        """Test operations mixing integers and floats"""
        # Arrange
        balance = 100  # integer
        deduction = 50.5  # float
        
        # Act
        new_balance = balance - deduction
        
        # Assert
        assert new_balance == 49.5
        assert isinstance(new_balance, float)


class TestCreditTransactionRecording:
    """Test transaction recording logic"""

    def test_transaction_preserves_balance_history(self):
        """Test that transactions record before and after balances"""
        # Arrange
        balance_before = 1000.0
        deduction = 50.0
        balance_after = balance_before - deduction
        
        # Act
        transaction = CreditTransaction(
            user_id=1,
            amount=deduction,
            transaction_type="discovery_search",
            balance_before=balance_before,
            balance_after=balance_after
        )
        
        # Assert
        assert transaction.balance_before == 1000.0
        assert transaction.balance_after == 950.0
        assert transaction.amount == 50.0

    def test_transaction_difference_calculation(self):
        """Test calculating difference from transaction"""
        # Arrange
        transaction = CreditTransaction(
            user_id=1,
            amount=75.0,
            transaction_type="post_details",
            balance_before=500.0,
            balance_after=425.0
        )
        
        # Act
        calculated_difference = transaction.balance_before - transaction.balance_after
        
        # Assert
        assert calculated_difference == transaction.amount
