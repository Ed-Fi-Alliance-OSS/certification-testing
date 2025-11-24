# StudentCTEProgramAssociation - Documentation Corrections Needed

## Description

The `Program's Primary Indicator` in the documentation is required to be updated however, in the example table none of the primary indicators are updated. Instead the field updated is the `endDate`.

Additionally, the some fields in the StudentCTEProgramAssociation entity documentation are currently marked as REQUIRED but we need to __VALIDATE__ if they should be marked as OPTIONAL based on the actual API behavior (DataHandbook) and certification scenario requirements.

## Checklist

- [ ] Should `endDate` be UPDATED instead of `Program's Primary Indicator` or decide which field must be UPDATED in the example table and provide data for it.

Should the following fields be marked as OPTIONAL instead of REQUIRED?

- [ ] `nonTraditionalGenderStatus`
- [ ] `privateCTEProgram`
- [ ] `cipCode`
- [ ] `primaryIndicator`
- [ ] `cTEProgramService`

## Next Steps

If any of these fixes apply, the corrections need to be applied to the official Ed-Fi certification documentation, the scenario example data table in `folder.bru`, and the corresponding validation files.
