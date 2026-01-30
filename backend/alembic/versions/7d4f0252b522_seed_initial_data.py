"""Seed initial data

Revision ID: 7d4f0252b522
Revises: 79853a139aaa
Create Date: 2026-01-30 22:04:53.530058

"""
from typing import Sequence, Union


from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from app.services.auth_service import get_password_hash
from app.core.config import settings

# revision identifiers, used by Alembic.
revision: str = '7d4f0252b522'
down_revision: Union[str, Sequence[str], None] = '79853a139aaa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with initial seed data."""
    # Define table structures for data manipulation
    roles_table = table('roles',
        column('id', sa.Integer),
        column('name', sa.String),
        column('display_name', sa.String),
        column('description', sa.String),
        column('hierarchy_level', sa.Integer),
        column('permissions_json', sa.JSON),
        column('created_at', sa.DateTime(timezone=True))
    )

    organizations_table = table('organizations',
        column('id', sa.Integer),
        column('name', sa.String),
        column('slug', sa.String),
        column('plan_tier', sa.String),
        column('is_active', sa.Boolean),
        column('created_at', sa.DateTime(timezone=True))
    )

    users_table = table('users',
        column('id', sa.Integer),
        column('email', sa.String),
        column('hashed_password', sa.String),
        column('full_name', sa.String),
        column('role', sa.String),
        column('role_id', sa.Integer),
        column('organization_id', sa.Integer),
        column('is_active', sa.Boolean),
        column('is_approved', sa.Boolean),
        column('created_at', sa.DateTime(timezone=True))
    )

    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    # 1. Seed Root Role
    existing_role = session.execute(
        sa.select(roles_table.c.id).where(roles_table.c.name == 'root')
    ).scalar()

    root_role_id = existing_role
    if not existing_role:
        result = session.execute(
            roles_table.insert().values(
                name='root',
                display_name='Root Admin',
                description='Global system administrator with full access.',
                hierarchy_level=110,
                permissions_json={"all": True},
                created_at=sa.func.now()
            ).returning(roles_table.c.id)
        )
        root_role_id = result.scalar()

    # 2. Seed Default Organization
    existing_org = session.execute(
        sa.select(organizations_table.c.id).where(organizations_table.c.slug == 'cadence-ai')
    ).scalar()

    org_id = existing_org
    if not existing_org:
        result = session.execute(
            organizations_table.insert().values(
                name='Cadence AI',
                slug='cadence-ai',
                plan_tier='enterprise',
                is_active=True,
                created_at=sa.func.now()
            ).returning(organizations_table.c.id)
        )
        org_id = result.scalar()

    # 3. Seed Root User
    email = settings.FIRST_SUPERUSER
    password = settings.FIRST_SUPERUSER_PASSWORD

    if email and password:
        existing_user = session.execute(
            sa.select(users_table.c.id).where(users_table.c.email == email)
        ).scalar()

        if not existing_user:
            hashed_pw = get_password_hash(password)
            session.execute(
                users_table.insert().values(
                    email=email,
                    hashed_password=hashed_pw,
                    full_name='System Admin',
                    role='root',
                    role_id=root_role_id,
                    organization_id=org_id,
                    is_active=True,
                    is_approved=True,
                    created_at=sa.func.now()
                )
            )

    session.commit()


def downgrade() -> None:
    """Downgrade schema."""
    # Data migrations typically don't delete data on downgrade to avoid data loss,
    # but strictly speaking we could delete the root user/org/role here.
    pass
