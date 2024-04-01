------------
---Cohort---
SELECT C.EducationOrganizationId
	 , C.CohortIdentifier
	 , DCT.CodeValue AS [CohortType]
	 , C.CohortDescription
	 , DCS.CodeValue AS [CohortScopeType]
FROM edfi.Cohort C
JOIN edfi.CohortTypeDescriptor CTD ON CTD.CohortTypeDescriptorId = C.CohortTypeDescriptorId
JOIN edfi.Descriptor DCT ON DCT.DescriptorId = CTD.CohortTypeDescriptorId
LEFT JOIN edfi.CohortScopeDescriptor CST ON CST.CohortScopeDescriptorId = C.CohortScopeDescriptorId
LEFT JOIN edfi.Descriptor DCS ON DCS.DescriptorId = CST.CohortScopeDescriptorId

----------------------------
---StaffCohortAssociation---
SELECT SCA.EducationOrganizationId
	 , SCA.CohortIdentifier
	 , SCA.BeginDate
	 , SCA.EndDate
	 , S.StaffUniqueId
FROM edfi.StaffCohortAssociation SCA
JOIN edfi.Staff S ON S.StaffUSI = SCA.StaffUSI
WHERE ((S.FirstName = 'John' AND S.LastSurname = 'Loyo') OR (S.FirstName = 'Jane' AND S.LastSurname = 'Smith'))

------------------------------
---StudentCohortAssociation---
SELECT SCA.EducationOrganizationId
	 , SCA.CohortIdentifier
	 , S.StudentUniqueId
	 , SCA.BeginDate
	 , SCA.EndDate
FROM edfi.StudentCohortAssociation SCA
JOIN edfi.Student S ON S.StudentUSI = SCA.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))