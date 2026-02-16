from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g. "root", "super_admin", "org_admin", "viewer"
    display_name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    hierarchy_level = Column(Integer, default=0) # 100=root, 90=super_admin, ...
    
    # JSON defining baseline capabilities
    # e.g. {"campaigns": ["create", "read", "update", "delete"], "billing": ["read"]}
    permissions_json = Column(JSON, default={}) 

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    users = relationship("User", back_populates="role_model")

class Permission(Base):
    """
    Detailed/Granular permission overrides per user.
    """
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    resource = Column(String) # e.g. "campaigns", "crm"
    action = Column(String) # "read", "write", "approve"
    
    # Scope (Global, Organization, Team, or Specific Resource)
    scope_type = Column(String, default="global") # "global", "organization", "team"
    scope_id = Column(Integer, nullable=True) # ID of the org/team if applicable
    
    is_allowed = Column(Boolean, default=True) # Allow or Deny (for explicit denies)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="custom_permissions")


class AuditLog(Base):
    """
    Tracks all RBAC changes: role assignments, permission grants/revokes, role edits.
    """
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    actor_email = Column(String, nullable=False)

    action = Column(String, nullable=False, index=True)  # e.g. "role_assigned", "permission_granted"

    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_user_email = Column(String, nullable=True)

    details = Column(JSON, default={})  # Arbitrary metadata (old role, new role, etc.)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class AccessLog(Base):
    """
    Tracks access denied events for security monitoring.
    Helps detect brute-force permission probing and privilege escalation attempts.
    """
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, nullable=True)
    user_role = Column(String, nullable=True)

    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)  # GET, POST, PUT, DELETE
    resource = Column(String, nullable=True)
    action = Column(String, nullable=True)

    result = Column(String, nullable=False, index=True)  # "allowed", "denied"
    reason = Column(String, nullable=True)

    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
