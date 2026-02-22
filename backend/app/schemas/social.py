from pydantic import BaseModel
from typing import Optional

class SocialAccount(BaseModel):
    platform: str
    account_name: Optional[str]
    connected: bool

class SocialAccountDB(SocialAccount):
    account_id: Optional[str]
