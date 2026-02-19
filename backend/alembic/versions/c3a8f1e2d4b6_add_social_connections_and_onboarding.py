"""Add social_connections, onboarding_progress, audit_log, access_logs tables + profile_type to users

Revision ID: c3a8f1e2d4b6
Revises: ba4b43132dd1
Create Date: 2026-02-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3a8f1e2d4b6'
down_revision: Union[str, Sequence[str], None] = 'ba4b43132dd1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Social connections table
    op.create_table('social_connections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('platform_user_id', sa.String(), nullable=True),
        sa.Column('platform_username', sa.String(), nullable=True),
        sa.Column('platform_display_name', sa.String(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('scopes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('follower_count', sa.Integer(), nullable=True),
        sa.Column('profile_picture_url', sa.String(), nullable=True),
        sa.Column('raw_profile_json', sa.Text(), nullable=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('social_connections', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_social_connections_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_social_connections_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_social_connections_platform'), ['platform'], unique=False)

    # Onboarding progress table
    op.create_table('onboarding_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('profile_type', sa.String(), nullable=True),
        sa.Column('current_step', sa.Integer(), nullable=True),
        sa.Column('completed_steps', sa.Text(), nullable=True),
        sa.Column('is_complete', sa.Boolean(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('step_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('onboarding_progress', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_onboarding_progress_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_onboarding_progress_user_id'), ['user_id'], unique=True)

    # Add profile_type column to users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('profile_type', sa.String(), nullable=True))

    # RBAC audit_log table (was missing from initial migration)
    op.create_table('audit_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=False),
        sa.Column('actor_email', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('target_user_id', sa.Integer(), nullable=True),
        sa.Column('target_user_email', sa.String(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('audit_log', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_audit_log_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_audit_log_action'), ['action'], unique=False)
        batch_op.create_index(batch_op.f('ix_audit_log_created_at'), ['created_at'], unique=False)

    # RBAC access_logs table (was missing from initial migration)
    op.create_table('access_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('user_email', sa.String(), nullable=True),
        sa.Column('user_role', sa.String(), nullable=True),
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('method', sa.String(), nullable=False),
        sa.Column('resource', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=True),
        sa.Column('result', sa.String(), nullable=False),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('access_logs', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_access_logs_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_access_logs_result'), ['result'], unique=False)
        batch_op.create_index(batch_op.f('ix_access_logs_created_at'), ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('access_logs', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_access_logs_created_at'))
        batch_op.drop_index(batch_op.f('ix_access_logs_result'))
        batch_op.drop_index(batch_op.f('ix_access_logs_id'))

    op.drop_table('access_logs')

    with op.batch_alter_table('audit_log', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_audit_log_created_at'))
        batch_op.drop_index(batch_op.f('ix_audit_log_action'))
        batch_op.drop_index(batch_op.f('ix_audit_log_id'))

    op.drop_table('audit_log')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('profile_type')

    with op.batch_alter_table('onboarding_progress', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_onboarding_progress_user_id'))
        batch_op.drop_index(batch_op.f('ix_onboarding_progress_id'))

    op.drop_table('onboarding_progress')

    with op.batch_alter_table('social_connections', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_social_connections_platform'))
        batch_op.drop_index(batch_op.f('ix_social_connections_user_id'))
        batch_op.drop_index(batch_op.f('ix_social_connections_id'))

    op.drop_table('social_connections')
