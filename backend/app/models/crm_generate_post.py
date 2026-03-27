from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class CRMGeneratePost(Base):
    __tablename__ = "crm_generate_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False, default="New Post")
    platform = Column(String, nullable=False, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    image_name = Column(String, nullable=True)
    is_posted = Column(Boolean, default=False, nullable=False)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    posted_target_name = Column(String, nullable=True)
    posted_recipients = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
