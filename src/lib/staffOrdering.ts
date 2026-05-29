export type StaffOrderingItem = {
  role_type?: string | null;
  sort_order?: number | null;
  full_name?: string | null;
  name?: string | null;
};

const departmentHeadRoleTypes = new Set([
  "executive",
  "หัวหน้าสาขา",
  "หัวหน้าสาขาวิชา",
]);

function normalizeRoleType(roleType: string | null | undefined) {
  return roleType?.trim().toLowerCase() ?? "";
}

function getSortOrder(item: StaffOrderingItem) {
  return typeof item.sort_order === "number" ? item.sort_order : Number.MAX_SAFE_INTEGER;
}

function getStaffName(item: StaffOrderingItem) {
  return item.full_name ?? item.name ?? "";
}

export function isDepartmentHeadStaffMember(staff: StaffOrderingItem): boolean {
  return departmentHeadRoleTypes.has(normalizeRoleType(staff.role_type));
}

export function sortStaffMembersWithDepartmentHeadFirst<T extends StaffOrderingItem>(
  items: readonly T[]
): T[] {
  return [...items].sort((a, b) => {
    const aIsDepartmentHead = isDepartmentHeadStaffMember(a);
    const bIsDepartmentHead = isDepartmentHeadStaffMember(b);

    if (aIsDepartmentHead !== bIsDepartmentHead) {
      return aIsDepartmentHead ? -1 : 1;
    }

    const aSort = getSortOrder(a);
    const bSort = getSortOrder(b);

    if (aSort !== bSort) return aSort - bSort;

    return getStaffName(a).localeCompare(getStaffName(b), "th");
  });
}
