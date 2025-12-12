# MasterSchedule - Sections - Documentation Corrections Needed

## Description

The following fields in the Sections entity documentation are currently marked as REQUIRED, but should be __REMOVED__ as they don't exists in the API/Entity Model.

## Checklist

- [ ] `Sections`.`SchoolReference` should be REMOVED (line 48)
- [ ] `SchoolReference`.`schoolId` should be REMOVED (line 49)

## Next Steps

These corrections need to be applied to the official Ed-Fi API [Section Documentation](https://docs.ed-fi.org/partners/certification/available-certifications/sis-v4/test-scenarios/section-scenarios).
