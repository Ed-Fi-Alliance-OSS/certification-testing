--------------------
---GraduationPlan---
SELECT GP.EducationOrganizationId
	 , GP.GraduationSchoolYear
	 , GP.TotalRequiredCredits
	 , DGPT.CodeValue AS [GraduationPlanTypeDescriptor]
FROM edfi.GraduationPlan GP
JOIN edfi.GraduationPlanTypeDescriptor GPTD ON GPTD.GraduationPlanTypeDescriptorId = GP.GraduationPlanTypeDescriptorId
JOIN edfi.Descriptor DGPT ON DGPT.DescriptorId = GPTD.GraduationPlanTypeDescriptorId
WHERE GP.EducationOrganizationId = 255901001

------------------------------
---StudentSchoolAssociation---
SELECT SSA.SchoolId
	 , S.StudentUniqueId
	 , GP.EducationOrganizationId AS [GraduationPlanEducationOrganizationId]
	 , GP.GraduationSchoolYear
	 , DGPT.CodeValue AS [GraduationPlanType]
	 , SSA.EntryDate
	 , DGL.CodeValue AS [EntryGradeLevelDescriptor]
	 , CSYT.SchoolYearDescription AS [ClassOfSchoolYear]
	 , SYT.SchoolYearDescription AS [SchoolYear]
	 , DET.CodeValue AS [EntryTypeDescriptor]
	 , SSA.ExitWithdrawDate
	 , DEWT.CodeValue AS [ExitWithdrawTypeDescriptor]
	 , SSA.RepeatGradeIndicator
	 , DRS.CodeValue AS [ResidencyStatusDescriptor]
	 , SSA.SchoolChoiceTransfer
FROM edfi.StudentSchoolAssociation SSA
JOIN edfi.Student S ON S.StudentUSI = SSA.StudentUSI
LEFT JOIN edfi.GraduationPlan GP ON GP.GraduationPlanTypeDescriptorId = SSA.GraduationPlanTypeDescriptorId
	AND GP.EducationOrganizationId = SSA.EducationOrganizationId
	AND GP.GraduationSchoolYear = SSA.GraduationSchoolYear
LEFT JOIN edfi.GraduationPlanTypeDescriptor GPTD ON GPTD.GraduationPlanTypeDescriptorId = GP.GraduationPlanTypeDescriptorId
LEFT JOIN edfi.Descriptor DGPT ON DGPT.DescriptorId = GPTD.GraduationPlanTypeDescriptorId
JOIN edfi.GradeLevelDescriptor GLD ON GLD.GradeLevelDescriptorId = SSA.EntryGradeLevelDescriptorId
JOIN edfi.Descriptor DGL ON DGL.DescriptorId = GLD.GradeLevelDescriptorId
LEFT JOIN edfi.SchoolYearType CSYT ON CSYT.SchoolYear = SSA.ClassOfSchoolYear
LEFT JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = SSA.SchoolYear
LEFT JOIN edfi.EntryTypeDescriptor ETD ON ETD.EntryTypeDescriptorId = SSA.EntryTypeDescriptorId
LEFT JOIN edfi.Descriptor DET ON DET.DescriptorId = ETD.EntryTypeDescriptorId
LEFT JOIN edfi.ExitWithdrawTypeDescriptor EWTD ON EWTD.ExitWithdrawTypeDescriptorId = SSA.ExitWithdrawTypeDescriptorId
LEFT JOIN edfi.Descriptor DEWT ON DEWT.DescriptorId = EWTD.ExitWithdrawTypeDescriptorId
LEFT JOIN edfi.ResidencyStatusDescriptor RSD ON RSD.ResidencyStatusDescriptorId = SSA.ResidencyStatusDescriptorId
LEFT JOIN edfi.Descriptor DRS ON DRS.DescriptorId = RSD.ResidencyStatusDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))

---------------------------------------------
---StudentEducationOrganizationAssociation---
SELECT S.StudentUniqueId
	 , SEOA.EducationOrganizationId
	 , DLEP.CodeValue AS [LimitedEnglishProficiencyDescriptor]
	 , DSC.CodeValue AS [StudentCharacteristicDescriptor]
	 , SEOASI.IndicatorName
	 , SEOASI.Indicator
	 , SEOASIC.AssigningOrganizationIdentificationCode
	 , SEOASIC.IdentificationCode
	 , DSIS.CodeValue AS [StudentIdentificationSystemDescriptor]
	 , DS.CodeValue AS [SexDescriptor]
	 , DAT.CodeValue AS [AddressTypeDescriptor]
	 , SA.City
	 , SA.PostalCode
	 , DASA.CodeValue AS [StateAbbreviationDescriptor]
	 , SA.StreetNumberName
	 , STP.TelephoneNumber
	 , DTNT.CodeValue AS [TelephoneNumberTypeDescriptor]
	 , SEM.ElectronicMailAddress
	 , DEMT.CodeValue AS [ElectronicMailTypeDescriptor]
	 , SEOA.HispanicLatinoEthnicity
	 , DR.CodeValue AS [RaceDescriptor]
	 , DL.CodeValue AS [LanguageDescriptor]
	 , DLU.CodeValue AS [LanguageUseDescriptor]
FROM edfi.StudentEducationOrganizationAssociation SEOA
JOIN edfi.Student S ON S.StudentUSI = SEOA.StudentUSI
JOIN edfi.LimitedEnglishProficiencyDescriptor LEPD on SEOA.LimitedEnglishProficiencyDescriptorId = LEPD.LimitedEnglishProficiencyDescriptorId
JOIN edfi.Descriptor DLEP on DLEP.DescriptorId  = LEPD.LimitedEnglishProficiencyDescriptorId
JOIN edfi.StudentEducationOrganizationAssociationStudentCharacteristic SEOASC on SEOASC.StudentUSI = S.StudentUSI
JOIN edfi.Descriptor DSC on DSC.DescriptorId = SEOASC.StudentCharacteristicDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationStudentIndicator SEOASI on SEOASI.StudentUSI = SEOA.StudentUSI
and SEOA.EducationOrganizationId = SEOASI.EducationOrganizationId
LEFT JOIN edfi.StudentEducationOrganizationAssociationStudentIdentificationCode SEOASIC ON SEOASIC.StudentUSI = SEOA.StudentUSI
	AND SEOASIC.EducationOrganizationId = SEOA.EducationOrganizationId
LEFT JOIN edfi.StudentIdentificationSystemDescriptor SISD 
	ON SISD.StudentIdentificationSystemDescriptorId = SEOASIC.StudentIdentificationSystemDescriptorId
LEFT JOIN edfi.Descriptor DSIS ON DSIS.DescriptorId = SISD.StudentIdentificationSystemDescriptorId
JOIN edfi.SexDescriptor SD ON SD.SexDescriptorId = SEOA.SexDescriptorId
JOIN edfi.Descriptor DS ON DS.DescriptorId = SD.SexDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationAddress SA ON SA.StudentUSI = SEOA.StudentUSI
	AND SA.EducationOrganizationId = SEOA.EducationOrganizationId
LEFT JOIN edfi.AddressTypeDescriptor ATD ON ATD.AddressTypeDescriptorId = SA.AddressTypeDescriptorId
LEFT JOIN edfi.Descriptor DAT ON DAT.DescriptorId = ATD.AddressTypeDescriptorId
LEFT JOIN edfi.StateAbbreviationDescriptor ASAD ON ASAD.StateAbbreviationDescriptorId = SA.StateAbbreviationDescriptorId
LEFT JOIN edfi.Descriptor DASA ON DASA.DescriptorId = ASAD.StateAbbreviationDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationTelephone STP ON STP.StudentUSI = SEOA.StudentUSI
	AND SEOA.EducationOrganizationId = STP.EducationOrganizationId
LEFT JOIN edfi.TelephoneNumberTypeDescriptor TNTD ON TNTD.TelephoneNumberTypeDescriptorId = STP.TelephoneNumberTypeDescriptorId
LEFT JOIN edfi.Descriptor DTNT ON DTNT.DescriptorId = TNTD.TelephoneNumberTypeDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationElectronicMail SEM ON SEM.StudentUSI = SEOA.StudentUSI
	AND SEOA.EducationOrganizationId = SEM.EducationOrganizationId
LEFT JOIN edfi.ElectronicMailTypeDescriptor EMD ON EMD.ElectronicMailTypeDescriptorId = SEM.ElectronicMailTypeDescriptorId
LEFT JOIN edfi.Descriptor DEMT ON DEMT.DescriptorId = EMD.ElectronicMailTypeDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationRace SR ON SR.StudentUSI = SEOA.StudentUSI
	AND SEOA.EducationOrganizationId = SR.EducationOrganizationId
LEFT JOIN edfi.RaceDescriptor RD ON RD.RaceDescriptorId = SR.RaceDescriptorId
LEFT JOIN edfi.Descriptor DR ON DR.DescriptorId = RD.RaceDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationLanguage SL ON SL.StudentUSI = SEOA.StudentUSI
	AND SEOA.EducationOrganizationId = SL.EducationOrganizationId
LEFT JOIN edfi.LanguageDescriptor LD ON LD.LanguageDescriptorId = SL.LanguageDescriptorId
LEFT JOIN edfi.Descriptor DL ON DL.DescriptorId = LD.LanguageDescriptorId
LEFT JOIN edfi.StudentEducationOrganizationAssociationLanguageUse SLU ON SLU.LanguageDescriptorId = SL.LanguageDescriptorId
	AND SLU.StudentUSI = SL.StudentUSI
LEFT JOIN edfi.LanguageUseDescriptor LUD ON LUD.LanguageUseDescriptorId = SLU.LanguageUseDescriptorId
LEFT JOIN edfi.Descriptor DLU on DLU.DescriptorId = LUD.LanguageUseDescriptorId
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))

-------------------------------
---StudentSectionAssociation---
SELECT Se.LocalCourseCode
	 , Se.SchoolId
	 , SYT.SchoolYearDescription
	 , Se.SectionIdentifier
	 , Se.SessionName
	 , S.StudentUniqueId
	 , SSA.BeginDate
	 , SSA.EndDate
	 , SSA.HomeroomIndicator
FROM edfi.StudentSectionAssociation SSA
JOIN edfi.Section Se ON Se.SchoolId = SSA.SchoolId
	AND Se.LocalCourseCode = SSA.LocalCourseCode
	AND Se.SchoolYear = SSA.SchoolYear
	AND Se.SectionIdentifier = SSA.SectionIdentifier
JOIN edfi.SchoolYearType SYT ON SYT.SchoolYear = Se.SchoolYear
JOIN edfi.Student S ON S.StudentUSI = SSA.StudentUSI
WHERE ((S.FirstName = 'Austin' AND S.LastSurname = 'Jones') OR (S.FirstName = 'Madison' AND S.LastSurname = 'Johnson'))