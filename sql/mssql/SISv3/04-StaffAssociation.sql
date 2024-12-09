-----------
---Staff---
SELECT S.StaffUniqueId
	 , S.FirstName
	 , S.HispanicLatinoEthnicity
	 , S.LastSurname
	 , S.BirthDate
	 , S.GenerationCodeSuffix
	 , DLE.CodeValue AS [HighestCompletedLevelOfEductaionDescriptor]
	 , S.HighlyQualifiedTeacher
	 , S.MiddleName
	 --, S.PersonalTitlePrefix
	 , DS.CodeValue [SexDescriptor]
	 , SEM.ElectronicMailAddress
	 , DEMT.CodeValue AS [ElectronicMailTypeDescriptor]
	 , SIC.IdentificationCode
	 , DSIS.CodeValue AS [StaffIdentificationSystemDescriptor]
	 , DR.CodeValue AS [RaceDescriptor]
FROM edfi.Staff S
LEFT JOIN edfi.LevelOfEducationDescriptor LED ON LED.LevelOfEducationDescriptorId = S.HighestCompletedLevelOfEducationDescriptorId
LEFT JOIN edfi.Descriptor DLE ON DLE.DescriptorId = LED.LevelOfEducationDescriptorId
LEFT JOIN edfi.SexDescriptor SD ON SD.SexDescriptorId = S.SexDescriptorId
LEFT JOIN edfi.Descriptor DS ON DS.DescriptorId = SD.SexDescriptorId
LEFT JOIN edfi.StaffElectronicMail SEM ON SEM.StaffUSI = S.StaffUSI
LEFT JOIN edfi.ElectronicMailTypeDescriptor EMTD ON EMTD.ElectronicMailTypeDescriptorId = SEM.ElectronicMailTypeDescriptorId
LEFT JOIN edfi.Descriptor DEMT ON DEMT.DescriptorId = EMTD.ElectronicMailTypeDescriptorId
LEFT JOIN edfi.StaffIdentificationCode SIC ON SIC.StaffUSI = S.StaffUSI
LEFT JOIN edfi.StaffIdentificationSystemDescriptor SISD ON SISD.StaffIdentificationSystemDescriptorId = SIC.StaffIdentificationSystemDescriptorId
LEFT JOIN edfi.Descriptor DSIS ON DSIS.DescriptorId = SISD.StaffIdentificationSystemDescriptorId
LEFT JOIN edfi.StaffRace SR ON SR.StaffUSI = S.StaffUSI
LEFT JOIN edfi.RaceDescriptor RD ON RD.RaceDescriptorId = SR.RaceDescriptorId
LEFT JOIN edfi.Descriptor DR on DR.DescriptorId = RD.RaceDescriptorId
WHERE (S.FirstName = 'John' AND S.LastSurname = 'Loyo') OR (S.FirstName = 'Jane' AND S.LastSurname = 'Smith')

-----------------------------------------------------
---StaffEducationOrganizationAssignmentAssociation---
SELECT S.StaffUniqueId
	 , SEOAA.BeginDate
	 , SEOAA.EducationOrganizationId
	 , DSC.CodeValue AS [StaffClassificationDescriptor]
     , SEOAA.EndDate
	 , SEOAA.PositionTitle
FROM edfi.StaffEducationOrganizationAssignmentAssociation SEOAA
JOIN edfi.Staff S ON SEOAA.StaffUSI = S.StaffUSI
JOIN edfi.StaffClassificationDescriptor SCD ON SEOAA.StaffClassificationDescriptorId = SCD.StaffClassificationDescriptorId
JOIN edfi.Descriptor DSC ON DSC.DescriptorId = SCD.StaffClassificationDescriptorId
WHERE ((S.FirstName = 'John' AND S.LastSurname = 'Loyo') OR (S.FirstName = 'Jane' AND S.LastSurname = 'Smith'))
	AND SEOAA.EducationOrganizationId IN (255901107,255901001)

----------------------------
---StaffSchoolAssociation---
SELECT SSA.SchoolId
	 , S.StaffUniqueId
	 , DAS.CodeValue AS [AcademicSubjectDescriptor]
	 , DGL.CodeValue AS [GradeLevelDescriptor]
FROM edfi.StaffSchoolAssociation SSA
JOIN edfi.Staff S ON S.StaffUSI = SSA.StaffUSI
LEFT JOIN edfi.StaffSchoolAssociationAcademicSubject SSAAS ON SSAAS.StaffUSI = SSA.StaffUSI
	AND SSAAS.SchoolId = SSA.SchoolId
	AND SSAAS.ProgramAssignmentDescriptorId = SSA.ProgramAssignmentDescriptorId
LEFT JOIN edfi.AcademicSubjectDescriptor ASD ON ASD.AcademicSubjectDescriptorId = SSAAS.AcademicSubjectDescriptorId
LEFT JOIN edfi.Descriptor DAS ON DAS.DescriptorId = ASD.AcademicSubjectDescriptorId
LEFT JOIN edfi.StaffSchoolAssociationGradeLevel SSAGL ON SSAGL.ProgramAssignmentDescriptorId = SSA.ProgramAssignmentDescriptorId
	AND SSAGL.SchoolId = SSA.SchoolId
	AND SSAGL.StaffUSI = SSA.StaffUSI
LEFT JOIN edfi.GradeLevelDescriptor GLD ON GLD.GradeLevelDescriptorId = SSAGL.GradeLevelDescriptorId
LEFT JOIN edfi.Descriptor DGL ON DGL.DescriptorId = GLD.GradeLevelDescriptorId
WHERE ((S.FirstName = 'John' AND S.LastSurname = 'Loyo') OR (S.FirstName = 'Jane' AND S.LastSurname = 'Smith'))
	AND SSA.SchoolId IN (255901107,255901001)

-----------------------------
---StaffSectionAssociation---
SELECT Se.LocalCourseCode
     , Se.SchoolId
	 , SYT.SchoolYearDescription
	 , Se.SessionName
	 , Se.SectionIdentifier
	 , S.StaffUniqueId
	 , DCP.CodeValue AS [ClassroomPositionDescriptor]
	 , SSA.BeginDate
FROM edfi.StaffSectionAssociation SSA
JOIN edfi.Section Se ON Se.SchoolId = SSA.SchoolId
	AND Se.LocalCourseCode = SSA.LocalCourseCode
	AND Se.SchoolYear = SSA.SchoolYear
	AND Se.SectionIdentifier = SSA.SectionIdentifier
	AND Se.SessionName = SSA.SessionName
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = Se.SchoolYear
JOIN edfi.Staff S ON S.StaffUSI = SSA.StaffUSI
JOIN edfi.ClassroomPositionDescriptor CPD ON CPD.ClassroomPositionDescriptorId = SSA.ClassroomPositionDescriptorId
JOIN edfi.Descriptor DCP ON DCP.DescriptorId = CPD.ClassroomPositionDescriptorId
WHERE ((S.FirstName = 'John' AND S.LastSurname = 'Loyo') OR (S.FirstName = 'Jane' AND S.LastSurname = 'Smith'))