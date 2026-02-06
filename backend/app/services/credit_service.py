"""
Credit tracking and management service.
Manages user credit balances, transactions, and rate limiting.
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User, CreditAccount, CreditTransaction
import logging

logger = logging.getLogger(__name__)

# Credit costs for different API operations (in credits)
CREDIT_COSTS = {
    'discovery_search': 0.01,  # Per creator returned
    'creator_enrich': 0.05,    # Per creator enriched
    'post_details': 0.03,      # Per post analyzed
    'monthly_reset': 1000.0,   # Monthly allotment
}

# Allow free users 50 creators/month in discovery
FREE_TIER_MONTHLY_LIMIT = 50.0
PAID_TIER_MONTHLY_LIMIT = 1000.0


class CreditService:
    """Service for managing user credits and credit transactions."""
    
    @staticmethod
    async def initialize_credits(
        session: AsyncSession,
        user_id: int,
        initial_balance: float = PAID_TIER_MONTHLY_LIMIT
    ) -> CreditAccount:
        """Initialize credit account for a new user."""
        try:
            # Check if account already exists
            result = await session.execute(
                select(CreditAccount).where(CreditAccount.user_id == user_id)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                logger.info(f"Credit account already exists for user {user_id}")
                return existing
            
            # Create new credit account
            account = CreditAccount(
                user_id=user_id,
                balance=initial_balance,
                monthly_allotment=initial_balance,
            )
            session.add(account)
            await session.flush()  # Flush to get the ID
            
            logger.info(f"Initialized credit account for user {user_id} with balance {initial_balance}")
            return account
            
        except Exception as e:
            logger.error(f"Error initializing credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def get_balance(
        session: AsyncSession,
        user_id: int
    ) -> Tuple[float, float]:
        """Get current balance and monthly limit for a user.
        Auto-initializes account if not found.
        
        Returns:
            Tuple of (current_balance, monthly_limit)
        """
        try:
            result = await session.execute(
                select(CreditAccount).where(CreditAccount.user_id == user_id)
            )
            account = result.scalar_one_or_none()
            
            if not account:
                # Auto-initialize account if not found and persist it
                account = await CreditService.initialize_credits(
                    session,
                    user_id,
                    initial_balance=PAID_TIER_MONTHLY_LIMIT
                )
                await session.flush()
            
            return account.balance, account.monthly_allotment
            
        except Exception as e:
            logger.error(f"Error getting balance for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def has_sufficient_credits(
        session: AsyncSession,
        user_id: int,
        amount: float
    ) -> bool:
        """Check if user has sufficient credits for an operation."""
        try:
            balance, _ = await CreditService.get_balance(session, user_id)
            return balance >= amount
            
        except Exception as e:
            logger.error(f"Error checking credits for user {user_id}: {e}")
            return False
    
    @staticmethod
    async def deduct_credits(
        session: AsyncSession,
        user_id: int,
        amount: float,
        transaction_type: str,
        description: str = None,
        api_call_id: str = None
    ) -> Tuple[bool, str]:
        """Deduct credits from user account.
        
        Returns:
            Tuple of (success, message)
        """
        try:
            # Get or create account
            result = await session.execute(
                select(CreditAccount).where(CreditAccount.user_id == user_id)
            )
            account = result.scalar_one_or_none()
            
            if not account:
                # Auto-initialize for new users
                account = await CreditService.initialize_credits(session, user_id)
            
            # Check balance
            if account.balance < amount:
                return False, f"Insufficient credits. Balance: {account.balance}, Required: {amount}"
            
            # Record balance before
            balance_before = account.balance
            
            # Deduct credits
            account.balance -= amount
            account.total_spent += amount
            account.updated_at = datetime.utcnow()
            
            # Create transaction record
            transaction = CreditTransaction(
                user_id=user_id,
                credit_account_id=account.id,
                transaction_type=transaction_type,
                amount=-amount,  # Negative for deductions
                balance_before=balance_before,
                balance_after=account.balance,
                description=description or f"{transaction_type} deduction",
                api_call_id=api_call_id,
            )
            
            session.add(transaction)
            await session.flush()
            
            logger.info(
                f"Deducted {amount} credits from user {user_id}. "
                f"Balance: {balance_before} -> {account.balance}"
            )
            
            return True, f"Deducted {amount} credits successfully"
            
        except Exception as e:
            logger.error(f"Error deducting credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def add_credits(
        session: AsyncSession,
        user_id: int,
        amount: float,
        transaction_type: str,
        description: str = None,
    ) -> Tuple[bool, str]:
        """Add credits to user account."""
        try:
            # Get or create account
            result = await session.execute(
                select(CreditAccount).where(CreditAccount.user_id == user_id)
            )
            account = result.scalar_one_or_none()
            
            if not account:
                account = await CreditService.initialize_credits(session, user_id)
            
            # Record balance before
            balance_before = account.balance
            
            # Add credits
            account.balance += amount
            account.updated_at = datetime.utcnow()
            
            # Create transaction record
            transaction = CreditTransaction(
                user_id=user_id,
                credit_account_id=account.id,
                transaction_type=transaction_type,
                amount=amount,  # Positive for additions
                balance_before=balance_before,
                balance_after=account.balance,
                description=description or f"{transaction_type} addition",
            )
            
            session.add(transaction)
            await session.flush()
            
            logger.info(
                f"Added {amount} credits to user {user_id}. "
                f"Balance: {balance_before} -> {account.balance}"
            )
            
            return True, f"Added {amount} credits successfully"
            
        except Exception as e:
            logger.error(f"Error adding credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def reset_monthly_credits(
        session: AsyncSession,
        user_id: int,
    ) -> Tuple[bool, str]:
        """Reset monthly credit allotment (usually called on 1st of month)."""
        try:
            result = await session.execute(
                select(CreditAccount).where(CreditAccount.user_id == user_id)
            )
            account = result.scalar_one_or_none()
            
            if not account:
                return False, f"No credit account found for user {user_id}"
            
            # Reset to monthly allotment
            balance_before = account.balance
            account.balance = account.monthly_allotment
            account.reset_at = datetime.utcnow()
            account.updated_at = datetime.utcnow()
            
            # Log the reset
            transaction = CreditTransaction(
                user_id=user_id,
                credit_account_id=account.id,
                transaction_type='monthly_reset',
                amount=account.monthly_allotment - balance_before,
                balance_before=balance_before,
                balance_after=account.balance,
                description='Monthly credit reset',
            )
            
            session.add(transaction)
            await session.flush()
            
            logger.info(f"Reset monthly credits for user {user_id}. Balance: {account.balance}")
            return True, f"Reset monthly credits to {account.monthly_allotment}"
            
        except Exception as e:
            logger.error(f"Error resetting monthly credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def get_credit_usage_stats(
        session: AsyncSession,
        user_id: int,
        days: int = 30
    ) -> dict:
        """Get credit usage statistics for a user in the last N days."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            result = await session.execute(
                select(CreditTransaction)
                .where(
                    (CreditTransaction.user_id == user_id) &
                    (CreditTransaction.created_at >= cutoff_date)
                )
                .order_by(CreditTransaction.created_at.desc())
            )
            transactions = result.scalars().all()
            
            # Calculate stats
            total_spent = sum(abs(t.amount) for t in transactions if t.amount < 0)
            total_earned = sum(t.amount for t in transactions if t.amount > 0)
            transaction_count = len(transactions)
            
            # Group by type
            by_type = {}
            for t in transactions:
                if t.transaction_type not in by_type:
                    by_type[t.transaction_type] = {'count': 0, 'amount': 0}
                by_type[t.transaction_type]['count'] += 1
                by_type[t.transaction_type]['amount'] += abs(t.amount)
            
            return {
                'period_days': days,
                'total_spent': total_spent,
                'total_earned': total_earned,
                'transaction_count': transaction_count,
                'by_type': by_type,
            }
            
        except Exception as e:
            logger.error(f"Error getting usage stats for user {user_id}: {e}")
            raise
