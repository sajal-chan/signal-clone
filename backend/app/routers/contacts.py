from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db import get_db
from app.models.contact import Contact
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

@router.get("", response_model=list[ContactOut])
async def list_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.contact_user))
        .where(Contact.owner_id == current_user.id)
    )
    return result.scalars().all()

@router.post("", response_model=ContactOut, status_code=201)
async def add_contact(
    body: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await db.get(User, body.contact_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    contact = Contact(
        owner_id=current_user.id,
        contact_user_id=body.contact_user_id,
        nickname=body.nickname,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    result = await db.execute(
        select(Contact).options(selectinload(Contact.contact_user)).where(Contact.id == contact.id)
    )
    return result.scalar_one()

@router.delete("/{contact_id}", status_code=204)
async def remove_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.owner_id == current_user.id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    await db.commit()
