# MasterSchedule - Sections - Documentation Corrections Needed

## Description

The following fields in the Sections entity documentation should be updated, since they don't exists in the API/Entity Model. Instead `locationSchoolReference` and `locationReference`.`schoolId` should be validated.

## Checklist

- [ ] `Sections`.`SchoolReference` should be `REMOVED` (line 48)
- [ ] `SchoolReference`.`schoolId` should be `REMOVED` (line 49)
- [ ] `locationSchoolReference`.`schoolId` should be `ADDED` and set as `REQUIRED`
- [ ] `locationReference`.`schoolId` should be set as `REQUIRED` (no changes needed, that's the current behaviour).

> These changes were already applied to the Bruno solution, however, they are still pending to be updated in the official documentation.


## Next Steps

These corrections need to be applied to the official Ed-Fi API [Section Documentation](https://docs.ed-fi.org/partners/certification/available-certifications/sis-v4/test-scenarios/section-scenarios).
