from datetime import datetime, timedelta
from typing import Optional


class ValidationError(Exception):
    pass


def validate_email(email: str) -> bool:
    if not isinstance(email, str) or not email or ' ' in email:
        raise ValidationError("Invalid email")
    if '@' not in email or email.startswith('@') or email.endswith('@'):
        raise ValidationError("Invalid email")
    return True


def validate_url(url: str) -> bool:
    if not isinstance(url, str) or not url or ' ' in url:
        raise ValidationError("Invalid URL")
    if not (url.startswith('http://') or url.startswith('https://')):
        raise ValidationError("Invalid URL")
    return True


def validate_budget(amount) -> bool:
    try:
        val = float(amount)
    except Exception:
        raise ValidationError("Invalid budget format")
    if val <= 0:
        raise ValidationError("Budget must be positive")
    if val < 10.0:
        return True
    if val > 10_000_000:
        raise ValidationError("Budget cannot exceed maximum")
    return True


def validate_campaign_name(name: str) -> bool:
    if not isinstance(name, str) or not name.strip():
        raise ValidationError("Campaign name is required")
    length = len(name)
    if length < 4:
        raise ValidationError("Campaign name minimum length")
    if length > 100:
        raise ValidationError("Campaign name maximum length")
    # simple XSS check
    if '<' in name or '>' in name:
        raise ValidationError("Campaign name contains invalid characters")
    return True


def validate_date_range(start: datetime, end: datetime) -> bool:
    if not isinstance(start, datetime) or not isinstance(end, datetime):
        raise ValidationError("Invalid date range")
    now = datetime.now()
    if end < start:
        raise ValidationError("End date cannot be before start")
    if end < now and start < now:
        raise ValidationError("Date range cannot be entirely in the past")
    if (end - start).days > 365:
        raise ValidationError("Date range too long")
    return True


def validate_follower_range(min: Optional[int] = None, max: Optional[int] = None) -> bool:
    if min is None:
        min = 0
    try:
        minv = int(min)
    except Exception:
        raise ValidationError("Invalid follower minimum")
    if minv < 0:
        raise ValidationError("Follower count cannot be negative")
    if max is not None:
        try:
            maxv = int(max)
        except Exception:
            raise ValidationError("Invalid follower maximum")
        if maxv < minv:
            raise ValidationError("Maximum must be >= minimum")
        if maxv > 1_000_000_000:
            raise ValidationError("Follower range exceeds maximum")
    return True


def validate_engagement_range(min: Optional[float] = None, max: Optional[float] = None) -> bool:
    if min is not None:
        try:
            minv = float(min)
        except Exception:
            raise ValidationError("Invalid engagement min")
        if minv < 0:
            raise ValidationError("Engagement cannot be negative")
    if max is not None:
        try:
            maxv = float(max)
        except Exception:
            raise ValidationError("Invalid engagement max")
        if maxv > 100.0:
            raise ValidationError("Engagement cannot exceed 100")
        if min is not None and maxv < float(min):
            raise ValidationError("Engagement max must be >= min")
    return True


def validate_filters(filters: dict, limit: int = 20, page: int = 1) -> bool:
    if not isinstance(filters, dict) or not filters:
        raise ValidationError("At least one filter required")
    allowed_platforms = {"instagram", "youtube", "tiktok"}
    if 'platform' in filters and filters['platform'] not in allowed_platforms:
        raise ValidationError("Invalid platform")
    if 'engagement_percent' in filters and not isinstance(filters['engagement_percent'], dict):
        raise ValidationError("engagement_percent must be a dict")
    # Check pagination
    if limit is not None and limit > 500:
        raise ValidationError("limit")
    return True
