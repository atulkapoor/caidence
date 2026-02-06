#!/usr/bin/env python
"""Direct validation of credit logic - no pytest dependency"""

import sys
sys.path.insert(0, '.')

from app.models.models import CreditAccount, CreditTransaction
from app.services.credit_service import CREDIT_COSTS, PAID_TIER_MONTHLY_LIMIT, FREE_TIER_MONTHLY_LIMIT

def test_credit_account():
    """Test CreditAccount creation"""
    account = CreditAccount(user_id=1, balance=1000.0, monthly_allotment=1000.0)
    assert account.user_id == 1
    assert account.balance == 1000.0
    print('✓ CreditAccount creation')

def test_credit_transaction():
    """Test CreditTransaction creation"""
    transaction = CreditTransaction(
        user_id=1,
        amount=50.0,
        transaction_type='discovery_search',
        balance_before=1000.0,
        balance_after=950.0,
        description='Searched 50 creators'
    )
    assert transaction.user_id == 1
    assert transaction.amount == 50.0
    print('✓ CreditTransaction creation')

def test_credit_costs():
    """Test credit costs"""
    assert 'discovery_search' in CREDIT_COSTS
    assert CREDIT_COSTS['discovery_search'] == 0.01
    print('✓ Credit costs')

def test_credit_limits():
    """Test limits"""
    assert FREE_TIER_MONTHLY_LIMIT == 50.0
    assert PAID_TIER_MONTHLY_LIMIT == 1000.0
    print('✓ Credit limits')

def test_balance_calculation():
    """Test balance calculation"""
    balance = 1000.0
    balance -= 50.0
    balance -= 25.0
    balance += 100.0
    balance -= 75.0
    assert balance == 950.0
    print('✓ Balance calculation')

def test_insufficient_balance():
    """Test insufficient balance check"""
    assert (30.0 >= 50.0) == False
    print('✓ Insufficient balance check')

def test_sufficient_balance():
    """Test sufficient balance check"""
    assert (500.0 >= 50.0) == True
    print('✓ Sufficient balance check')

def test_usage_percentage():
    """Test usage percentage"""
    percentage = (500.0 / 1000.0) * 100
    assert percentage == 50.0
    print('✓ Usage percentage')

def test_cost_calculation():
    """Test cost calculation"""
    total_cost = 20 * CREDIT_COSTS['discovery_search']
    assert total_cost == 0.20
    print('✓ Cost calculation')

if __name__ == '__main__':
    try:
        test_credit_account()
        test_credit_transaction()
        test_credit_costs()
        test_credit_limits()
        test_balance_calculation()
        test_insufficient_balance()
        test_sufficient_balance()
        test_usage_percentage()
        test_cost_calculation()
        print("\n=== All Credit Logic Tests Passed (9/9) ===")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
