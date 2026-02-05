"""
Pytest configuration for RBAC enforcement tests.
Disables mock user behavior to properly test authentication.
"""
import os
import pytest

# Set testing mode BEFORE importing the app
os.environ["DISABLE_MOCK_USER"] = "true"

