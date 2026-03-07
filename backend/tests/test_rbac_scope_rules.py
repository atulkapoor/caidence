from app.services.rbac_scope import is_role_assignable


def test_root_can_assign_any_role():
    assert is_role_assignable("root", "root") is True
    assert is_role_assignable("root", "super_admin") is True
    assert is_role_assignable("root", "brand_member") is True


def test_super_admin_cannot_assign_root():
    assert is_role_assignable("super_admin", "root") is False
    assert is_role_assignable("super_admin", "super_admin") is False
    assert is_role_assignable("super_admin", "org_admin") is True
    assert is_role_assignable("super_admin", "brand_member") is True


def test_brand_admin_strict_child_role():
    assert is_role_assignable("brand_admin", "brand_member") is True
    assert is_role_assignable("brand_admin", "creator") is False
    assert is_role_assignable("brand_admin", "agency_member") is False


def test_agency_and_org_admin_strict_child_role():
    assert is_role_assignable("agency_admin", "agency_member") is True
    assert is_role_assignable("agency_admin", "brand_admin") is False
    assert is_role_assignable("org_admin", "agency_member") is True
    assert is_role_assignable("org_admin", "brand_member") is False
