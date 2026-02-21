from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import SocialAccount, User
from app.api.deps import get_current_active_user
from app.models.models import SocialAccount, User
import httpx
import os
from fastapi.responses import RedirectResponse


router = APIRouter()


@router.post("/Create")
async def create_social_credential(data: dict, db: AsyncSession = Depends(get_db)):
    credential = SocialAccount(
        user_id=1,  # temporary user
        platform=data["platform"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        account_id=data.get("account_id"),
        account_name=data.get("account_name"),
        account_email=data.get("account_email"),
    )

    db.add(credential)
    await db.commit()
    await db.refresh(credential)

    return credential


@router.get("/Read")
async def get_social_credentials(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SocialAccount))
    return result.scalars().all()


@router.put("/{credential_id}/Update")
async def update_social_credential(credential_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == credential_id)
    )

    credential = result.scalar_one_or_none()

    if not credential:
        raise HTTPException(404, "Not found")

    credential.platform = data["platform"]
    credential.client_id = data["client_id"]
    credential.client_secret = data["client_secret"]

    await db.commit()

    return {"message": "Updated"}


@router.delete("/{credential_id}/Delete")
async def delete_social_credential(credential_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == credential_id)
    )

    credential = result.scalar_one_or_none()

    if not credential:
        raise HTTPException(404, "Not found")

    await db.delete(credential)
    await db.commit()

    return {"message": "Deleted"}












