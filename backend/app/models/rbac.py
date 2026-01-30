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
