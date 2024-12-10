------------
---School---
SELECT EO.EducationOrganizationId
	 , DAT.CodeValue AS [AddressTypeDescriptor]
	 , EOA.City
	 , EOA.PostalCode
	 , DSA.CodeValue AS [StateAbbreviationDescriptor]
	 , EOA.StreetNumberName
	 , DEOC.CodeValue AS [EducationOrganizationCategoryDescriptor]
	 , DEOIS.CodeValue AS [EducationOrganizationIdentificationSystemDescriptor]
	 , EOIC.IdentificationCode AS [EducationOrganizationIdentificationCode]
	 , DGL.CodeValue AS [SchoolGradeLevel]
	 , DITNT.CodeValue AS [InstitutionTelephoneNumberTypeDescriptor]
	 , EOIT.TelephoneNumber
	 , S.LocalEducationAgencyId
	 , EO.NameOfInstitution
	 , DSC.CodeValue AS [SchoolCategoryDescriptor]
	 , S.SchoolId
	 , EO.ShortNameOfInstitution
FROM edfi.EducationOrganization EO
JOIN edfi.School S ON S.SchoolId = EO.EducationOrganizationId
JOIN edfi.EducationOrganizationAddress EOA ON EOA.EducationOrganizationId = EO.EducationOrganizationId
JOIN edfi.Descriptor DAT ON EOA.AddressTypeDescriptorId = DAT.DescriptorId
JOIN edfi.Descriptor DSA ON EOA.StateAbbreviationDescriptorId = DSA.DescriptorId 
JOIN edfi.EducationOrganizationCategory EOC ON EOC.EducationOrganizationId = EO.EducationOrganizationId
JOIN edfi.Descriptor DEOC ON EOC.EducationOrganizationCategoryDescriptorId = DEOC.DescriptorId
LEFT JOIN edfi.EducationOrganizationIdentificationCode EOIC ON EO.EducationOrganizationId = EOIC.EducationOrganizationId
LEFT JOIN edfi.EducationOrganizationIdentificationSystemDescriptor EOISD
	ON EOIC.EducationOrganizationIdentificationSystemDescriptorId = EOISD.EducationOrganizationIdentificationSystemDescriptorId
LEFT JOIN edfi.Descriptor DEOIS ON DEOIS.DescriptorId = EOISD.EducationOrganizationIdentificationSystemDescriptorId
JOIN edfi.SchoolGradeLevel SGL ON SGL.SchoolId = S.SchoolId
JOIN edfi.GradeLevelDescriptor GLD ON GLD.GradeLevelDescriptorId = SGL.GradeLevelDescriptorId
JOIN edfi.Descriptor DGL ON DGL.DescriptorId = GLD.GradeLevelDescriptorId
LEFT JOIN edfi.EducationOrganizationInstitutionTelephone EOIT ON EOIT.EducationOrganizationId = EO.EducationOrganizationId
LEFT JOIN edfi.Descriptor DITNT ON DITNT.DescriptorId = EOIT.InstitutionTelephoneNumberTypeDescriptorId
LEFT JOIN edfi.SchoolCategory SC ON SC.SchoolId = S.SchoolId
LEFT JOIN edfi.Descriptor DSC ON DSC.DescriptorId = SC.SchoolCategoryDescriptorId
WHERE EO.EducationOrganizationId IN (255901333, 255901444)

------------
---Course---
SELECT DAS.CodeValue AS [AcademicSubjectDescriptor]
     , C.CourseCode
	 , DCIS.CodeValue AS [CourseIdentificationSystemDescriptor]
     , CIC.IdentificationCode
	 , DCLC.CodeValue AS [CourseLevelCharacteristicTypeDescriptor]
     , C.CourseTitle
     , C.EducationOrganizationId
     , C.NumberOfParts
	 , C.MaxCompletionsForCredit
FROM edfi.Course C
LEFT JOIN edfi.AcademicSubjectDescriptor ASD ON ASD.AcademicSubjectDescriptorId = C.AcademicSubjectDescriptorId
LEFT JOIN edfi.Descriptor DAS ON DAS.DescriptorId = ASD.AcademicSubjectDescriptorId
JOIN edfi.CourseIdentificationCode CIC ON CIC.CourseCode = C.CourseCode
	AND CIC.EducationOrganizationId = C.EducationOrganizationId
JOIN edfi.CourseIdentificationSystemDescriptor CISD ON CIC.CourseIdentificationSystemDescriptorId = CISD.CourseIdentificationSystemDescriptorId
JOIN edfi.Descriptor DCIS ON DCIS.DescriptorId = CISD.CourseIdentificationSystemDescriptorId
LEFT JOIN edfi.CourseLevelCharacteristic CLC ON C.CourseCode = CLC.CourseCode
	AND CLC.EducationOrganizationId = C.EducationOrganizationId
LEFT JOIN edfi.Descriptor DCLC ON CLC.CourseLevelCharacteristicDescriptorId = DCLC.DescriptorId
WHERE C.CourseCode IN ('03100500', 'ART 01')

-------------
---Program---
SELECT P.EducationOrganizationId
	 , P.ProgramId
	 , P.ProgramName
	 , DPT.CodeValue AS [ProgramTypeDescriptor]
FROM edfi.Program P
JOIN edfi.ProgramTypeDescriptor PTD ON P.ProgramTypeDescriptorId = PTD.ProgramTypeDescriptorId
JOIN edfi.Descriptor DPT ON PTD.ProgramTypeDescriptorId = DPT.DescriptorId
WHERE DPT.CodeValue = 'Bilingual'

-----------------
---ClassPeriod---
SELECT CP.ClassPeriodName
     , CP.SchoolId
	 , CPMT.StartTime
	 , CPMT.EndTime
FROM edfi.ClassPeriod CP
LEFT JOIN edfi.ClassPeriodMeetingTime CPMT
	ON CPMT.ClassPeriodName = CP.ClassPeriodName AND CPMT.SchoolId = CP.SchoolId
WHERE CP.SchoolId IN (255901001,255901107)
	AND CP.ClassPeriodName IN ('Class Period 1','Class Period 01')

--------------
---Location---
SELECT L.ClassroomIdentificationCode
	 , L.SchoolId
	 , L.MaximumNumberOfSeats
FROM edfi.Location L
WHERE L.SchoolId IN (255901107,255901001) 
	AND L.ClassroomIdentificationCode IN ('501','901')