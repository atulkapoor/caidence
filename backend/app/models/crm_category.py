from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


creator_categories = Table(
    "creator_categories",
    Base.metadata,
    Column("creator_id", Integer, ForeignKey("creators.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("crm_categories.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)


class CRMCategory(Base):
    __tablename__ = "crm_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_by_role = Column(String, nullable=True, index=True)
    brand_ids = Column(JSON, nullable=False, default=list)  # [brand_id, ...]
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator_links = relationship("Creator", secondary="creator_categories", back_populates="categories")
