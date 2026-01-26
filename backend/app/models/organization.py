from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Organization(Base):
    """
    Agency/Company entity - top-level tenant.
    """
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    logo_url = Column(String, nullable=True)
    plan_tier = Column(String, default="free")  # free, pro, enterprise
    custom_domain = Column(String, unique=True, nullable=True) # e.g. reports.agency.com
    branding_config = Column(JSON, nullable=True) # JSON for colors, fonts, login_bg
    settings = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    brands = relationship("Brand", back_populates="organization")
    members = relationship("User", back_populates="organization")
